import os
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

    return path