from app.services.websocket_manager import manager


async def broadcast_trade_opened(trade):
    await manager.broadcast({
        "event": "trade_opened",
        "trade_id": trade.id,
        "symbol": trade.symbol,
        "type": trade.trade_type,
        "entry_price": trade.entry_price
    })


async def broadcast_trade_closed(trade, wallet):
    await manager.broadcast({
        "event": "trade_closed",
        "trade_id": trade.id,
        "symbol": trade.symbol,
        "profit": trade.profit,
        "wallet_balance": wallet.balance
    })


async def broadcast_notification(title, message):
    await manager.broadcast({
        "event": "notification",
        "title": title,
        "message": message
    })


async def broadcast_wallet(balance):
    await manager.broadcast({
        "event": "wallet_updated",
        "balance": balance
    })


async def broadcast_dashboard():
    await manager.broadcast({
        "event": "dashboard_refresh"
    })