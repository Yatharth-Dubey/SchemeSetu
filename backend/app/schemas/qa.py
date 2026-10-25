from datetime import datetime
from pydantic import BaseModel
from app.schemas.rag import Source


class QAItem(BaseModel):
    id: int
    question: str
    answer: str
    sources: list[Source]
    created_at: datetime


class QAHistoryPage(BaseModel):
    items: list[QAItem]
    has_more: bool
    next_cursor: str | None = None