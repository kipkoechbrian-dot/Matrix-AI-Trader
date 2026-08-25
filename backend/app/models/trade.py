from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from datetime import datetime

from app.database.models import Base


class Trade(Base):

    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    symbol = Column(String(20), nullable=False)

    trade_type = Column(String(10), nullable=False)
    # BUY or SELL

    amount = Column(Float, nullable=False)

    entry_price = Column(Float, nullable=False)

    confidence = Column(Integer, default=0)

    ai_reason = Column(Text, nullable=True)

    exit_price = Column(Float, nullable=True)

    profit = Column(Float, default=0)

    status = Column(
        String(20),
        default="OPEN"
    )

    opened_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    closed_at = Column(
        DateTime,
        nullable=True
    )