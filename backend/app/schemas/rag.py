from pydantic import BaseModel

class Source(BaseModel):
    filename: str
    page_number: int

class RAGResponse(BaseModel):
    answer: str
    sources: list[Source]
    retrieved_chunks: int