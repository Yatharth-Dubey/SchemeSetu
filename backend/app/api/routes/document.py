from fastapi import (APIRouter)
from backend.app.rag.vector_store import (DOCUMENTS)

router = APIRouter()

@router.get("/documents")
def docs():
    return DOCUMENTS