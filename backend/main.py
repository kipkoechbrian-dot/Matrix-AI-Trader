from fastapi import FastAPI

from app.api.routes import router

from app.database.connection import engine
from app.database.models import Base

app = FastAPI(
    title="Matrix AI Trader",
    version="1.0.0"
)

# Create database tables
Base.metadata.create_all(bind=engine)

app.include_router(router)