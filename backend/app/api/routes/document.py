from fastapi import APIRouter
from app.schemas.document import DocumentDeleteResponse
from app.services.storage_service import list_processed_documents
from app.services.document_service import delete_processed_document

router = APIRouter()

@router.get("/processed")
def docs():
    return list_processed_documents()

@router.delete(
    "/processed/{document_id}",
    response_model=DocumentDeleteResponse,
)
def delete_document(document_id: str):
    return delete_processed_document(document_id)