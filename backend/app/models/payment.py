from datetime import datetime

from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey

from app.database.models import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    method = Column(String(10), nullable=False)
    # MPESA | CARD

    amount = Column(Float, nullable=False)          # USD credited to wallet
    kes_amount = Column(Float, nullable=True)       # M-Pesa charge figure

    phone = Column(String(20), nullable=True)       # 2547XXXXXXXX
    card_last4 = Column(String(4), nullable=True)
    card_brand = Column(String(20), nullable=True)

    status = Column(String(20), default="PENDING")
    # PENDING | COMPLETED | FAILED

    provider_ref = Column(String(60), nullable=True)
    # Daraja CheckoutRequestID / payment-intent id / demo ref

    failure_reason = Column(String(200), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
