import numpy as np

from app.rag import vector_store as vector_store_module
from app.rag.vector_store import VectorStore
from app.schemas.document import DocumentChunk


def test_vector_store_adds_chunks(tmp_path, monkeypatch):
    paths = {
        "user_dir": tmp_path,
        "upload_dir": tmp_path / "uploads",
        "processed_dir": tmp_path / "processed",
        "vector_dir": tmp_path / "vectors",
    }

    for path in paths.values():
        path.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(
        vector_store_module,
        "get_user_storage_paths",
        lambda user_id: paths,
    )
    monkeypatch.setattr(
        vector_store_module,
        "generate_embeddings",
        lambda texts: np.array(
            [[1.0] + [0.0] * 383 for _ in texts],
            dtype=np.float32,
        ),
    )

    store = VectorStore(user_id="pytest-user")

    chunks = [
        DocumentChunk(
            chunk_id="chunk1",
            document_id="doc1",
            filename="test.pdf",
            page_number=1,
            text="PMAY eligibility criteria",
            character_count=len("PMAY eligibility criteria"),
        ),
        DocumentChunk(
            chunk_id="chunk2",
            document_id="doc1",
            filename="test.pdf",
            page_number=2,
            text="Ayushman Bharat benefits",
            character_count=len("Ayushman Bharat benefits"),
        ),
    ]

    store.add_chunks(chunks)

    assert store.index.ntotal == 2
    assert len(store.metadata) == 2
    assert store.index_file.exists()
    assert store.metadata_file.exists()