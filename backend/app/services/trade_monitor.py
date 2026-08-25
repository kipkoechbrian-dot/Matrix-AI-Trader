import asyncio

from sqlalchemy.orm import Session

from app.database.connection import SessionLocal

from app.models.trade import Trade

from app.services.market_service import get_live_price
from app.services.trade_service import TradeService


async def monitor_trades():

    while True:

        db: Session = SessionLocal()

        try:

            trades = (
                db.query(Trade)
                .filter(Trade.status == "OPEN")
                .all()
            )

            for trade in trades:

                market = get_live_price(trade.symbol)

                if market is None:
                    continue

                current_price = float(market["price"])

                profit = TradeService.calculate_profit(
                    trade.trade_type,
                    trade.entry_price,
                    current_price,
                    trade.amount
                )

                if abs(profit) >= 1:

                    TradeService.close_trade(
                        db=db,
                        trade=trade,
                        current_price=current_price
                    )

            db.commit()

        finally:

            db.close()

        await asyncio.sleep(10)