
from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.document import DocumentDeleteResponse
from app.services.storage_service import list_processed_documents
from app.services.document_service import delete_processed_document

router = APIRouter()


@router.get("/processed")
def docs(
    current_user: User = Depends(get_current_user),
):
    return list_processed_documents(user_id=str(current_user.id))


@router.delete(
    "/processed/{document_id}",
    response_model=DocumentDeleteResponse,
)
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
):
    return delete_processed_document(
        document_id=document_id,
        user_id=str(current_user.id),
    )
