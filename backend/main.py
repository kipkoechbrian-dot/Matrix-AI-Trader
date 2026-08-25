from fastapi import FastAPI
import asyncio

from app.database.connection import engine
from app.database.models import Base

from app.services.trade_monitor import monitor_trades

from app.api.v1.router import api_router


app = FastAPI(
    title="Matrix AI Trader",
    version="1.0.0"
)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(monitor_trades())


# Create database tables
Base.metadata.create_all(bind=engine)


# Register API v1
app.include_router(api_router)