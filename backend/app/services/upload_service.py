
import hashlib
import json
from fastapi import HTTPException
from app.core.config import UPLOAD_DIR, PROCESSED_DIR
from app.utils.id_generator import generate_doucment_id
from app.rag.document_processor import DocumentProcessor

MAX_PDF_SIZE = 10 * 1024 * 1024  # 10 MB

MAX_PDF_SIZE = 10 * 1024 * 1024  # 10 MB


def validate_pdf(filename: str | None, content: bytes) -> None:
    if not filename or not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file.",
        )

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

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

async def save_pdf(file):
    content = await file.read()
    validate_pdf(file.filename, content)
    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )
    file_hash = hashlib.sha256(content).hexdigest()
    # Check existing uploaded PDFs by their actual content.
    for uploaded_file in UPLOAD_DIR.glob("*.pdf"):
        existing_hash = hashlib.sha256(
            uploaded_file.read_bytes()
        ).hexdigest()

        if existing_hash == file_hash:
            raise HTTPException(
                status_code=409,
                detail="This PDF has already been uploaded.",
            )
    # Check processed records as an additional safeguard.
    for processed_file in PROCESSED_DIR.glob("*.json"):
        with open(processed_file, "r", encoding="utf-8") as f:
            document = json.load(f)
        if document.get("file_hash") == file_hash:
            raise HTTPException(
                status_code=409,
                detail="This PDF has already been processed.",
            )

    original_filename = file.filename or "document.pdf"
    document_id = generate_doucment_id()
    stored_filename = f"{document_id}_{original_filename}"
    path = UPLOAD_DIR / stored_filename
    with open(path, "wb") as f:
        f.write(content)

    processor = DocumentProcessor()
    processor.process_document(
        user_id="local_dev",
        document_id=document_id,
        filename=stored_filename,
        pdf_path=path,
    )

    # Store the hash for future duplicate checks.
    processed_path = PROCESSED_DIR / f"{document_id}.json"
    if processed_path.exists():
        with open(processed_path, "r", encoding="utf-8") as f:
            document = json.load(f)
        document["file_hash"] = file_hash
        with open(processed_path, "w", encoding="utf-8") as f:
            json.dump(document, f, indent=4, ensure_ascii=False)

    return path