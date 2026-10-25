from app.services import chat_service as chat_service_module
from app.services.chat_service import ChatService


def test_chat_service_uses_user_specific_pipeline(monkeypatch):
    class FakePipeline:
        def __init__(self, user_id):
            self.user_id = user_id

        def answer(self, question):
            return type(
                "FakeRAGResponse",
                (),
                {
                    "answer": "Test answer",
                    "sources": [],
                    "retrieved_chunks": 0,
                },
            )()

    monkeypatch.setattr(
        chat_service_module,
        "RAGPipeline",
        FakePipeline,
    )

    service = ChatService(user_id="pytest-user")
    response = service.chat("Who can apply for PMAY?")

    assert service.pipeline.user_id == "pytest-user"
    assert response.answer == "Test answer"