from fastapi import (APIRouter, UploadFile, File)
from app.services.upload_service import (save_pdf)

router = APIRouter()

@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    path=await save_pdf(file)
    return{
        "filename":file.filename,
        "path":path
    }