from app.rag.embedding import generate_embeddings
from app.rag.vector_store import add_embeddings
from app.schemas.document import DocumentChunk

texts = [
    "PMAY eligibility criteria",
    "Ayushman Bharat benefits"
]

chunks = [
    DocumentChunk(
        chunk_id="chunk1",
        document_id="doc1",
        filename="test.pdf",
        page_number=1,
        text=texts[0],
        character_count=len(texts[0])
    ),
    DocumentChunk(
        chunk_id="chunk2",
        document_id="doc1",
        filename="test.pdf",
        page_number=2,
        text=texts[1],
        character_count=len(texts[1])
    )
]

embeddings = generate_embeddings(texts)
add_embeddings(embeddings, chunks)

print(embeddings.shape, "Done")