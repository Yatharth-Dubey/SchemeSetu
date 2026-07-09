import os
from app.rag.loader import (extract_text)
from app.rag.chunker import (chunk_text)
from backend.app.rag.vector_store import (DOCUMENTS)

UPLOAD_DIR="uploads"
os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)

async def save_pdf(file):
    path=f"{UPLOAD_DIR}/{file.filename}"
    content=await file.read()
    with open(path, "wb") as f:
        f.write(content)
    text=extract_text(path)
    chunks=chunk_text(text)
    DOCUMENTS[file.filename]=chunks

    return path