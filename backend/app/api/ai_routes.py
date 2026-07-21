from fastapi import APIRouter, HTTPException

from app.services.market_service import get_live_price
from app.ai.signals import generate_signal

router = APIRouter(
    tags=["AI Trading"]
)


@router.get("/ai/signal/{symbol}")
def ai_signal(symbol: str):

    market = get_live_price(symbol)

    if market is None:
        raise HTTPException(
            status_code=404,
            detail="Unable to fetch market price."
        )

    result = generate_signal(
        symbol=market["symbol"],
        price=market["price"]
    )

    return result