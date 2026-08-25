from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.authentication.dependencies import get_current_user
from app.database.session import get_db
from app.models.payment import Payment
from app.models.user import User
from app.services.payment_provider import (
    KES_PER_USD,
    charge_card,
    mpesa_stk_push,
    normalize_msisdn,
)
from app.services.payment_service import (
    complete_payment,
    create_payment,
    fail_payment,
    schedule_demo_settlement,
)

router = APIRouter(tags=["Payments"])

MIN_DEPOSIT = 5.0
MAX_DEPOSIT = 100_000.0


class DepositRequest(BaseModel):
    method: str = Field(pattern="^(MPESA|CARD)$")
    amount: float = Field(gt=0)
    phone: Optional[str] = None          # M-Pesa
    card_number: Optional[str] = None    # Card
    card_expiry: Optional[str] = None
    card_cvc: Optional[str] = None


class CallbackItem(BaseModel):
    Name: str
    Value: Optional[object] = None


def serialize(p: Payment) -> dict:
    return {
        "id": p.id,
        "method": p.method,
        "amount": p.amount,
        "kes_amount": p.kes_amount,
        "phone": p.phone,
        "card_brand": p.card_brand,
        "card_last4": p.card_last4,
        "status": p.status,
        "provider_ref": p.provider_ref,
        "failure_reason": p.failure_reason,
        "created_at": p.created_at,
        "completed_at": p.completed_at,
    }


@router.post("/payments/deposit", status_code=202)
def deposit(
    body: DepositRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not (MIN_DEPOSIT <= body.amount <= MAX_DEPOSIT):
        raise HTTPException(
            400, f"Deposit must be between ${MIN_DEPOSIT} and ${MAX_DEPOSIT}."
        )

    if body.method == "MPESA":
        phone = normalize_msisdn(body.phone or "")
        if phone is None:
            raise HTTPException(
                400, "Enter a valid Safaricom number (e.g. 0712 345 678)."
            )

        kes = body.amount * KES_PER_USD
        callback_url = str(
            request.base_url.replace(path="/api/v1/payments/mpesa/callback")
        )

        push = mpesa_stk_push(phone, kes, f"MATRIX{current_user.id}", callback_url)
        if not push["ok"]:
            raise HTTPException(502, push["message"])

        payment = create_payment(
            db, current_user.id, "MPESA", body.amount,
            phone=phone, card_last4=None, card_brand=None,
            provider_ref=push["ref"],
        )

        if not push["live"]:
            schedule_demo_settlement(payment.id)

        return {
            "payment": serialize(payment),
            "message": push["message"],
            "live": push["live"],
        }

    # ---------------- Card ----------------
    charge = charge_card(
        body.card_number or "",
        body.card_expiry or "",
        body.card_cvc or "",
        body.amount,
    )
    if not charge["ok"]:
        raise HTTPException(402, charge["message"])

    payment = create_payment(
        db, current_user.id, "CARD", body.amount,
        phone=None, card_last4=charge.get("last4"), card_brand=charge.get("brand"),
        provider_ref=charge["ref"],
    )

    schedule_demo_settlement(payment.id, seconds=3)

    return {
        "payment": serialize(payment),
        "message": charge["message"],
        "live": charge["live"],
    }


@router.get("/payments/")
def payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Payment)
        .filter(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
        .limit(50)
        .all()
    )
    return [serialize(p) for p in rows]


@router.get("/payments/{payment_id}")
def payment_status(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id, Payment.user_id == current_user.id)
        .first()
    )
    if payment is None:
        raise HTTPException(404, "Payment not found.")
    return serialize(payment)


@router.post("/payments/mpesa/callback")
async def mpesa_callback(payload: dict):
    """
    Safaricom Daraja result webhook (live mode). Completes or fails the
    payment by CheckoutRequestID.
    """
    body = (payload or {}).get("Body", {}).get("stkCallback", {})
    checkout_id = body.get("CheckoutRequestID")
    result_code = body.get("ResultCode")

    if checkout_id is None:
        raise HTTPException(400, "Malformed callback")

    # Locate the payment by provider ref
    db = next(get_db())
    try:
        payment = (
            db.query(Payment)
            .filter(Payment.provider_ref == checkout_id, Payment.status == "PENDING")
            .first()
        )
        if payment is None:
            return {"ResultCode": 0, "ResultDesc": "Accepted"}
        pid = payment.id
    finally:
        db.close()

    if result_code == 0:
        complete_payment(pid)
    else:
        fail_payment(pid, body.get("ResultDesc", "Request cancelled or timed out"))

    return {"ResultCode": 0, "ResultDesc": "Accepted"}
