from pathlib import Path
import asyncio
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.database.connection import engine
from app.database.models import Base

from app.api.v1.router import api_router
from app.core.spa import SpaStaticFiles
from app.services.market_provider import start_provider
from app.services.trade_monitor import monitor_trades


app = FastAPI(
    title="Matrix AI Trader",
    version="1.0.0"
)

# ---------------------------------------------------------------------------
# CORS — only needed for split local dev (React dev server on :5173).
# In production the frontend is served by THIS app (same origin).
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

# Compress large JSON/HTML responses (charts, candle history)
app.add_middleware(GZipMiddleware, minimum_size=1024)


@app.on_event("startup")
async def startup_event():
    start_provider()
    asyncio.create_task(monitor_trades())


# Create database tables
Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------------
# Lightweight column migrations — keep existing databases working
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


@app.get("/api")
def api_root():
    return {
        "name": "Matrix AI Trader API",
        "version": "1.0.0",
        "docs": "/docs",
        "api": "/api/v1",
    }


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Production frontend — serve the built Vite app (single origin).
# In dev, run the Vite server separately and this mount is simply absent.
# ---------------------------------------------------------------------------
FRONTEND_DIST = Path(__file__).parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount(
        "/",
        SpaStaticFiles(directory=FRONTEND_DIST, html=True),
        name="spa",
    )
