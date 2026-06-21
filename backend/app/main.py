from fastapi import FastAPI
from app.api.routes.chat import router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title = "SchemeSetu API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
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