from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import os

from app.database.connection import engine
from app.database.models import Base

from app.services.trade_monitor import monitor_trades
from app.services.market_provider import start_provider

from app.api.v1.router import api_router


app = FastAPI(
    title="Matrix AI Trader",
    version="1.0.0"
)

# ---------------------------------------------------------------------------
# CORS — the React dev server runs on :5173, the API on :8000.
# Without this the browser blocks every frontend request.
# Override/extend origins with the CORS_ORIGINS env var (comma separated).
# ---------------------------------------------------------------------------
origins = [
    o.strip()
    for o in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    start_provider()
    asyncio.create_task(monitor_trades())


# Create database tables
Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------------
# Lightweight column migrations — keep existing dev databases working
# when the schema grows (safe to re-run; no-ops once applied).
# ---------------------------------------------------------------------------
def ensure_trade_columns():
    from sqlalchemy import text

    additions = [
        ("stop_loss", "FLOAT"),
        ("take_profit", "FLOAT"),
        ("close_reason", "VARCHAR(30)"),
    ]

    for column, col_type in additions:
        try:
            with engine.begin() as conn:
                conn.execute(
                    text(f"ALTER TABLE trades ADD COLUMN {column} {col_type}")
                )
        except Exception:
            # Column already exists — nothing to do
            pass


try:
    ensure_trade_columns()
except Exception:
    pass


# Register API v1
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "name": "Matrix AI Trader API",
        "version": "1.0.0",
        "docs": "/docs",
        "api": "/api/v1",
    }
