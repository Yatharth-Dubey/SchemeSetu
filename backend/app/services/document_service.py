import json
import os
import re
import shutil
from datetime import datetime
from pathlib import Path
from fastapi import HTTPException
from app.core.config import get_user_storage_paths
from app.core.logger import logger
from app.rag.vector_store import VectorStore

def delete_processed_document(document_id: str, user_id: str):
    # 1. Validate document ID.
    if not re.fullmatch(r"[A-Za-z0-9_-]+", document_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid document ID.",
        )
    paths = get_user_storage_paths(user_id)
    processed_dir = paths["processed_dir"]
    upload_dir = paths["upload_dir"]
    vector_dir = paths["vector_dir"]
    processed_path = processed_dir / f"{document_id}.json"
    if not processed_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Processed document not found.",
        )
    # 2. Read and validate document metadata.
    try:
        document = json.loads(
            processed_path.read_text(encoding="utf-8")
        )
    except (OSError, json.JSONDecodeError) as exc:
        logger.exception("Could not read document before deletion.")
        raise HTTPException(
            status_code=500,
            detail="Could not read document metadata.",
        ) from exc

    if document.get("document_id") != document_id:
        raise HTTPException(
            status_code=409,
            detail="Document ID does not match its processed record.",
        )

    if str(document.get("user_id")) != str(user_id):
        raise HTTPException(
            status_code=404,
            detail="Processed document not found.",
        )

    # 3. Find only the exact uploaded PDF associated with this record.
    stored_filename = document.get("filename")
    upload_path = None

    if stored_filename:
        if Path(stored_filename).name != stored_filename:
            raise HTTPException(
                status_code=409,
                detail="Unsafe stored filename; refusing to delete files.",
            )

        candidate = upload_dir / stored_filename

        if candidate.is_file() and candidate.suffix.lower() == ".pdf":
            upload_path = candidate

    # 4. Create a unique backup directory.
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")

    backup_dir = (
        vector_dir
        / "document_delete_backups"
        / f"{document_id}_{timestamp}"
    )
    backup_dir.mkdir(parents=True, exist_ok=False)

    index_path = vector_dir / "faiss.index"
    metadata_path = vector_dir / "metadata.json"

    # IMPORTANT: Track whether vector deletion has started.
    vector_operation_started = False

    try:
        # 5. Back up all files before making changes.
        shutil.copy2(index_path, backup_dir / "faiss.index")
        shutil.copy2(metadata_path, backup_dir / "metadata.json")
        shutil.copy2(processed_path, backup_dir / "document.json")

        if upload_path:
            shutil.copy2(upload_path, backup_dir / "uploaded.pdf")

        # 6. Verify that the vector backups exist and match file sizes.
        for original_name in ("faiss.index", "metadata.json"):
            original = vector_dir / original_name
            backup = backup_dir / original_name

            if (
                not backup.is_file()
                or backup.stat().st_size != original.stat().st_size
            ):
                raise RuntimeError(
                    f"Backup verification failed: {original_name}"
                )

        # 7. Remove the document's vectors.
        store = VectorStore(user_id=user_id)

        # Set the flag immediately before attempting the operation.
        vector_operation_started = True
        removed_chunks = store.remove_document(document_id)

        # 8. Delete disk files only after vector deletion succeeds.
        processed_path.unlink()

        if upload_path and upload_path.exists():
            upload_path.unlink()

        logger.info(
            "Deleted document %s; removed %s chunks.",
            document_id,
            removed_chunks,
        )

        return {
            "document_id": document_id,
            "removed_chunks": removed_chunks,
            "message": "Document deleted successfully.",
        }

    except Exception as exc:
        logger.exception(
            "Document deletion failed; attempting rollback."
        )

        # 9. Restore vector files only if vector deletion was attempted.
        if vector_operation_started:
            for filename in ("faiss.index", "metadata.json"):
                backup = backup_dir / filename

                if backup.exists():
                    temporary = vector_dir / f"{filename}.restore"

                    try:
                        shutil.copy2(backup, temporary)
                        os.replace(temporary, vector_dir / filename)
                    except OSError:
                        logger.exception(
                            "Failed to restore vector file: %s",
                            filename,
                        )

        # 10. Restore processed JSON if it was deleted.
        json_backup = backup_dir / "document.json"

        if json_backup.exists() and not processed_path.exists():
            try:
                shutil.copy2(json_backup, processed_path)
            except OSError:
                logger.exception(
                    "Failed to restore processed document JSON."
                )

        # 11. Restore uploaded PDF if it was deleted.
        pdf_backup = backup_dir / "uploaded.pdf"

        if (
            upload_path
            and pdf_backup.exists()
            and not upload_path.exists()
        ):
            try:
                shutil.copy2(pdf_backup, upload_path)
            except OSError:
                logger.exception("Failed to restore uploaded PDF.")

        if isinstance(exc, HTTPException):
            raise

        raise HTTPException(
            status_code=500,
            detail=(
                "Document deletion failed. Rollback was attempted; "
                "please verify the files and vector index."
            ),
        ) from exc