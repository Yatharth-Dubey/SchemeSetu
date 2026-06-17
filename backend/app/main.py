from fastapi import FastAPI
app = FastAPI(
    title = "SchemeSetu API"
)

@app.get("/")
def home():
    return{
        "message": "SchemeSetu Running"
    }

@app.get("/health")
def health():
    return{
        "status": "OK"
    }