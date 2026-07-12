from app.core.config import UPLOAD_DIR
from app.utils.id_generator import generate_doucment_id
from app.rag.document_processor import DocumentProcessor

async def save_pdf(file):
    path=UPLOAD_DIR/file.filename
    content=await file.read()

    with open(path, "wb") as f:
        f.write(content)

    document_id= generate_doucment_id()
    processor = DocumentProcessor(user_id="local_dev")

    processor.process_document(
        document_id=document_id,
        filename=file.filename,
        pdf_path=path
    )

    return path