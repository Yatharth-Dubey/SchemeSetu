
from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.api import APIResponse
from app.services.chat_service import ChatService

router = APIRouter()


@router.post(
    "/chat",
    response_model=APIResponse[ChatResponse],
)
def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    service = ChatService(user_id=str(current_user.id))
    response = service.chat(request.question)

    return APIResponse(
        message="Answer generated successfully.",
        data=response,
    )
