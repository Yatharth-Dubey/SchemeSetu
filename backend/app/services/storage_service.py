import json
from app.core.config import PROCESSED_DIR
from app.core.logger import logger

def save_processed_document(
    user_id: str,
    document_id: str,
    filename: str,
    chunks: list,
):
    logger.info(f"Saving processed document: {filename}")
    logger.info(f"User ID: {user_id}")
    logger.info(f"Document ID: {document_id}")
    logger.info(f"Number of chunks: {len(chunks)}")
    try:
        data = {
            "user_id": user_id,
            "document_id": document_id,
            "filename": filename,
            "chunk_count": len(chunks),
            "chunks": [chunk.model_dump() for chunk in chunks],
        }
        PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
        output_file = PROCESSED_DIR / f"{document_id}.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

        logger.info(f"Processed document saved successfully: {output_file}")
    except Exception:
        logger.exception(f"Failed to save processed document: {filename}")
        raise


def list_processed_documents():
    """Return a summary of all processed documents."""
    logger.info("Listing processed documents.")
    documents = []
    if not PROCESSED_DIR.exists():
        return documents
    for file_path in sorted(PROCESSED_DIR.glob("*.json")):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            documents.append({
                "document_id": data.get("document_id", file_path.stem),
                "filename": data.get("filename", "Unknown"),
                "user_id": data.get("user_id", "local_dev"),
                "chunk_count": data.get(
                    "chunk_count",
                    len(data.get("chunks", [])),
                ),
            })
        except (json.JSONDecodeError, OSError):
            logger.exception(
                f"Could not read processed document: {file_path}"
            )

    return documents