import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MandiTrace API"
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = "manditrace"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # Short-lived
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30    # Long-lived
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")

    class Config:
        env_file = ".env"

settings = Settings()
