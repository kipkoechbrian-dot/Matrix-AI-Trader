from fastapi import APIRouter

from app.api.auth_routes import router as auth_router
from app.api.trade_routes import router as trade_router
from app.api.wallet_routes import router as wallet_router
from app.api.ai_routes import router as ai_router
from app.api.analytics_routes import router as analytics_router
from app.api.dashboard_routes import router as dashboard_router
from app.api.dashboard_summary_routes import router as dashboard_summary_router
from app.api.notification_routes import router as notification_router
from app.api.websocket_routes import router as websocket_router
from app.api.portfolio_routes import router as portfolio_router
from app.api.payment_routes import router as payment_router


api_router = APIRouter(
    prefix="/api/v1"
)

api_router.include_router(auth_router)
api_router.include_router(wallet_router)
api_router.include_router(trade_router)
api_router.include_router(ai_router)
api_router.include_router(analytics_router)
api_router.include_router(dashboard_router)
api_router.include_router(dashboard_summary_router)
api_router.include_router(notification_router)
api_router.include_router(portfolio_router)
api_router.include_router(websocket_router)
api_router.include_router(payment_router)