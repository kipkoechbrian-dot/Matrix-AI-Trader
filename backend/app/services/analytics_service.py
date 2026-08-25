from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.trade import Trade
from app.models.wallet import Wallet


class AnalyticsService:

    @staticmethod
    def get_dashboard(
        db: Session,
        user_id: int
    ):

        wallet = (
            db.query(Wallet)
            .filter(Wallet.user_id == user_id)
            .first()
        )

        trades = (
            db.query(Trade)
            .filter(Trade.user_id == user_id)
            .all()
        )

        open_trades = len(
            [t for t in trades if t.status == "OPEN"]
        )

        closed_trades = len(
            [t for t in trades if t.status == "CLOSED"]
        )

        winning = len(
            [t for t in trades if (t.profit or 0) > 0]
        )

        losing = len(
            [t for t in trades if (t.profit or 0) < 0]
        )

        total_profit = sum(
            (t.profit or 0)
            for t in trades
        )

        average_profit = (
            total_profit / closed_trades
            if closed_trades
            else 0
        )

        win_rate = (
            (winning / closed_trades) * 100
            if closed_trades
            else 0
        )

        return {
            "wallet_balance": wallet.balance if wallet else 0,
            "portfolio_value": (
                wallet.balance + total_profit
                if wallet else total_profit
            ),
            "open_trades": open_trades,
            "closed_trades": closed_trades,
            "winning_trades": winning,
            "losing_trades": losing,
            "total_profit": round(total_profit, 2),
            "average_profit": round(average_profit, 2),
            "win_rate": round(win_rate, 2)
        }