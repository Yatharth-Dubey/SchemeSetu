import json
from pathlib import Path
from app.core.config import PROCESSED_DIR

def save_processed_document(document_id: str, filename: str, chunks: list):
    data={
        "document_id": document_id,
        "filename": filename,
        "chunk_count": len(chunks),
        "chunks" : [chunks.model_dump() for chunk in chunks]
    }
    output_file = PROCESSED_DIR/f"{document_id}.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(
            data,
            f,
            indent=4,
            ensure_ascii=False
        )