from datetime import datetime

from sqlalchemy.orm import Session

from app.models.trade import Trade
from app.models.wallet import Wallet

from app.services.notification_service import create_notification


# Money management: a position may never lose more than 50% of its
# stake before the platform liquidates it automatically.
LIQUIDATION_THRESHOLD = -0.50


class TradeService:

    @staticmethod
    def calculate_profit(
        trade_type: str,
        entry_price: float,
        current_price: float,
        amount: float
    ) -> float:
        """P&L on a stake basis: stake x relative move x direction."""
        if trade_type == "BUY":
            relative = (current_price - entry_price) / entry_price
        else:
            relative = (entry_price - current_price) / entry_price
        return relative * amount

    @staticmethod
    def evaluate_exit(trade: Trade, current_price: float):
        """
        Decide whether a trade must auto-close at the current price.

        Returns (should_close, reason) where reason is one of
        STOP_LOSS / TAKE_PROFIT / LIQUIDATION.
        """
        is_buy = trade.trade_type == "BUY"

        if trade.stop_loss:
            if (is_buy and current_price <= trade.stop_loss) or (
                not is_buy and current_price >= trade.stop_loss
            ):
                return True, "STOP_LOSS"

        if trade.take_profit:
            if (is_buy and current_price >= trade.take_profit) or (
                not is_buy and current_price <= trade.take_profit
            ):
                return True, "TAKE_PROFIT"

        profit = TradeService.calculate_profit(
            trade.trade_type, trade.entry_price, current_price, trade.amount
        )
        if profit <= trade.amount * LIQUIDATION_THRESHOLD:
            return True, "LIQUIDATION"

        return False, None

    @staticmethod
    def close_trade(
        db: Session,
        trade: Trade,
        current_price: float,
        reason: str = "MANUAL",
    ) -> Trade:

        profit = TradeService.calculate_profit(
            trade.trade_type,
            trade.entry_price,
            current_price,
            trade.amount
        )

        trade.exit_price = current_price
        trade.profit = round(profit, 2)
        trade.status = "CLOSED"
        trade.close_reason = reason
        trade.closed_at = datetime.utcnow()

        wallet = (
            db.query(Wallet)
            .filter(Wallet.user_id == trade.user_id)
            .first()
        )

        if wallet:
            # return stake + P&L to the wallet
            wallet.balance += trade.amount + trade.profit

        reason_label = {
            "STOP_LOSS": "Stop loss",
            "TAKE_PROFIT": "Take profit",
            "LIQUIDATION": "Liquidation protection",
            "MANUAL": "Manual close",
        }.get(reason, reason.title())

        outcome = "won" if trade.profit >= 0 else "lost"
        create_notification(
            db=db,
            user_id=trade.user_id,
            title=f"{reason_label} — {trade.symbol} {outcome}",
            message=(
                f"{trade.trade_type} {trade.symbol} closed at "
                f"{current_price} for {'+' if trade.profit >= 0 else ''}"
                f"${trade.profit:.2f} ({reason_label.lower()})."
            ),
            notification_type=(
                "SUCCESS" if trade.profit >= 0 else "WARNING"
            )
        )

        return trade
