from typing import Optional
from pydantic_settings import (BaseSettings, SettingsConfigDict)

class Settings(BaseSettings):
    # Gemini
    GEMINI_API_KEY: Optional[str] = None
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Embeddings
    EMBEDDING_MODEL: str = (
        "sentence-transformers/all-MiniLM-L6-v2"
    )

    # RAG
    TOP_K: int = 5
    MAX_CHUNK_SIZE: int = 500

    # Pydantic
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()

if not settings.GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY not found in .env"
    )