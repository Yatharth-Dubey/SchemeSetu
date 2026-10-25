
import hashlib
import json
from pathlib import Path

from fastapi import HTTPException

from app.core.config import get_user_storage_paths
from app.core.logger import logger
from app.utils.id_generator import generate_doucment_id
from app.rag.document_processor import DocumentProcessor
from app.services.storage_service import (
    create_document_record,
    update_document_status,
)

MAX_PDF_SIZE = 10 * 1024 * 1024  # 10 MB


def validate_pdf(filename: str | None, content: bytes) -> None:
    if not filename or not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")

    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if len(content) > MAX_PDF_SIZE:
        raise HTTPException(
            status_code=413,
            detail="The PDF exceeds the 10 MB size limit.",
        )

    if not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid PDF.",
        )


async def save_pdf(file, user_id: str) -> dict:
    """Validate and persist a PDF without processing it synchronously."""
    paths = get_user_storage_paths(user_id)
    upload_dir = paths["upload_dir"]
    processed_dir = paths["processed_dir"]

    content = await file.read()
    validate_pdf(file.filename, content)

    file_hash = hashlib.sha256(content).hexdigest()

    # Check duplicates within this user's storage.
    for uploaded_file in upload_dir.glob("*.pdf"):
        try:
            existing_hash = hashlib.sha256(
                uploaded_file.read_bytes()
            ).hexdigest()
        except OSError:
            logger.exception("Could not read uploaded file: %s", uploaded_file)
            continue

        if existing_hash == file_hash:
            raise HTTPException(
                status_code=409,
                detail="This PDF has already been uploaded.",
            )

    for processed_file in processed_dir.glob("*.json"):
        try:
            with processed_file.open("r", encoding="utf-8") as f:
                document = json.load(f)
        except (OSError, json.JSONDecodeError):
            logger.exception(
                "Could not read processed document: %s",
                processed_file,
            )
            continue

        if document.get("file_hash") == file_hash:
            raise HTTPException(
                status_code=409,
                detail="This PDF has already been processed.",
            )

    # Prevent path traversal through the uploaded filename.
    original_filename = (file.filename or "document.pdf")
    original_filename = original_filename.replace("\\", "/").split("/")[-1]

    if not original_filename or original_filename in {".", ".."}:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    document_id = generate_doucment_id()
    stored_filename = f"{document_id}_{original_filename}"
    upload_path = upload_dir / stored_filename
    record_created = False

    try:
        # Exclusive creation avoids accidentally overwriting another file.
        with upload_path.open("xb") as f:
            f.write(content)

        create_document_record(
            user_id=str(user_id),
            document_id=document_id,
            filename=stored_filename,
            file_hash=file_hash,
        )
        record_created = True

        logger.info(
            "PDF accepted for background processing. User=%s Document=%s",
            user_id,
            document_id,
        )

        return {
            "document_id": document_id,
            "filename": stored_filename,
            "status": "uploaded",
        }

    except Exception:
        logger.exception("Could not save uploaded PDF for user %s.", user_id)

        for failed_path in (
            upload_path,
            processed_dir / f"{document_id}.json",
        ):
            try:
                if failed_path.exists():
                    failed_path.unlink()
            except OSError:
                logger.exception("Failed to clean up: %s", failed_path)

        raise


def process_pdf_background(
    user_id: str,
    document_id: str,
    filename: str,
) -> None:
    """Process one accepted PDF in FastAPI's background task."""
    paths = get_user_storage_paths(user_id)
    pdf_path = paths["upload_dir"] / filename

    try:
        if not pdf_path.is_file():
            raise FileNotFoundError("Uploaded PDF was not found.")

        update_document_status(
            user_id=user_id,
            document_id=document_id,
            status="processing",
        )

        processor = DocumentProcessor(user_id=str(user_id))
        processor.process_document(
            user_id=str(user_id),
            document_id=document_id,
            filename=filename,
            pdf_path=pdf_path,
        )

        # Mark completed only after document processing and indexing return.
        update_document_status(
            user_id=user_id,
            document_id=document_id,
            status="completed",
        )

        logger.info(
            "PDF processing completed. User=%s Document=%s",
            user_id,
            document_id,
        )

    except Exception:
        logger.exception(
            "Background PDF processing failed. User=%s Document=%s",
            user_id,
            document_id,
        )

        try:
            update_document_status(
                user_id=user_id,
                document_id=document_id,
                status="failed",
                error="Processing failed. Please try uploading the document again.",
            )
        except Exception:
            logger.exception(
                "Could not record failed status. User=%s Document=%s",
                user_id,
                document_id,
            )
