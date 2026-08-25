from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio

from app.services.market_service import get_live_price
from app.services.websocket_manager import manager

router = APIRouter(tags=["WebSocket"])


# -----------------------------
# Live Market Prices
# -----------------------------
@router.websocket("/ws/{symbol}")
async def websocket_prices(
    websocket: WebSocket,
    symbol: str
):
    await websocket.accept()

    while True:

        market = get_live_price(symbol)

        if market:

            await websocket.send_json({
                "event": "price_update",
                "symbol": symbol.upper(),
                "price": market["price"],
                "change": market.get("change", 0),
                "time": market.get("datetime")
            })

        await asyncio.sleep(5)


# -----------------------------
# Dashboard Live Updates
# -----------------------------
@router.websocket("/ws/dashboard")
async def dashboard_socket(websocket: WebSocket):

    await manager.connect(websocket)

    try:

        while True:
            # Keep the connection alive
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        