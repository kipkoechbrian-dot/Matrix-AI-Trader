from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# A full DATABASE_URL wins when set — including the zero-setup
# SQLite option for local demos (no PostgreSQL install needed):
#   DATABASE_URL=sqlite:///./matrix.db
DATABASE_URL = os.getenv("DATABASE_URL") or (
    f"postgresql://{os.getenv('DATABASE_USER')}:"
    f"{os.getenv('DATABASE_PASSWORD')}@"
    f"{os.getenv('DATABASE_HOST')}:"
    f"{os.getenv('DATABASE_PORT')}/"
    f"{os.getenv('DATABASE_NAME')}"
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
