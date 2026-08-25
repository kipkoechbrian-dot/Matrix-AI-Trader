from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.authentication.dependencies import get_current_user

from app.models.user import User
from app.models.portfolio import Portfolio

from app.services.portfolio_service import update_portfolio

router = APIRouter(tags=["Portfolio"])


@router.get("/portfolio")
def get_portfolio(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    portfolio = update_portfolio(db, current_user.id)

    return {
        "wallet_balance": portfolio.wallet_balance,
        "portfolio_value": portfolio.portfolio_value,
        "invested_amount": portfolio.invested_amount,
        "realized_profit": portfolio.realized_profit,
        "unrealized_profit": portfolio.unrealized_profit,
        "roi": portfolio.roi
    }


@router.get("/portfolio/performance")
def portfolio_performance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    portfolio = update_portfolio(db, current_user.id)

    return {
        "portfolio_value": portfolio.portfolio_value,
        "roi": portfolio.roi,
        "realized_profit": portfolio.realized_profit,
        "unrealized_profit": portfolio.unrealized_profit
    }