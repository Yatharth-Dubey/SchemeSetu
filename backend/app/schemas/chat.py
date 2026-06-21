from pydantic import BaseModel
#chat request and response validation
class ChatRequest(  
    BaseModel
):
    message:str

class ChatResponse(
    BaseModel
):
    response:str