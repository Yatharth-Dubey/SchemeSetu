from app.rag import retriever as retriever_module
from app.rag.retriever import Retriever


def test_retriever_uses_user_specific_vector_store(monkeypatch):
    class FakeVectorStore:
        def __init__(self, user_id):
            self.user_id = user_id

        def search(self, query, top_k=5):
            return [{"query": query, "top_k": top_k}]

    monkeypatch.setattr(
        retriever_module,
        "VectorStore",
        FakeVectorStore,
    )

    retriever = Retriever(user_id="pytest-user")
    results = retriever.retrieve("Who can apply for PMAY?")

    assert retriever.vector_store.user_id == "pytest-user"
    assert results == [
        {"query": "Who can apply for PMAY?", "top_k": 5}
    ]