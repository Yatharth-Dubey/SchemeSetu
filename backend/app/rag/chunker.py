from app.schemas.document import DocumentChunk, PageData

def chunk_text(
    document_id: str,
    filename: str,
    pages: list[PageData],
    chunk_size: int = 500
) -> list[DocumentChunk]:
    chunks = []
    chunk_number = 1
    for page in pages:
        text = page.text
        for i in range(0, len(text), chunk_size):
            chunk_text = text[i:i + chunk_size]
            chunks.append(
                DocumentChunk(
                    chunk_id=f"chunk_{document_id}_{chunk_number}",
                    document_id=document_id,
                    filename=filename,
                    page_number=page.page_number,
                    text=chunk_text,
                    character_count=len(chunk_text)
                )
            )
            chunk_number += 1
    return chunks