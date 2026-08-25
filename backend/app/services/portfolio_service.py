from sqlalchemy.orm import Session

from app.models.portfolio import Portfolio
from app.models.wallet import Wallet
from app.models.trade import Trade


def update_portfolio(db: Session, user_id: int):
    wallet = (
        db.query(Wallet)
        .filter(Wallet.user_id == user_id)
        .first()
    )

    if wallet is None:
        return None

    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.user_id == user_id)
        .first()
    )

    if portfolio is None:
        portfolio = Portfolio(user_id=user_id)
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)

    open_trades = (
        db.query(Trade)
        .filter(
            Trade.user_id == user_id,
            Trade.status == "OPEN"
        )
        .all()
    )

    closed_trades = (
        db.query(Trade)
        .filter(
            Trade.user_id == user_id,
            Trade.status == "CLOSED"
        )
        .all()
    )

    invested = sum(t.amount for t in open_trades)

    realized_profit = sum(t.profit for t in closed_trades)

    unrealized_profit = 0

    portfolio.wallet_balance = round(wallet.balance, 2)
    portfolio.invested_amount = round(invested, 2)
    portfolio.realized_profit = round(realized_profit, 2)
    portfolio.unrealized_profit = round(unrealized_profit, 2)

    portfolio.portfolio_value = round(
        wallet.balance + invested + unrealized_profit,
        2
    )

    if invested > 0:
        portfolio.roi = round(
            (realized_profit / invested) * 100,
            2
        )
    else:
        portfolio.roi = 0

    db.commit()
    db.refresh(portfolio)

    return portfolio