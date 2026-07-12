from fastapi import (APIRouter)
from app.services.storage_service import save_processed_document

router = APIRouter()

@router.get("/processed")
def docs():
    return save_processed_document()