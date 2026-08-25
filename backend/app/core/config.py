import os
from dotenv import load_dotenv

load_dotenv()


class Settings:

    DATABASE_URL = os.getenv("DATABASE_URL")

    SECRET_KEY = os.getenv("SECRET_KEY")

    ALGORITHM = os.getenv("ALGORITHM", "HS256")

    ACCESS_TOKEN_EXPIRE_MINUTES = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60)
    )

    SMTP_HOST = os.getenv("SMTP_HOST")

    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))

    SMTP_USERNAME = os.getenv("SMTP_USERNAME")

    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

    EMAIL_FROM = os.getenv("EMAIL_FROM")


settings = Settings()