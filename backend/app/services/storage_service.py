
import json
from datetime import datetime, timezone

from app.core.config import get_user_storage_paths
from app.core.logger import logger


def _document_path(user_id: str, document_id: str):
    processed_dir = get_user_storage_paths(user_id)["processed_dir"]
    return processed_dir / f"{document_id}.json"


def create_document_record(
    user_id: str,
    document_id: str,
    filename: str,
    file_hash: str,
) -> None:
    """Create a persistent record before background processing starts."""
    output_file = _document_path(user_id, document_id)

    if output_file.exists():
        raise FileExistsError("Document record already exists.")

    data = {
        "user_id": str(user_id),
        "document_id": document_id,
        "filename": filename,
        "file_hash": file_hash,
        "chunk_count": 0,
        "chunks": [],
        "status": "uploaded",
        "error": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    output_file.parent.mkdir(parents=True, exist_ok=True)
    with output_file.open("x", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


def update_document_status(
    user_id: str,
    document_id: str,
    status: str,
    error: str | None = None,
) -> None:
    """Update status without discarding existing document metadata."""
    if status not in {"uploaded", "processing", "completed", "failed"}:
        raise ValueError("Invalid document status.")

    output_file = _document_path(user_id, document_id)

    with output_file.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if (
        str(data.get("user_id")) != str(user_id)
        or data.get("document_id") != document_id
    ):
        raise ValueError("Document ownership or ID mismatch.")

    data["status"] = status
    data["error"] = error
    data["updated_at"] = datetime.now(timezone.utc).isoformat()

    temporary_file = output_file.with_suffix(".json.tmp")
    try:
        with temporary_file.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        temporary_file.replace(output_file)
    finally:
        if temporary_file.exists():
            temporary_file.unlink()


def save_processed_document(
    user_id: str,
    document_id: str,
    filename: str,
    chunks: list,
):
    output_file = _document_path(user_id, document_id)

    logger.info("Saving processed document: %s", filename)
    logger.info("User ID: %s", user_id)
    logger.info("Document ID: %s", document_id)

    existing = {}
    if output_file.exists():
        with output_file.open("r", encoding="utf-8") as f:
            existing = json.load(f)

        if (
            str(existing.get("user_id")) != str(user_id)
            or existing.get("document_id") != document_id
        ):
            raise ValueError("Document ownership or ID mismatch.")

    data = {
        **existing,
        "user_id": str(user_id),
        "document_id": document_id,
        "filename": filename,
        "chunk_count": len(chunks),
        "chunks": [chunk.model_dump() for chunk in chunks],
        # Do not mark completed here. Vector indexing must also succeed.
        "status": "processing",
        "error": None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    output_file.parent.mkdir(parents=True, exist_ok=True)

    temporary_file = output_file.with_suffix(".json.tmp")
    try:
        with temporary_file.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        temporary_file.replace(output_file)
        logger.info("Processed document saved: %s", output_file)
    except Exception:
        logger.exception("Failed to save processed document: %s", filename)
        raise
    finally:
        if temporary_file.exists():
            temporary_file.unlink()


def list_processed_documents(user_id: str):
    """Return only the authenticated user's document records."""
    processed_dir = get_user_storage_paths(user_id)["processed_dir"]
    documents = []

    if not processed_dir.exists():
        return documents

    for file_path in sorted(processed_dir.glob("*.json")):
        # Ignore temporary files or records currently being written.
        if file_path.name.endswith(".json.tmp"):
            continue

        try:
            with file_path.open("r", encoding="utf-8") as f:
                data = json.load(f)

            if str(data.get("user_id")) != str(user_id):
                logger.warning(
                    "Skipping document with mismatched owner: %s",
                    file_path.name,
                )
                continue

            documents.append({
                "document_id": data.get("document_id", file_path.stem),
                "filename": data.get("filename", "Unknown"),
                "user_id": str(user_id),
                "chunk_count": data.get(
                    "chunk_count", len(data.get("chunks", []))
                ),
                "status": data.get("status", "completed"),
                "error": data.get("error"),
                "created_at": data.get("created_at"),
                "updated_at": data.get("updated_at"),
            })

        except (json.JSONDecodeError, OSError):
            logger.exception(
                "Could not read processed document: %s",
                file_path,
            )

    return documents
