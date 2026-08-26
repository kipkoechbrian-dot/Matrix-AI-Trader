from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()


def _resolve_database_url() -> str:
    """Pick the database URL — and NEVER crash when env vars are missing.

    Priority:
      1. Full DATABASE_URL (Render/Railway inject this in production)
      2. Discrete DATABASE_* parts (classic local PostgreSQL setup)
      3. Zero-setup SQLite file — always works, perfect for demos.

    This is what lets the same code run on a laptop, in Docker, and on
    Render's free tier without touching a single setting.
    """
    url = (os.getenv("DATABASE_URL") or "").strip()
    if url:
        # Heroku-style scheme that SQLAlchemy 2.x rejects
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://"):]
        return url

    parts = [
        os.getenv("DATABASE_USER"),
        os.getenv("DATABASE_PASSWORD"),
        os.getenv("DATABASE_HOST"),
        os.getenv("DATABASE_PORT"),
        os.getenv("DATABASE_NAME"),
    ]
    if all(parts):
        user, password, host, port, name = parts
        return f"postgresql://{user}:{password}@{host}:{port}/{name}"

    return "sqlite:///./matrix.db"


DATABASE_URL = _resolve_database_url()

# Log the mode only — never the full URL (it may contain credentials)
print(
    "🔌 Database mode:",
    "SQLite (zero-setup file)"
    if DATABASE_URL.startswith("sqlite")
    else f"external ({DATABASE_URL.split('://', 1)[0]})",
)

engine = create_engine(
    DATABASE_URL,
    # SQLite file DB needs this for FastAPI's threaded request handling
    connect_args={"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {},
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
