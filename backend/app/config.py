import os
from typing import List
from dotenv import load_dotenv

# Load .env file
load_dotenv()


class Settings:
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1")

    # MongoDB Configuration (Supports local or remote MongoDB Atlas cluster)
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "sanctum_db")
    MONGODB_SERVER_SELECTION_TIMEOUT_MS: int = int(os.getenv("MONGODB_SERVER_SELECTION_TIMEOUT_MS", "5000"))

    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/callback")

    # Permitted university domain (Strict matching)
    ALLOWED_EMAIL_DOMAIN: str = os.getenv("ALLOWED_EMAIL_DOMAIN", "ahduni.edu.in")

    # Session & Security
    SESSION_SECRET: str = os.getenv("SESSION_SECRET", "sanctum-ultra-secure-session-key-change-in-production-2026")
    SESSION_COOKIE_NAME: str = os.getenv("SESSION_COOKIE_NAME", "sanctum_session")
    SESSION_EXPIRE_HOURS: int = int(os.getenv("SESSION_EXPIRE_HOURS", "72"))
    SESSION_COOKIE_SECURE: bool = os.getenv("SESSION_COOKIE_SECURE", "False").lower() in ("true", "1")
    SESSION_COOKIE_SAMESITE: str = os.getenv("SESSION_COOKIE_SAMESITE", "lax")

    # Frontend Origin for CORS
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    ADDITIONAL_ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # Dev/Test helper (Strictly disabled if ENVIRONMENT == "production")
    DEV_AUTH_ENABLED: bool = os.getenv("DEV_AUTH_ENABLED", "True").lower() in ("true", "1")


settings = Settings()
