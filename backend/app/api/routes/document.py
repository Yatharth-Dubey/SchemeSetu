from fastapi import (APIRouter)
from app.rag.store import (DOCUMENTS)

router = APIRouter()

@router.get("/documents")
def docs():
    return DOCUMENTS