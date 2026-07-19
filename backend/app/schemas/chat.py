from pydantic import BaseModel
from app.schemas.rag import Source
#chat request and response validation
class ChatRequest(BaseModel):
    question:str

class ChatResponse(BaseModel):
    answer:str
    sources: list[Source]
    retrieved_chunks:int