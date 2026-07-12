import faiss
import json
import numpy as np
from app.core.config import VECTOR_DIR
from app.rag.embedding import generate_embeddings

class VectorStore:
    def __init__(self):
        self.index_file = VECTOR_DIR/"faiss.index"
        self.metadata_file = VECTOR_DIR/"metadata.json"

        self.index = self._load_index()
        self.metadata = self._load_metadata()

    def _create_index(self):
        return faiss.IndexFlatIP(384)

    def _load_index(self):
        if self.index_file.exists():
            return faiss.read_index(str(self.index_file))
        return self._create_index()
        
    def _save_index(self):
        faiss.write_index(self.index, str(self.index_file))

    def _load_metadata(self):
        if self.metadata_file.exists():
            with open(self.metadata_file, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def _save_metadata(self):
        with open(self.metadata_file, "w", encoding="utf-8") as f:
            json.dump(self.metadata, f, indent=4, ensure_ascii=False)

    def add_chunks(self, chunks):
        texts = [chunk.text for chunk in chunks]
        embeddings = generate_embeddings(texts)
        start_id = len(self.metadata)
        self.index.add(
            np.array(
                embeddings,
                dtype=np.float32
            )
        )
        for i, chunk in enumerate(chunks):
            self.metadata[str(start_id + i)] = chunk.model_dump()

        self._save_index()
        self._save_metadata()

    def search(self, query: str, top_k: int = 5):
        """
        Search the vector store and return the most relevant chunks.
        """
        embeddings = generate_embeddings([query])
        scores, indices = self.index.search(
            np.array(embeddings, dtype=np.float32),
            top_k
        )
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            chunk = self.metadata.get(str(idx))

            if chunk:
                results.append({
                    "score": float(score),
                    "chunk": chunk
                })

        return results