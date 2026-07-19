from app.rag.loader import extract_text
from app.rag.chunker import chunk_text
from app.rag.vector_store import VectorStore
from app.services.storage_service import save_processed_document
from pathlib import Path
from app.schemas.document import DocumentChunk
from app.core.logger import logger

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
        logger.info("Initializing DocumentProcessor...")
        self.vector_store = VectorStore()
        logger.info("DocumentProcessor initialized successfully.")

    def process_document(
        self, user_id: str, document_id: str,
        filename: str, pdf_path: Path,
    ) -> list[DocumentChunk]:
        
        logger.info(f"Started processing document: {filename}")
        logger.info(f"User ID: {user_id}")
        logger.info(f"Document ID: {document_id}")

        #step1 - Extract text
        logger.info("step 1/4: Extracting text from PDFs...")
        pages = extract_text(pdf_path)
        logger.info(f"Extracted {len(pages)} pages.")

        #step2 - Chunking
        logger.info("step 2/4: Creating chunks...")
        chunks = chunk_text(
            document_id=document_id,
            filename=filename,
            pages=pages
        )
        logger.info(f"Created {len(chunks)} chunks.")

        #setp3 - Save JSON
        logger.info("step 3/4: Saving processed document...")
        save_processed_document(
            user_id=user_id,
            document_id=document_id,
            filename=filename,
            chunks=chunks
        )
        logger.info("Processed document saved successfully.")

        #step4 - Add to FAISS
        logger.info("Step 4/4: Adding chunks to vector store...")
        self.vector_store.add_chunks(chunks)
        logger.info("chunks indexed successfully.")

        logger.info(f"Finished processing document: {filename}")
        
        return chunks