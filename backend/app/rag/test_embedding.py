from embedding import generate_embeddings
texts = [
    "PMAY eligibility",
    "Ayushman Bharat benefits"
]
embeddings = generate_embeddings(texts)
print(embeddings.shape)