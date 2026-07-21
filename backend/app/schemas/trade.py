from pydantic import BaseModel


class OpenTradeRequest(BaseModel):
    symbol: str
    trade_type: str
    amount: float
    entry_price: float


class CloseTradeRequest(BaseModel):
    trade_id: int
    exit_price: float