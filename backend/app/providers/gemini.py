import time
from google import genai
from google.genai import types
from google.genai import errors
from app.core.settings import settings
from app.providers.base import BaseGenerator
from app.core.logger import logger
from app.exceptions.custom import LLMGenerationError

class GeminiGenerator(BaseGenerator):
    """Google Gemini implementation with bounded retries."""
    MAX_ATTEMPTS = 3
    INITIAL_RETRY_DELAY = 1.0
    MAX_RETRY_DELAY = 4.0
    def __init__(self):
        logger.info("Initializing GeminiGenerator...")
        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY,
            http_options=types.HttpOptions(
                timeout=15000,
                retry_options=types.HttpRetryOptions(
                    attempts=1,
                ),
            ),
        )
        logger.info(
            "GeminiGenerator initialized. Model: %s",
            settings.GEMINI_MODEL,
        )

    def generate(self, prompt: str) -> str:
        logger.info("Sending request to Gemini...")
        logger.debug("Prompt length: %s characters", len(prompt))

        start_time = time.perf_counter()

        for attempt in range(1, self.MAX_ATTEMPTS + 1):
            try:
                response = self.client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                )

                if not response.text:
                    logger.error("Gemini returned an empty response.")

                    raise LLMGenerationError(
                        message="The AI service returned an empty response. Please try again.",
                        status_code=502,
                        error_code="LLM_EMPTY_RESPONSE",
                    )

                elapsed = time.perf_counter() - start_time

                logger.info(
                    "Gemini request completed in %.2f seconds.",
                    elapsed,
                )
                logger.info("Gemini generation completed successfully.")

                logger.debug(
                    "Generated response length: %s characters",
                    len(response.text),
                )

                return response.text

            except LLMGenerationError:
                raise

            except errors.APIError as exc:
                status_code = getattr(exc, "code", None)
                logger.warning(
                    "Gemini API error | Status: %s | Attempt: %s",
                    status_code,
                    attempt,
                )
                # Retry only temporary availability and rate-limit errors.
                if status_code not in (429, 500, 502, 503, 504):
                    logger.error(
                        "Gemini API returned a non-retryable error. "
                        "Status: %s",
                        status_code,
                    )

                    raise LLMGenerationError(
                        message="The AI service could not process your request. Please try again later.",
                        status_code=502,
                        error_code="LLM_API_ERROR",
                    ) from exc

                if attempt == self.MAX_ATTEMPTS:
                    elapsed = time.perf_counter() - start_time

                    logger.error(
                        "Gemini request failed after %s attempts "
                        "(%.2f seconds). Status: %s",
                        attempt,
                        elapsed,
                        status_code,
                    )

                    if status_code == 429:
                        raise LLMGenerationError(
                            message="The AI service is receiving too many requests. Please wait a little and try again.",
                            status_code=429,
                            error_code="LLM_RATE_LIMITED",
                        ) from exc

                    raise LLMGenerationError(
                        message="The AI service is temporarily unavailable. Please try again shortly.",
                        status_code=503,
                        error_code="LLM_SERVICE_UNAVAILABLE",
                    ) from exc
                delay = min(
                    self.INITIAL_RETRY_DELAY * (2 ** (attempt - 1)),
                    self.MAX_RETRY_DELAY,
                )
                time.sleep(delay)

            except Exception as exc:
                elapsed = time.perf_counter() - start_time

                logger.exception(
                    "Unexpected Gemini failure after %.2f seconds.",
                    elapsed,
                )

                raise LLMGenerationError(
                    message="An unexpected error occurred while generating the answer. Please try again.",
                    status_code=500,
                    error_code="LLM_GENERATION_ERROR",
                ) from exc

        # Defensive fallback; normally the loop returns or raises.
        raise LLMGenerationError(
            message="The AI service is temporarily unavailable. Please try again shortly.",
            status_code=503,
            error_code="LLM_SERVICE_UNAVAILABLE",
        )