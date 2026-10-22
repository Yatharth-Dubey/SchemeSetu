from pydantic import BaseModel

class DocumentChunk(BaseModel):
    chunk_id: str
    document_id: str
    filename: str
    page_number: int
    text: str
    character_count: int

class PageData(BaseModel):
    page_number: int
    text: str

class DocumentDeleteResponse(BaseModel):
    document_id: str
    removed_chunks: int
    message: str
