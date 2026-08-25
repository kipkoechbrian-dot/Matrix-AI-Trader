from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.trade import Trade
from app.models.user import User
from app.authentication.dependencies import get_current_user

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard/analytics")
def dashboard_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    trades = (
        db.query(Trade)
        .filter(Trade.user_id == current_user.id)
        .order_by(Trade.opened_at)
        .all()
    )

    equity = []
    balance = 0

    closed_trades = [
        t for t in trades
        if t.status == "CLOSED"
    ]
    for trade in closed_trades:
        balance += trade.profit
        equity.append({
            "date": trade.opened_at.strftime("%Y-%m-%d"),
            "equity": round(balance, 2)
        })

    return {
        "equity_curve": equity,
        "total_trades": len(trades),
        "closed_trades": len([t for t in trades if t.status == "CLOSED"]),
        "open_trades": len([t for t in trades if t.status == "OPEN"]),
        "total_profit": round(sum(t.profit for t in trades), 2)
    }