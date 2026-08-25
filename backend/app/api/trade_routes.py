from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.session import get_db

from app.authentication.dependencies import get_current_user

from app.models.user import User
from app.models.trade import Trade
from app.models.wallet import Wallet
from app.models.transaction import Transaction
from app.services.market_service import get_live_price

from app.schemas.trade import (
    OpenTradeRequest,
    CloseTradeRequest
)

router = APIRouter(
    tags=["Trading"]
)

@router.post("/trade/open")
def open_trade(
    trade: OpenTradeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find user's wallet
    wallet = (
        db.query(Wallet)
        .filter(Wallet.user_id == current_user.id)
        .first()
    )

    if wallet is None:
        raise HTTPException(
            status_code=404,
            detail="Wallet not found."
        )

    # Check wallet balance
    if wallet.balance < trade.amount:
        raise HTTPException(
            status_code=400,
            detail="Insufficient wallet balance."
        )

    # -----------------------------
    # Fetch LIVE market price
    # -----------------------------
    market = get_live_price(trade.symbol.upper())

    if market is None:
        raise HTTPException(
            status_code=404,
            detail="Unable to fetch live market price."
        )

    # Different providers return different keys
    if isinstance(market, dict):
        live_price = (
            market.get("price")
            or market.get("current_price")
            or market.get("bid")
            or market.get("close")
        )
    else:
        live_price = market

    if live_price is None:
        raise HTTPException(
            status_code=400,
            detail="Live price unavailable."
        )

    # Deduct money
    wallet.balance -= trade.amount

    # Create trade using LIVE price
    new_trade = Trade(
        user_id=current_user.id,
        symbol=trade.symbol.upper(),
        trade_type=trade.trade_type.upper(),
        amount=trade.amount,
        entry_price=float(live_price),
        status="OPEN"
    )

    db.add(new_trade)

    db.commit()

    db.refresh(new_trade)
    db.refresh(wallet)

    return {
        "message": "Trade opened successfully.",
        "trade": {
            "id": new_trade.id,
            "symbol": new_trade.symbol,
            "type": new_trade.trade_type,
            "amount": new_trade.amount,
            "entry_price": new_trade.entry_price,
            "status": new_trade.status
        },
        "wallet_balance": wallet.balance
    }

@router.post("/trade/close")
def close_trade(
    trade_data: CloseTradeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trade = db.query(Trade).filter(
        Trade.id == trade_data.trade_id,
        Trade.user_id == current_user.id
    ).first()

    if trade is None:
        raise HTTPException(
            status_code=404,
            detail="Trade not found."
        )

    if trade.status == "CLOSED":
        raise HTTPException(
            status_code=400,
            detail="Trade is already closed."
        )

    wallet = db.query(Wallet).filter(
        Wallet.user_id == current_user.id
    ).first()

    if wallet is None:
        raise HTTPException(
            status_code=404,
            detail="Wallet not found."
        )

    # Save exit price
    trade.exit_price = trade_data.exit_price

    # Calculate profit/loss
    if trade.trade_type == "BUY":
        profit = (
            (trade.exit_price - trade.entry_price)
            / trade.entry_price
        ) * trade.amount
    else:  # SELL
        profit = (
            (trade.entry_price - trade.exit_price)
            / trade.entry_price
        ) * trade.amount

    trade.profit = round(profit, 2)
    trade.status = "CLOSED"
    trade.closed_at = datetime.utcnow()

    # Return original stake + profit/loss
    wallet.balance += trade.amount + trade.profit

    db.commit()
    db.refresh(trade)
    db.refresh(wallet)

    return {
        "message": "Trade closed successfully.",
        "profit": trade.profit,
        "wallet_balance": wallet.balance,
        "trade": {
            "id": trade.id,
            "symbol": trade.symbol,
            "status": trade.status
        }
    }

@router.get("/trades")
def get_trades(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trades = db.query(Trade).filter(
        Trade.user_id == current_user.id
    ).order_by(
        Trade.opened_at.desc()
    ).all()

    return [
        {
            "id": trade.id,
            "symbol": trade.symbol,
            "trade_type": trade.trade_type,
            "amount": trade.amount,
            "entry_price": trade.entry_price,
            "exit_price": trade.exit_price,
            "profit": trade.profit,
            "status": trade.status,
            "opened_at": trade.opened_at,
            "closed_at": trade.closed_at
        }
        for trade in trades
    ]

@router.get("/trades/{trade_id}")
def get_trade(
    trade_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trade = db.query(Trade).filter(
        Trade.id == trade_id,
        Trade.user_id == current_user.id
    ).first()

    if trade is None:
        raise HTTPException(
            status_code=404,
            detail="Trade not found."
        )

    return {
        "id": trade.id,
        "symbol": trade.symbol,
        "trade_type": trade.trade_type,
        "amount": trade.amount,
        "entry_price": trade.entry_price,
        "exit_price": trade.exit_price,
        "profit": trade.profit,
        "status": trade.status,
        "opened_at": trade.opened_at,
        "closed_at": trade.closed_at
    }

@router.get("/dashboard")
def dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wallet = db.query(Wallet).filter(
        Wallet.user_id == current_user.id
    ).first()

    trades = db.query(Trade).filter(
        Trade.user_id == current_user.id
    ).all()

    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).all()

    open_trades = len([
        t for t in trades
        if t.status == "OPEN"
    ])

    closed_trades = len([
        t for t in trades
        if t.status == "CLOSED"
    ])

    total_profit = sum(
        t.profit for t in trades
    )

    deposits = sum(
        t.amount for t in transactions
        if t.transaction_type == "DEPOSIT"
    )

    withdrawals = sum(
        t.amount for t in transactions
        if t.transaction_type == "WITHDRAW"
    )

    winning = len([
        t for t in trades
        if t.profit > 0
    ])

    win_rate = (
        (winning / closed_trades) * 100
        if closed_trades > 0
        else 0
    )

    return {
        "user": current_user.username,
        "membership": current_user.account_type,
        "wallet_balance": wallet.balance,
        "open_trades": open_trades,
        "closed_trades": closed_trades,
        "total_profit": round(total_profit, 2),
        "total_deposits": deposits,
        "total_withdrawals": withdrawals,
        "win_rate": round(win_rate, 2)
    }

@router.get("/market/{symbol}")
def market_price(symbol: str):
    """
    Get the live market price for a symbol.
    Example:
    EURUSD
    GBPUSD
    BTC/USD
    XAU/USD
    """

    price = get_live_price(symbol)

    if price is None:
        raise HTTPException(
            status_code=404,
            detail="Unable to fetch market price."
        )

    return price

@router.get("/journal")
def trading_journal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    trades = (
        db.query(Trade)
        .filter(Trade.user_id == current_user.id)
        .order_by(Trade.opened_at.desc())
        .all()
    )

    journal = []

    for trade in trades:

        duration = None

        if trade.closed_at:
            duration = str(trade.closed_at - trade.opened_at)

        if trade.status == "CLOSED":
            result = "WIN" if trade.profit > 0 else "LOSS"
        else:
            result = "OPEN"

        percent = 0

        if trade.amount > 0:
            percent = round((trade.profit / trade.amount) * 100, 2)

        journal.append({
            "trade_id": trade.id,
            "symbol": trade.symbol,
            "type": trade.trade_type,
            "status": trade.status,
            "result": result,
            "amount": round(trade.amount, 2),
            "entry_price": trade.entry_price,
            "exit_price": trade.exit_price,
            "profit": round(trade.profit, 2),
            "return_percent": percent,
            "duration": duration,
            "opened_at": trade.opened_at,
            "closed_at": trade.closed_at
        })

    return journal


@router.get("/stats")
def trading_stats(
    
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    trades = (
        db.query(Trade)
        .filter(Trade.user_id == current_user.id)
        .all()
    )

    total = len(trades)

    open_trades = len([t for t in trades if t.status == "OPEN"])
    closed_trades = len([t for t in trades if t.status == "CLOSED"])

    wins = len([t for t in trades if t.profit > 0])
    losses = len([t for t in trades if t.profit < 0])

    total_profit = round(sum(t.profit for t in trades), 2)

    average_profit = 0

    if closed_trades > 0:
        average_profit = round(total_profit / closed_trades, 2)

    win_rate = 0

    if closed_trades > 0:
        win_rate = round((wins / closed_trades) * 100, 2)

    best_trade = 0
    worst_trade = 0

    if trades:
        best_trade = max(t.profit for t in trades)
        worst_trade = min(t.profit for t in trades)

    return {
        "total_trades": total,
        "open_trades": open_trades,
        "closed_trades": closed_trades,
        "wins": wins,
        "losses": losses,
        "win_rate": win_rate,
        "total_profit": total_profit,
        "average_profit": average_profit,
        "best_trade": best_trade,
        "worst_trade": worst_trade
    }