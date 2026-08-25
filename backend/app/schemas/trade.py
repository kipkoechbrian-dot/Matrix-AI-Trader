from pydantic import BaseModel, Field
from typing import Optional


class OpenTradeRequest(BaseModel):
    symbol: str
    trade_type: str                      # BUY | SELL
    amount: float = Field(gt=0)          # stake in USD
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    entry_price: Optional[float] = None  # ignored server-side; live price wins


class CloseTradeRequest(BaseModel):
    trade_id: int
    exit_price: float
