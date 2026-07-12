from sentence_transformers import SentenceTransformer

#Load once when server starts
model = SentenceTransformer("all-MiniLM-L6-v2")

def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Convert a list of text chunks into embeddings vectors.
    """
    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=True
    )
    return embeddings