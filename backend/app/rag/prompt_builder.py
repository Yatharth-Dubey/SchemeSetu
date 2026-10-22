from app.schemas.document import DocumentChunk


class PromptBuilder:
    """
    Builds prompts for the LLM using retrieved document chunks.
    """

    SYSTEM_PROMPT = """
You are SchemeSetu.

You are an AI assistant that answers questions about Indian Government Schemes.

Rules:

1. Answer ONLY using the provided context.

2. Never make up information.

3. If the answer is not present in the context, reply:

"I couldn't find that information in the uploaded documents."

4. Be concise and accurate.
"""

    def build(
        self,
        question: str,
        chunks: list[dict]
    ) -> str:

        context = "\n\n".join(

    f"""
Document: {chunk["filename"]}
Page: {chunk["page_number"]}

Content:
{chunk["text"]}
"""
            for chunk in chunks
        )

        return f"""
{self.SYSTEM_PROMPT}

=========================
Context
=========================

{context}

=========================
Question
=========================

{question}

=========================
Answer
=========================
"""