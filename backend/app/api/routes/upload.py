
from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile

from app.core.auth import get_current_user
from app.models.user import User
from app.services.upload_service import save_pdf, process_pdf_background
from app.schemas.api import APIResponse
from app.schemas.upload import UploadResponse

router = APIRouter()


@router.post("/upload", response_model=APIResponse[UploadResponse])
async def upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    result = await save_pdf(file, user_id=str(current_user.id))

    background_tasks.add_task(
        process_pdf_background,
        str(current_user.id),
        result["document_id"],
        result["filename"],
    )

    return APIResponse(
        message="PDF uploaded. Processing has been queued.",
        data=UploadResponse(**result),
    )
