import json
from pathlib import Path
from app.core.config import PROCESSED_DIR
from app.core.logger import logger

def save_processed_document(document_id: str, filename: str, chunks: list):
    logger.info(f"Saving processed document: {filename}")
    logger.info(f"Document ID: {document_id}")
    logger.info(f"Number of chunks: {len(chunks)}")
    try:
        data = {
            "document_id": document_id,
            "filename": filename,
            "chunk_count": len(chunks),
            "chunks": [chunk.model_dump() for chunk in chunks]
        }

        output_file = PROCESSED_DIR / f"{document_id}.json"
        logger.debug(f"Output path: {output_file}")

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(
                data,
                f,
                indent=4,
                ensure_ascii=False
            )
        logger.info(f"Processed document saved successfully: {output_file}")

    except Exception:
        logger.exception(f"Failed to save processed document: {filename}")
        raise 