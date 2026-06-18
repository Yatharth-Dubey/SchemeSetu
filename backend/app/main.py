from fastapi import FastAPI
from app.api.routes.chat import router

app = FastAPI(
    title = "SchemeSetu API"
)

app.include_router(
    router,
    prefix="/api"
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