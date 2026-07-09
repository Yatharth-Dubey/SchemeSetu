from pypdf import PdfReader

def extract_text(path:str):

    reader = PdfReader(path)
    text = []
    
    for page in reader.pages:
        content = page.extract_text()
        if content:
            text.append(content)

    return "\n".join(text)