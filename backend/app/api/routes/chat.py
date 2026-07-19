from fastapi import APIRouter
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService
from app.schemas.api import APIResponse

router = APIRouter()
service = ChatService()

@router.post(
    "/chat",
    response_model=APIResponse[ChatResponse]
)
def chat(request: ChatRequest):
    response = service.chat(request.question)
    return APIResponse(
        message="Answer generated successfully.",
        data=response
    )