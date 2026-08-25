from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.authentication.dependencies import get_current_user

from app.models.user import User
from app.models.wallet import Wallet
from app.models.trade import Trade
from app.models.notification import Notification

router = APIRouter(tags=["Dashboard Summary"])


@router.get("/dashboard")
def dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    wallet = (
        db.query(Wallet)
        .filter(Wallet.user_id == current_user.id)
        .first()
    )

    trades = (
        db.query(Trade)
        .filter(Trade.user_id == current_user.id)
        .all()
    )

    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(5)
        .all()
    )

    open_trades = [t for t in trades if t.status == "OPEN"]
    closed_trades = [t for t in trades if t.status == "CLOSED"]

    total_profit = round(sum(t.profit for t in trades), 2)

    return {
        "wallet_balance": wallet.balance if wallet else 0,
        "total_profit": total_profit,
        "open_trades": len(open_trades),
        "closed_trades": len(closed_trades),
        "recent_notifications": notifications
    }