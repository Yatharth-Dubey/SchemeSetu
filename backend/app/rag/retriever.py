from app.rag.vector_store import VectorStore

class Retriever:
    def __init__(self, user_id: str):
        self.vector_store = VectorStore(user_id=user_id)
    def retrieve(self, query: str, top_k: int = 5):
        return self.vector_store.search(
            query=query,
            top_k=top_k,
        )
