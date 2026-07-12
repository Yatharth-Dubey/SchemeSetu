from pypdf import PdfReader
from app.schemas.document import PageData

def extract_text(path: str) -> list[PageData]:

    reader = PdfReader(path)
    pages = []
    
    for page_number, page in enumerate(reader.pages, start=1):
        content = page.extract_text()
        if content and content.strip():
            pages.append(
                PageData(
                    page_number=page_number,
                    text=content
                )
            )

    return pages