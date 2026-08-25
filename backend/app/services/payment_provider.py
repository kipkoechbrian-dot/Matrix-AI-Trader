"""
Payment rails.

Two providers behind a uniform shape:

  • M-Pesa (Safaricom Daraja) — real STK Push when MPESA_* env vars are
    configured; otherwise a faithful demo: the payment stays PENDING for
    a few seconds (as if the user is entering their PIN) and completes.

  • Card — Stripe-style charge. Real Stripe when STRIPE_SECRET_KEY is
    set; otherwise a test-gateway that instantly validates and approves
    (never stores full card numbers or CVVs — last4 + brand only).

Amounts: the wallet is USD-denominated. M-Pesa charges in KES at a
fixed conversion (KES_PER_USD).
"""

import base64
import os
import re
import time
import uuid
from datetime import datetime

import requests

KES_PER_USD = 129.0

MPESA_CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY", "").strip()
MPESA_CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET", "").strip()
MPESA_SHORTCODE = os.getenv("MPESA_SHORTCODE", "").strip()
MPESA_PASSKEY = os.getenv("MPESA_PASSKEY", "").strip()
MPESA_BASE = os.getenv(
    "MPESA_BASE", "https://sandbox.safaricom.co.ke"
).rstrip("/")

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "").strip()

REQUEST_TIMEOUT = 12


def mpesa_configured() -> bool:
    return all(
        [MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY]
    )


def stripe_configured() -> bool:
    return bool(STRIPE_SECRET_KEY)


# ---------------------------------------------------------------------------
# M-Pesa (Daraja)
# ---------------------------------------------------------------------------

def normalize_msisdn(phone: str) -> str | None:
    """Accept 0712.., +254712.., 254712.. -> 254712345678."""
    digits = re.sub(r"\D", "", phone or "")
    if digits.startswith("0") and len(digits) == 10:
        digits = "254" + digits[1:]
    if re.fullmatch(r"2547\d{8}", digits) or re.fullmatch(r"2541\d{8}", digits):
        return digits
    return None


def _daraja_token() -> str | None:
    try:
        res = requests.get(
            f"{MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials",
            auth=(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET),
            timeout=REQUEST_TIMEOUT,
        )
        res.raise_for_status()
        return res.json().get("access_token")
    except (requests.RequestException, ValueError):
        return None


def mpesa_stk_push(phone: str, kes_amount: float, account_ref: str, callback_url: str) -> dict:
    """
    Initiate an STK push. Returns
      { ok, ref, message, live }
    """
    if not mpesa_configured():
        # Demo mode — same contract, push completes via scheduler
        return {
            "ok": True,
            "ref": f"ws_CO_demo_{int(time.time())}_{uuid.uuid4().hex[:8]}",
            "message": "STK push sent (demo mode — completes automatically)",
            "live": False,
        }

    token = _daraja_token()
    if token is None:
        return {"ok": False, "ref": None, "message": "Daraja auth failed", "live": True}

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password = base64.b64encode(
        f"{MPESA_SHORTCODE}{MPESA_PASSKEY}{timestamp}".encode()
    ).decode()

    payload = {
        "BusinessShortCode": MPESA_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(round(kes_amount)),
        "PartyA": phone,
        "PartyB": MPESA_SHORTCODE,
        "PhoneNumber": phone,
        "CallBackURL": callback_url,
        "AccountReference": account_ref,
        "TransactionDesc": "Matrix AI Trader wallet deposit",
    }

    try:
        res = requests.post(
            f"{MPESA_BASE}/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=REQUEST_TIMEOUT,
        )
        data = res.json()
    except (requests.RequestException, ValueError):
        return {"ok": False, "ref": None, "message": "STK push request failed", "live": True}

    code = data.get("ResponseCode")
    if code == "0":
        return {
            "ok": True,
            "ref": data.get("CheckoutRequestID"),
            "message": "STK push sent — check your phone and enter your M-Pesa PIN",
            "live": True,
        }
    return {
        "ok": False,
        "ref": None,
        "message": data.get("ResponseDescription", "STK push rejected"),
        "live": True,
    }


# ---------------------------------------------------------------------------
# Card (Stripe-style)
# ---------------------------------------------------------------------------

def card_brand(number: str) -> str:
    if number.startswith("4"):
        return "Visa"
    if number.startswith(("51", "52", "53", "54", "55")):
        return "Mastercard"
    if number.startswith(("34", "37")):
        return "Amex"
    return "Card"


def luhn_ok(number: str) -> bool:
    digits = [int(d) for d in number]
    total = 0
    for i, d in enumerate(reversed(digits)):
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


def charge_card(number: str, expiry: str, cvc: str, amount_usd: float) -> dict:
    """
    Returns { ok, ref, message, last4, brand, live }
    """
    number = re.sub(r"\D", "", number or "")
    if not (13 <= len(number) <= 19) or not luhn_ok(number):
        return {"ok": False, "ref": None, "message": "Invalid card number", "live": stripe_configured()}

    if not re.fullmatch(r"(0[1-9]|1[0-2])/?\d{2}", (expiry or "").replace(" ", "")):
        return {"ok": False, "ref": None, "message": "Invalid expiry (MM/YY)", "live": stripe_configured()}

    if not re.fullmatch(r"\d{3,4}", cvc or ""):
        return {"ok": False, "ref": None, "message": "Invalid CVC", "live": stripe_configured()}

    brand = card_brand(number)
    last4 = number[-4:]

    if not stripe_configured():
        # Test gateway — approves valid-format cards
        return {
            "ok": True,
            "ref": f"pi_demo_{uuid.uuid4().hex[:16]}",
            "message": f"{brand} •••• {last4} approved (test gateway)",
            "last4": last4,
            "brand": brand,
            "live": False,
        }

    # Real Stripe charge via PaymentMethod + PaymentIntent (simplified;
    # production should use Stripe.js tokenization client-side)
    try:
        pm = requests.post(
            "https://api.stripe.com/v1/payment_methods",
            auth=(STRIPE_SECRET_KEY, ""),
            data={
                "type": "card",
                "card[number]": number,
                "card[exp_month]": expiry.replace(" ", "")[:2],
                "card[exp_year]": "20" + expiry.replace(" ", "")[-2:],
                "card[cvc]": cvc,
            },
            timeout=REQUEST_TIMEOUT,
        ).json()
        if "id" not in pm:
            return {"ok": False, "ref": None, "message": pm.get("error", {}).get("message", "Card declined"), "live": True}

        intent = requests.post(
            "https://api.stripe.com/v1/payment_intents",
            auth=(STRIPE_SECRET_KEY, ""),
            data={
                "amount": int(round(amount_usd * 100)),
                "currency": "usd",
                "payment_method": pm["id"],
                "confirm": "true",
                "return_url": "https://matrix.ai/payments/return",
                "description": "Matrix AI Trader wallet deposit",
            },
            timeout=REQUEST_TIMEOUT,
        ).json()

        if intent.get("status") in ("succeeded", "processing"):
            return {
                "ok": True,
                "ref": intent["id"],
                "message": f"Card charged ({intent['status']})",
                "last4": last4,
                "brand": brand,
                "live": True,
            }
        return {"ok": False, "ref": None, "message": intent.get("last_payment_error", {}).get("message", "Payment failed"), "live": True}
    except (requests.RequestException, ValueError):
        return {"ok": False, "ref": None, "message": "Card network error", "live": True}
