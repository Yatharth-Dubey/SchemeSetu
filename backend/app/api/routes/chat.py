from fastapi import APIRouter
from app.schemas.chat import(
    ChatRequest,
    ChatResponse
)
from app.services.chat_service import(
    get_reply
)

router = APIRouter()

@router.post(
    "/chat",
    response_model=ChatResponse
)
def chat(
    request: ChatRequest
):
    result=get_reply(
        request.message
    )
    return{
        "response": result
    }