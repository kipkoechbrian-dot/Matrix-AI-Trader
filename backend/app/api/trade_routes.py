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
from app.services.trade_service import TradeService
from app.services.risk_service import can_open_trade

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

    # Risk engine gate (max open trades, daily loss limit, balance)
    allowed, reason = can_open_trade(current_user, wallet, db)
    if not allowed:
        raise HTTPException(status_code=400, detail=reason)

    # Check wallet balance covers the stake
    if wallet.balance < trade.amount:
        raise HTTPException(
            status_code=400,
            detail="Insufficient wallet balance — deposit funds first."
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

    live_price = float(market["price"])

    # Sanity-check stop loss / take profit against direction
    trade_type = trade.trade_type.upper()
    if trade_type == "BUY":
        if trade.stop_loss and trade.stop_loss >= live_price:
            raise HTTPException(400, "BUY stop loss must be below entry price.")
        if trade.take_profit and trade.take_profit <= live_price:
            raise HTTPException(400, "BUY take profit must be above entry price.")
    elif trade_type == "SELL":
        if trade.stop_loss and trade.stop_loss <= live_price:
            raise HTTPException(400, "SELL stop loss must be above entry price.")
        if trade.take_profit and trade.take_profit >= live_price:
            raise HTTPException(400, "SELL take profit must be below entry price.")
    else:
        raise HTTPException(400, "trade_type must be BUY or SELL.")

    # Deduct stake from wallet (returned with P&L on close)
    wallet.balance -= trade.amount

    # Create trade using LIVE price as the entry — never trust
    # client-supplied prices
    new_trade = Trade(
        user_id=current_user.id,
        symbol=trade.symbol.upper().replace("/", ""),
        trade_type=trade_type,
        amount=trade.amount,
        entry_price=live_price,
        stop_loss=trade.stop_loss,
        take_profit=trade.take_profit,
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
            "stop_loss": new_trade.stop_loss,
            "take_profit": new_trade.take_profit,
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

    # Settle through the shared service: P&L computed identically
    # everywhere, wallet credited, notification emitted.
    TradeService.close_trade(
        db=db,
        trade=trade,
        current_price=trade_data.exit_price,
        reason="MANUAL",
    )

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
            "status": trade.status,
            "close_reason": trade.close_reason,
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
            "stop_loss": trade.stop_loss,
            "take_profit": trade.take_profit,
            "exit_price": trade.exit_price,
            "profit": trade.profit,
            "status": trade.status,
            "close_reason": trade.close_reason,
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
        "stop_loss": trade.stop_loss,
        "take_profit": trade.take_profit,
        "exit_price": trade.exit_price,
        "profit": trade.profit,
        "status": trade.status,
        "close_reason": trade.close_reason,
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

@router.get("/market/quotes")
def market_quotes():
    """Snapshot of every supported instrument — one call feeds
    the entire watchlist / ticker."""
    from app.services.market_provider import quotes
    return quotes()


@router.get("/market/{symbol}/candles")
def market_candles(symbol: str, limit: int = 220):
    """OHLC candle history for charting (ascending time)."""
    from app.services.market_provider import candles
    result = candles(symbol, min(limit, 300))
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Symbol not supported."
        )
    return result


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