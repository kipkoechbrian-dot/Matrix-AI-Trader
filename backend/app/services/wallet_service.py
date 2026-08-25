from sqlalchemy.orm import Session

from app.models.wallet import Wallet
from app.models.transaction import Transaction

from app.services.notification_service import create_notification
from app.services.portfolio_service import update_portfolio


class WalletService:

    @staticmethod
    def get_wallet(
        db: Session,
        user_id: int
    ):

        return (
            db.query(Wallet)
            .filter(Wallet.user_id == user_id)
            .first()
        )

    @staticmethod
    def deposit(
        db: Session,
        user_id: int,
        amount: float
    ):

        wallet = WalletService.get_wallet(
            db,
            user_id
        )

        if wallet is None:
            return None

        wallet.balance += amount

        transaction = Transaction(
            user_id=user_id,
            transaction_type="DEPOSIT",
            amount=amount
        )

        db.add(transaction)
        db.commit()
        db.refresh(transaction)

        update_portfolio(
            db,
            user_id
        )

        create_notification(
            db=db,
            user_id=user_id,
            title="Deposit Successful",
            message=f"You deposited ${amount:.2f}",
            notification_type="SUCCESS"
        )

        return {
            "wallet": wallet,
            "transaction": transaction
        }

    @staticmethod
    def withdraw(
        db: Session,
        user_id: int,
        amount: float
    ):

        wallet = WalletService.get_wallet(
            db,
            user_id
        )

        if wallet is None:
            return None

        if wallet.balance < amount:
            return False

        wallet.balance -= amount

        transaction = Transaction(
            user_id=user_id,
            transaction_type="WITHDRAW",
            amount=amount
        )

        db.add(transaction)
        db.commit()
        db.refresh(transaction)

        update_portfolio(
            db,
            user_id
        )

        create_notification(
            db=db,
            user_id=user_id,
            title="Withdrawal Successful",
            message=f"You withdrew ${amount:.2f}",
            notification_type="WARNING"
        )

        return {
            "wallet": wallet,
            "transaction": transaction
        }