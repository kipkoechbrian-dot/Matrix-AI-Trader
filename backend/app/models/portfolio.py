from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from datetime import datetime

from app.database.models import Base


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    wallet_balance = Column(Float, default=0)

    portfolio_value = Column(Float, default=0)

    invested_amount = Column(Float, default=0)

    realized_profit = Column(Float, default=0)

    unrealized_profit = Column(Float, default=0)

    roi = Column(Float, default=0)

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )