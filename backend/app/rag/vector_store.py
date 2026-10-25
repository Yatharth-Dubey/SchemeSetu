import faiss
import json
import numpy as np
from app.rag.embedding import generate_embeddings
from app.core.logger import logger
from app.exceptions.custom import VectorStoreError
from app.core.config import get_user_storage_paths

class VectorStore:
    def __init__(self, user_id: str):
        logger.info("Initializing VectorStore for user %s", user_id)

        paths = get_user_storage_paths(user_id)
        self.vector_dir = paths["vector_dir"]
        self.index_file = self.vector_dir / "faiss.index"
        self.metadata_file = self.vector_dir / "metadata.json"

        self.index = self._load_index()
        self.metadata = self._load_metadata()

        logger.info(
            "VectorStore initialized with %s chunks for user %s.",
            len(self.metadata),
            user_id,
        )

    def _create_index(self):
        logger.info("Creating new FAISS index (dimention=384)")
        return faiss.IndexFlatIP(384)

    def _load_index(self):
        try:
            if self.index_file.exists():
                logger.info("Loading FAISS index.")
                return faiss.read_index(str(self.index_file))
            logger.info("FAISS index not found. Creating a new one.")
            return self._create_index()
        except Exception as e:
            logger.exception("Failed to load FAISS index.")
            raise VectorStoreError(
                "Could not load the vector store."
            ) from None

    def _save_index(self):
        try:
            faiss.write_index(self.index, str(self.index_file))
            logger.info(f"FAISS index saved to {self.index_file}")
        except Exception as e:
            logger.exception("Failed to save FAISS index.")
            raise VectorStoreError(f"Failed to save FAISS index: {e}")

    def _load_metadata(self):
        try:
            if self.metadata_file.exists():
                with open(self.metadata_file, "r", encoding="utf-8") as f:
                    metadata = json.load(f)
                logger.info(f"Loaded {len(metadata)} metadata entries.")
                return metadata
            logger.warning("Metadata file not found. Starting with empty metadata.")
            return {}
        except Exception as e:
            logger.exception("Failed to load metadata.")
            raise VectorStoreError(f"Failed to load metadata: {e}")

    def _save_metadata(self):
        try:
            with open(self.metadata_file, "w", encoding="utf-8") as f:
                json.dump(self.metadata, f, indent=4, ensure_ascii=False)
            logger.info(f"Saved {len(self.metadata)} metadata entries.")
        except Exception as e:
            logger.exception("Failed to save metadata.")
            raise VectorStoreError(f"Failed to save metadata: {e}")

    def add_chunks(self, chunks):
        try:
            logger.info(f"Adding {len(chunks)} chunks to vector store.")
            texts = [chunk.text for chunk in chunks]
            embeddings = generate_embeddings(texts)
            logger.info(f"Generated embeddings with shape {embeddings.shape}")
            start_id = len(self.metadata)
            self.index.add(
                np.array(
                    embeddings,
                    dtype=np.float32
                )
            )
            logger.info(f"Added {len(chunks)} vectors to FAISS index.")
            for i, chunk in enumerate(chunks):
                self.metadata[str(start_id + i)] = chunk.model_dump()

            self._save_index()
            self._save_metadata()
            logger.info("Vector store updated successfully.")
        except VectorStoreError:
            raise
        except Exception as e:
            logger.exception("Failed to add chunks to vector store.")
            raise VectorStoreError(f"Failed to add chunks: {e}")


    def remove_document(self, document_id: str):
        """Remove one document's chunks and rebuild the FAISS index safely."""
        try:
            # Confirm the index and metadata are aligned.
            if self.index.ntotal != len(self.metadata):
                raise VectorStoreError(
                    "FAISS index and metadata counts do not match."
                )
            expected_keys = {str(i) for i in range(self.index.ntotal)}
            if set(self.metadata.keys()) != expected_keys:
                raise VectorStoreError(
                    "Metadata keys do not match FAISS positions."
                )
            # Find all chunks belonging to this document.
            remove_positions = [
                int(key)
                for key, chunk in self.metadata.items()
                if chunk.get("document_id") == document_id
            ]
            if not remove_positions:
                return 0
            remove_set = set(remove_positions)
            keep_positions = [
                i for i in range(self.index.ntotal)
                if i not in remove_set
            ]
            # Build a new index in memory; don't alter the live index yet.
            new_index = faiss.IndexFlatIP(self.index.d)
            if keep_positions:
                vectors = np.vstack([
                    self.index.reconstruct(i)
                    for i in keep_positions
                ]).astype(np.float32)
                new_index.add(vectors)
            new_metadata = {
                str(new_position): self.metadata[str(old_position)]
                for new_position, old_position in enumerate(keep_positions)
            }
            # Back up both files before writing either one.
            from datetime import datetime
            import shutil
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            backup_dir = self.vector_dir / "delete_backups" / timestamp
            backup_dir.mkdir(parents=True, exist_ok=False)

            if self.index_file.exists():
                shutil.copy2(self.index_file, backup_dir / "faiss.index")
            if self.metadata_file.exists():
                shutil.copy2(self.metadata_file, backup_dir / "metadata.json")
            # Write temporary files first.
            temp_index = self.index_file.with_name("faiss.index.tmp")
            temp_metadata = self.metadata_file.with_name("metadata.json.tmp")
            try:
                faiss.write_index(new_index, str(temp_index))
                with open(temp_metadata, "w", encoding="utf-8") as f:
                    json.dump(new_metadata, f, indent=4, ensure_ascii=False)
                # Replace the live files only after both temp files are ready.
                import os
                os.replace(temp_index, self.index_file)
                os.replace(temp_metadata, self.metadata_file)
            except Exception:
                # Restore originals if the replacement fails.
                for temp in (temp_index, temp_metadata):
                    if temp.exists():
                        temp.unlink()
                backup_index = backup_dir / "faiss.index"
                backup_metadata = backup_dir / "metadata.json"
                if backup_index.exists():
                    shutil.copy2(backup_index, self.index_file)
                if backup_metadata.exists():
                    shutil.copy2(backup_metadata, self.metadata_file)
                raise
            # Update this instance only after successful disk replacement.
            self.index = new_index
            self.metadata = new_metadata
            logger.info(
                "Removed %s chunks for document %s.",
                len(remove_positions),
                document_id,
            )
            return len(remove_positions)
        except VectorStoreError:
            raise
        except Exception as e:
            logger.exception("Failed to remove document from vector store.")
            raise VectorStoreError(f"Failed to remove document: {e}")

    def search(self, query: str, top_k: int = 5, min_score: float = 0.20):
        try:
            logger.info("Searching vector store for relevant chunks.")

            embeddings = generate_embeddings([query])

            scores, indices = self.index.search(
                np.array(embeddings, dtype=np.float32),
                top_k,
            )

            logger.info(f"Retrieved {len(indices[0])} candidate chunks.")

            results = []

            for score, idx in zip(scores[0], indices[0]):
                if idx == -1:
                    continue

                if float(score) < min_score:
                    logger.info(
                        "Skipping low-score chunk %s | score=%.4f",
                        idx,
                        score,
                    )
                    continue

                chunk = self.metadata.get(str(idx))

                if chunk:
                    logger.info(
                        "Retrieved chunk %s | score=%.4f | file=%s | page=%s",
                        idx,
                        score,
                        chunk.get("filename"),
                        chunk.get("page_number"),
                    )

                    results.append({
                        "score": float(score),
                        "chunk": chunk,
                    })

            logger.info(f"Returning {len(results)} filtered search results.")
            return results

        except Exception as e:
            logger.exception("Vector search failed.")
            raise VectorStoreError(f"Vector search failed: {e}")
