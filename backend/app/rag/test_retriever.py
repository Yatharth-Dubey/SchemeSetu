from app.rag.retriever import Retriever
retriever = Retriever()
results = retriever.retrieve(
    "Who can apply for PMAY?"
)
print(results)