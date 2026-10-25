import logging
from app.rag.rag_pipeline import RAGPipeline
from app.schemas.chat import ChatResponse
from app.core.database import SessionLocal
from app.models.qa_history import QAHistory

logger = logging.getLogger("SchemeSetu")

class ChatService:
    """Handles the application's chat workflow."""

    def __init__(self, user_id: str):
        self.user_id = int(user_id)
        self.pipeline = RAGPipeline(user_id=user_id)

    def chat(self, question: str) -> ChatResponse:
        rag_response = self.pipeline.answer(question)

        response = ChatResponse(
            answer=rag_response.answer,
            sources=rag_response.sources,
            retrieved_chunks=rag_response.retrieved_chunks,
        )

        # --- DATABASE MEIN SAVE KARNE KA CODE ---
        db = SessionLocal()
        try:
            new_qa = QAHistory(
                user_id=self.user_id,
                question=question,
                answer=response.answer,
                sources=[s.model_dump() for s in response.sources],
            )
            db.add(new_qa)
            db.commit()
            logger.info(f"Successfully saved Q&A history for user {self.user_id}")
        except Exception as e:
            db.rollback()
            logger.error(f"FAILED TO SAVE Q&A HISTORY: {str(e)}")
        finally:
            db.close()
        # ----------------------------------------

        return response