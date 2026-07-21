from fastapi import FastAPI

from app.database.connection import engine
from app.database.models import Base

# Import routers
from app.api.routes import router as main_router
from app.api.trade_routes import router as trade_router
from app.api.ai_routes import router as ai_router

app = FastAPI(
    title="Matrix AI Trader",
    version="1.0.0"
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Register routers
app.include_router(main_router)
app.include_router(trade_router)
app.include_router(ai_router)