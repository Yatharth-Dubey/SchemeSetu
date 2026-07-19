import faiss
import json
import numpy as np
from app.core.config import VECTOR_DIR
from app.rag.embedding import generate_embeddings
from app.core.logger import logger
from app.exceptions.custom import VectorStoreError

class VectorStore:
    def __init__(self):
        logger.info("Initializing VectorStore...")
        self.index_file = VECTOR_DIR/"faiss.index"
        self.metadata_file = VECTOR_DIR/"metadata.json"

        self.index = self._load_index()
        self.metadata = self._load_metadata()
        logger.info(f"VectorStore initialized with {len(self.metadata)} chunks.")

    def _create_index(self):
        logger.info("Creating new FAISS index (dimention=384)")
        return faiss.IndexFlatIP(384)

    def _load_index(self):
        try:
            if self.index_file.exists():
                logger.info(f"Loading FAISS index from {self.index_file}")
                return faiss.read_index(str(self.index_file))
            logger.info("FAISS index not found. Creating a new one.")
            return self._create_index()
        except Exception as e:
            logger.exception("Failed to load FAISS index.")
            raise VectorStoreError(f"Failed to load FAISS index: {e}")
        
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

    def search(self, query: str, top_k: int = 5):
        try:
            logger.info(f"Searching for query: {query}")
            embeddings = generate_embeddings([query])
            scores, indices = self.index.search(
                np.array(embeddings, dtype=np.float32),
                top_k
            )
            
            logger.info(f"Retrieved {len(indices[0])} candidate chunks.")
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx == -1:
                    continue
                chunk = self.metadata.get(str(idx))

                if chunk:
                    logger.info(f"Retrieved chunk {idx} with score {score:.4f}")
                    results.append({
                        "score": float(score),
                        "chunk": chunk
                    })
            logger.info(f"Returning {len(results)} search results.")

            return results
        except Exception as e:
            logger.exception("Vector search failed.")
            raise VectorStoreError(f"Vector search failed: {e}")