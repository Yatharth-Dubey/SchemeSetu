from typing import Generic, TypeVar
from pydantic import BaseModel
from app.schemas.rag import Source

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str
    data: T

