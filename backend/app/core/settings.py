from typing import Optional
from pydantic_settings import (BaseSettings, SettingsConfigDict)

class Settings(BaseSettings):
    # Gemini
    GEMINI_API_KEY: Optional[str] = None
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