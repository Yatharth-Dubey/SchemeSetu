from app.rag.rag_pipeline import RAGPipeline
from app.schemas.chat import ChatResponse
class ChatService:
    """
        Handles the application's chat workflow.
    """
    def __init__(self):
        self.pipeline = RAGPipeline()

    def chat(self, question: str)-> ChatResponse:
        rag_response = self.pipeline.answer(question)
        return ChatResponse(
            answer=rag_response.answer,
            sources=rag_response.sources,
            retrieved_chunks=rag_response.retrieved_chunks,
        )

# def get_reply(
#         message:str
# ):
#     return(
#         f"You Said: {message}"
#     )