from app.rag.prompt_builder import PromptBuilder

builder = PromptBuilder()
chunks = [
    {
        "filename": "pmay.pdf",
        "page_number": 3,
        "text": "PMAY provides financial assistance for construction of houses."
    }
]
prompt = builder.build(
    "What is PMAY?",
    chunks
)
print(prompt)