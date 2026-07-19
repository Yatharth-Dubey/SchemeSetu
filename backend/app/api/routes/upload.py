from fastapi import (APIRouter, UploadFile, File)
from app.services.upload_service import (save_pdf)
from app.schemas.api import APIResponse
from app.schemas.upload import UploadResponse

router = APIRouter()

@router.post("/upload", response_model=APIResponse[UploadResponse])
async def upload(file: UploadFile = File(...)):
    path=await save_pdf(file)
    return APIResponse(
        message="File upload successfully.",
        data=UploadResponse(
            filename=file.filename,
            path=path
        )
    )