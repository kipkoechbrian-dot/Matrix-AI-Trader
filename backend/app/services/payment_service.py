"""
Payment service — lifecycle of a wallet-funding payment:

    create  ->  initiate on the chosen rail (STK push / card charge)
    PENDING ->  user enters M-Pesa PIN (or card 3DS) ...
    COMPLETED -> wallet credited + ledger transaction + in-app
                 notification + EMAIL RECEIPT
    FAILED  -> recorded with reason + in-app notification (+ email)

Demo rails auto-complete after a few seconds so the full flow —
prompt, wait, settle, receipt — is demoable with zero credentials.
"""

import asyncio
import logging
from datetime import datetime

from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.core.config import settings
from app.models.payment import Payment
from app.models.user import User
from app.models.notification import Notification
from app.services.email_service import send_email
from app.services.wallet_service import WalletService
from app.services.notification_service import create_notification
from app.services.payment_provider import KES_PER_USD

logger = logging.getLogger(__name__)

DEMO_SETTLE_SECONDS = 5


# ---------------------------------------------------------------------------
# Receipts
# ---------------------------------------------------------------------------

def _receipt_text(user: User, payment: Payment, new_balance: float) -> str:
    via = (
        f"M-Pesa ({payment.phone})"
        if payment.method == "MPESA"
        else f"{payment.card_brand} card •••• {payment.card_last4}"
    )
    lines = [
        f"Hi {user.username},",
        "",
        "Your deposit settled successfully. Here is your receipt:",
        "",
        f"  Amount        : ${payment.amount:,.2f} USD"
        + (f"  (charged KSh {payment.kes_amount:,.0f})" if payment.kes_amount else ""),
        f"  Method        : {via}",
        f"  Reference     : {payment.provider_ref}",
        f"  New balance   : ${new_balance:,.2f} USD",
        f"  Time (UTC)    : {payment.completed_at:%Y-%m-%d %H:%M:%S}",
        "",
        "The funds are available in your Matrix AI Trader wallet immediately.",
        "",
        "— Matrix AI Trader",
    ]
    return "\n".join(lines)


def _send_receipt(user: User, payment: Payment, new_balance: float) -> bool:
    """Guarded email — never lets SMTP issues break a payment."""
    if not (settings.SMTP_HOST and settings.SMTP_USERNAME and settings.SMTP_PASSWORD):
        logger.info("SMTP not configured — receipt email skipped")
        return False
    try:
        send_email(
            recipient=user.email,
            subject=f"Deposit receipt — ${payment.amount:,.2f} credited | Matrix AI Trader",
            body=_receipt_text(user, payment, new_balance),
        )
        return True
    except Exception as exc:
        logger.warning("Receipt email failed for payment %s: %s", payment.id, exc)
        return False


def _send_failure_email(user: User, payment: Payment) -> None:
    if not (settings.SMTP_HOST and settings.SMTP_USERNAME and settings.SMTP_PASSWORD):
        return
    try:
        send_email(
            recipient=user.email,
            subject=f"Deposit could not be completed | Matrix AI Trader",
            body=(
                f"Hi {user.username},\n\n"
                f"Your ${payment.amount:,.2f} deposit via {payment.method} "
                f"was not completed.\nReason: {payment.failure_reason}\n\n"
                "No money was moved. You can try again from your terminal.\n\n"
                "— Matrix AI Trader"
            ),
        )
    except Exception as exc:
        logger.warning("Failure email failed for payment %s: %s", payment.id, exc)


# ---------------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------------

def create_payment(
    db: Session, user_id: int, method: str, amount: float,
    phone: str | None, card_last4: str | None, card_brand: str | None,
    provider_ref: str | None,
) -> Payment:
    payment = Payment(
        user_id=user_id,
        method=method,
        amount=amount,
        kes_amount=round(amount * KES_PER_USD) if method == "MPESA" else None,
        phone=phone,
        card_last4=card_last4,
        card_brand=card_brand,
        provider_ref=provider_ref,
        status="PENDING",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def complete_payment(payment_id: int) -> Payment | None:
    """Settle: credit wallet, notify, email receipt."""
    db: Session = SessionLocal()
    try:
        payment = (
            db.query(Payment).filter(Payment.id == payment_id).first()
        )
        if payment is None or payment.status != "PENDING":
            return payment

        user = db.query(User).filter(User.id == payment.user_id).first()

        # Credit the wallet through the canonical deposit path
        # (ledger transaction + notification included).
        result = WalletService.deposit(db, payment.user_id, payment.amount)

        payment.status = "COMPLETED"
        payment.completed_at = datetime.utcnow()
        db.commit()

        new_balance = (
            result["wallet"].balance if result else payment.amount
        )

        emailed = _send_receipt(user, payment, new_balance)

        create_notification(
            db=db,
            user_id=payment.user_id,
            title="Payment completed",
            message=(
                f"${payment.amount:,.2f} via "
                f"{'M-Pesa ' + str(payment.phone) if payment.method == 'MPESA' else payment.card_brand + ' •••• ' + str(payment.card_last4)}"
                f" is now in your wallet."
                + (" Receipt sent to your email." if emailed else "")
            ),
            notification_type="SUCCESS",
        )
        db.commit()
        return payment
    finally:
        db.close()


def fail_payment(payment_id: int, reason: str) -> None:
    db: Session = SessionLocal()
    try:
        payment = (
            db.query(Payment).filter(Payment.id == payment_id).first()
        )
        if payment is None or payment.status != "PENDING":
            return

        payment.status = "FAILED"
        payment.failure_reason = reason
        payment.completed_at = datetime.utcnow()
        db.commit()

        user = db.query(User).filter(User.id == payment.user_id).first()

        create_notification(
            db=db,
            user_id=payment.user_id,
            title="Payment failed",
            message=(
                f"Your ${payment.amount:,.2f} {payment.method} deposit "
                f"could not complete: {reason}. No money was moved."
            ),
            notification_type="ERROR",
        )

        if user:
            _send_failure_email(user, payment)

        db.commit()
    finally:
        db.close()


async def _demo_settle_later(payment_id: int, seconds: int):
    await asyncio.sleep(seconds)
    complete_payment(payment_id)


def schedule_demo_settlement(payment_id: int, seconds: int = DEMO_SETTLE_SECONDS):
    """Demo rails: auto-complete as if the user tapped their PIN."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_demo_settle_later(payment_id, seconds))
    except RuntimeError:
        # No running loop (tests) — settle synchronously
        _ = Notification  # keep import used
        complete_payment(payment_id)
