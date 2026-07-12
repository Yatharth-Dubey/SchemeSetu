import uuid

def generate_doucment_id():
    return f"doc_{uuid.uuid4().hex[:8]}" #example -> doc_a91bc672