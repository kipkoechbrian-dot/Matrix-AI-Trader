import asyncio
import logging

from sqlalchemy.orm import Session

from app.database.connection import SessionLocal

from app.models.trade import Trade

from app.services.market_service import get_live_price
from app.services.trade_service import TradeService

logger = logging.getLogger(__name__)

MONITOR_INTERVAL_SECONDS = 5


async def monitor_trades():
    """
    Watches every open position against the live market:

      - Stop loss crossed      -> close (loss capped)
      - Take profit crossed    -> close (gain locked)
      - Loss beyond 50% stake  -> liquidation protection

    Runs forever; one DB session per sweep.
    """
    # give the app a moment to finish startup on first run
    await asyncio.sleep(2)

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

                should_close, reason = TradeService.evaluate_exit(
                    trade, current_price
                )

                if should_close:
                    TradeService.close_trade(
                        db=db,
                        trade=trade,
                        current_price=current_price,
                        reason=reason,
                    )
                    logger.info(
                        "Auto-closed trade %s (%s %s) at %s — %s",
                        trade.id, trade.trade_type, trade.symbol,
                        current_price, reason,
                    )

            db.commit()

        except Exception as exc:  # never let the monitor die
            logger.exception("Trade monitor sweep failed: %s", exc)
            db.rollback()

        finally:
            db.close()

        await asyncio.sleep(MONITOR_INTERVAL_SECONDS)
