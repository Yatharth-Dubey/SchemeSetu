from fastapi import FastAPI
from app.api.routes.chat import router
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.upload import (router as upload_router)
from app.api.routes.document import (router as docs_router)
from app.exceptions.custom import SchemeSetuException
from app.exceptions.handlers import (scheme_setu_exception_handler, generic_exception_handler)

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

app.include_router(router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(docs_router, prefix="/api")

app.add_exception_handler(SchemeSetuException, scheme_setu_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

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