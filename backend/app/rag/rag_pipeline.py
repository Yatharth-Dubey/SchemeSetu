from app.rag.retriever import Retriever
from app.rag.prompt_builder import PromptBuilder
from app.providers.gemini import GeminiGenerator
from app.schemas.rag import RAGResponse, Source
from app.core.logger import logger

class RAGPipeline:
    """
        Complete Retrieveal-Augmented Generation pipeline.
    """
    def __init__(self):
        logger.info("Initializing RAG pipeline...")
        self.retriever = Retriever()
        self.prompt_builder = PromptBuilder()
        self.generator = GeminiGenerator()
        logger.info("RAG pipeline initialized successfully.")

    def answer(self, question: str,) -> RAGResponse:
        logger.info(f"Received question: {question}")

        #RETRIEVAL
        logger.info("Retrieving relevant chunks...")
        chunks = self.retriever.retrieve(question)
        logger.info(f"Retrieved {len(chunks)} chunks.")
        if not chunks:
            logger.warning("No relevant chunks found.")
            return RAGResponse(
                answer="I couldn't find any relevant information.",
                sources=[],
                retrieved_chunks=0
            )
        logger.debug(chunks)

        #PROMPT
        logger.info("Building prompt...")
        prompt = self.prompt_builder.build(question, [item["chunk"] for item in chunks])
        logger.debug(f"Prompt length: {len(prompt)} charactes")

        #LLM
        logger.info("Generating response using Gemini...")
        response = self.generator.generate(prompt)
        logger.info("Response generated successfully.")

        #SOURCES
        logger.info("Collecting source information...")
        sources = []
        seen = set()
        for item in chunks:
            chunk = item["chunk"]
            key = (
                chunk["filename"],
                chunk["page_number"]
            )
            if key not in seen:
                seen.add(key)
                sources.append(
                    Source(
                        filename=chunk["filename"],
                        page_number=chunk["page_number"]
                    )
                )
        logger.info(f"Collected {len(sources)} unique sources.")

        logger.info("Returning RAG response")
        return RAGResponse(
            answer=response,
            sources=sources,
            retrieved_chunks=len(chunks)
        )