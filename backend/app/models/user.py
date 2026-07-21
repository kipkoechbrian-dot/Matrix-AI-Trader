from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.models import Base


class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String(100), nullable=False)

    email = Column(String(150), unique=True, nullable=False)

    password = Column(String(255), nullable=False)

    account_type = Column(
        String(20),
        default="FREE"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    wallet = relationship(
        "Wallet",
        back_populates="user",
        uselist=False
    )