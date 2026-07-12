from app.rag.loader import extract_text
from app.rag.chunker import chunk_text
from app.rag.vector_store import VectorStore
from app.services.storage_service import save_processed_document
from pathlib import Path
from app.schemas.document import DocumentChunk

class DocumentProcessor:
    """
        Handles the complete document processing pipeline.
        Pipeline:
            PDF
            -> Text Extraction
            -> Chunking
            -> JSON Storage
            -> Embedding Generation
            -> Vector Store
    """
    def __init__(self):
        self.vector_store = VectorStore()
    def process_document(
        self,
        user_id: str,
        document_id: str,
        filename: str,
        pdf_path: Path,
    ) -> list[DocumentChunk]:
        """
        Process a PDF and index it into the vector store.
        """
        pages = extract_text(pdf_path)
        chunks = chunk_text(
            document_id=document_id,
            filename=filename,
            pages=pages
        )
        save_processed_document(
            user_id=user_id,
            document_id=document_id,
            filename=filename,
            chunks=chunks
        )
        self.vector_store.add_chunks(chunks)
        return chunks