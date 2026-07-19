from google import genai
from app.core.settings import settings
from app.providers.base import BaseGenerator
from app.core.logger import logger

class GeminiGenerator(BaseGenerator):
    """GOOGLE GEMINI IMPLEMENTATION."""

    def __init__(self):
        logger.info("Initializing GeminiGenerator...")
        self.client = genai.Client(
            api_key = settings.GEMINI_API_KEY
        )
        logger.info(f"GeminiGenerator initialized. Model: {settings.GEMINI_MODEL}")
    
    def generate(self, prompt: str) -> str:
        logger.info("Sending request to Gemini...")
        logger.debug(f"Prompt length: {len(prompt)} characters")
        try:
            response = self.client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
            )
            logger.info("Received response from Gemini.")

            if not response.text:
                logger.error("Gemini returned an empty response.")
                raise RuntimeError("Gemini returned an empty response.")
            logger.debug(f"Generated response length: {len(response.text)} characters")
            logger.info("Gemini generation completed successfully.")
            return response.text
        
        except Exception as e:
            logger.exception("Gemini generation failed.")
            raise RuntimeError(f"Gemini generation failed:{e}")