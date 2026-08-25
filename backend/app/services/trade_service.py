from sqlalchemy.orm import Session

from app.models.trade import Trade
from app.models.wallet import Wallet

from app.services.notification_service import create_notification


class TradeService:

    @staticmethod
    def calculate_profit(
        trade_type: str,
        entry_price: float,
        current_price: float,
        amount: float
    ) -> float:

        if trade_type == "BUY":

            return (
                (current_price - entry_price)
                / entry_price
            ) * amount

        return (
            (entry_price - current_price)
            / entry_price
        ) * amount

    @staticmethod
    def close_trade(
        db: Session,
        trade: Trade,
        current_price: float
    ):

        profit = TradeService.calculate_profit(
            trade.trade_type,
            trade.entry_price,
            current_price,
            trade.amount
        )

        trade.exit_price = current_price
        trade.profit = round(profit, 2)
        trade.status = "CLOSED"

        wallet = (
            db.query(Wallet)
            .filter(Wallet.user_id == trade.user_id)
            .first()
        )

        if wallet:

            wallet.balance += (
                trade.amount +
                trade.profit
            )

        create_notification(
            db=db,
            user_id=trade.user_id,
            title="Trade Closed",
            message=f"{trade.symbol} closed automatically.",
            notification_type="SUCCESS"
        )

        return trade