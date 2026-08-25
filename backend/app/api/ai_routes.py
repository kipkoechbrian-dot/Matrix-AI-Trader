from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db

from app.authentication.dependencies import get_current_user

from app.models.user import User
from app.models.wallet import Wallet
from app.models.trade import Trade

from app.services.ai_service import get_ai_signal
from app.services.market_service import get_live_price
from app.services.notification_service import create_notification
from app.services.risk_service import (
    can_open_trade,
    calculate_position_size
)

router = APIRouter(tags=["AI Trading"])


@router.get("/ai/signal/{symbol}")
def ai_signal(symbol: str):

    result = get_ai_signal(symbol)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Unable to analyze market."
        )

    return result


@router.post("/ai/auto-trade/{symbol}")
def auto_trade(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    signal = get_ai_signal(symbol)

    if signal is None:
        raise HTTPException(
            status_code=404,
            detail="Market data unavailable."
        )

    if signal["signal"] == "HOLD":
        return {
            "message": "AI recommends HOLD.",
            "analysis": signal
        }

    wallet = db.query(Wallet).filter(
        Wallet.user_id == current_user.id
    ).first()

    if wallet is None:
        raise HTTPException(
            status_code=404,
            detail="Wallet not found."
        )
    allowed, message = can_open_trade(
        current_user,
        wallet,
        db
    )

    if not allowed:
        raise HTTPException(
            status_code=400,
            detail=message
        )

    amount = calculate_position_size(wallet.balance)

    wallet.balance -= amount

    trade = Trade(
    user_id=current_user.id,
    symbol=symbol.upper(),
    trade_type=signal["signal"],
    amount=round(amount, 2),
    entry_price=float(signal["entry_price"]),
    confidence=signal["confidence"],
    ai_reason=", ".join(signal["reason"]),
    status="OPEN"
)

    db.add(trade)
    db.commit()
    db.refresh(trade)

    create_notification(
    db=db,
    user_id=current_user.id,
    title="Trade Opened",
    message=f"{trade.trade_type} {trade.symbol} opened at {trade.entry_price}",
    notification_type="INFO"
)

    return {
        "message": "AI opened trade successfully.",
        "trade_id": trade.id,
        "wallet_balance": wallet.balance,
        "signal": signal
    }

from datetime import datetime

@router.post("/ai/close-trade/{trade_id}")
def ai_close_trade(
    trade_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    trade = db.query(Trade).filter(
        Trade.id == trade_id,
        Trade.user_id == current_user.id,
        Trade.status == "OPEN"
    ).first()

    if trade is None:
        raise HTTPException(
            status_code=404,
            detail="Open trade not found."
        )

    market = get_live_price(trade.symbol)

    if market is None:
        raise HTTPException(
            status_code=404,
            detail="Unable to fetch live market price."
        )

    exit_price = float(market["price"])

    if trade.trade_type == "BUY":
        profit = ((exit_price - trade.entry_price) / trade.entry_price) * trade.amount
    else:
        profit = ((trade.entry_price - exit_price) / trade.entry_price) * trade.amount

    trade.exit_price = exit_price
    trade.profit = round(float(profit), 2)
    trade.status = "CLOSED"
    trade.closed_at = datetime.utcnow()


    wallet = db.query(Wallet).filter(
        Wallet.user_id == current_user.id
    ).first()

    wallet.balance += trade.amount + trade.profit

    db.commit()
    db.refresh(trade)

    if trade.profit > 0:
        create_notification(
            db=db,
            user_id=current_user.id,
            title="Trade Won",
            message=f"You earned ${trade.profit} on {trade.symbol}.",
            notification_type="SUCCESS"
        )
    else:
        create_notification(
             db=db,
             user_id=current_user.id,
             title="Trade Lost",
             message=f"You lost ${abs(trade.profit)} on {trade.symbol}.",
             notification_type="WARNING"
       )

    db.commit()


    return {
        "message": "Trade closed successfully.",
        "trade_id": trade.id,
        "entry_price": trade.entry_price,
        "exit_price": trade.exit_price,
        "profit": trade.profit,
        "wallet_balance": wallet.balance
    }

@router.get("/analytics")
def trading_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trades = (
        db.query(Trade)
        .filter(
            Trade.user_id == current_user.id,
            Trade.status == "CLOSED"
        )
        .all()
    )

    if not trades:
        return {
            "message": "No closed trades yet."
        }

    profits = [t.profit for t in trades]

    total_profit = round(sum(profits), 2)

    average_profit = round(total_profit / len(trades), 2)

    best_trade = max(profits)

    worst_trade = min(profits)

    win_rate = round(
        len([p for p in profits if p > 0]) / len(trades) * 100,
        2
    )

    return {
        "closed_trades": len(trades),
        "total_profit": total_profit,
        "average_profit": average_profit,
        "best_trade": round(best_trade, 2),
        "worst_trade": round(worst_trade, 2),
        "win_rate": win_rate
    }


@router.get("/report")
def ai_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trades = (
        db.query(Trade)
        .filter(Trade.user_id == current_user.id)
        .all()
    )

    if not trades:
        return {
            "message": "No trades found."
        }

    total_trades = len(trades)

    closed_trades = [t for t in trades if t.status == "CLOSED"]
    open_trades = [t for t in trades if t.status == "OPEN"]

    winning_trades = [t for t in closed_trades if t.profit > 0]
    losing_trades = [t for t in closed_trades if t.profit < 0]

    total_profit = round(sum(t.profit for t in trades), 2)

    win_rate = 0
    if closed_trades:
        win_rate = round(
            len(winning_trades) / len(closed_trades) * 100,
            2
        )

    best_trade = None
    worst_trade = None

    if closed_trades:
        best = max(closed_trades, key=lambda t: t.profit)
        worst = min(closed_trades, key=lambda t: t.profit)

        best_trade = {
            "symbol": best.symbol,
            "profit": round(best.profit, 2)
        }

        worst_trade = {
            "symbol": worst.symbol,
            "profit": round(worst.profit, 2)
        }

    ai_score = min(100, round(win_rate + max(total_profit, 0)))

    return {
        "total_trades": total_trades,
        "open_trades": len(open_trades),
        "closed_trades": len(closed_trades),
        "winning_trades": len(winning_trades),
        "losing_trades": len(losing_trades),
        "win_rate": win_rate,
        "total_profit": total_profit,
        "best_trade": best_trade,
        "worst_trade": worst_trade,
        "ai_score": ai_score
    }