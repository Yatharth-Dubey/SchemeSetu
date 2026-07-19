class SchemeSetuException(Exception):
    """
    Base exception for the application.
    """
    def __init__(
        self,
        message: str,
        status_code: int = 400,
        error_code: str = "APPLICATION_ERROR",
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code

        super().__init__(message)

class DocumentProcessingError(SchemeSetuException):
    def __init__(self, message="Document processing failed"):
        super().__init__(
            message=message,
            status_code=500,
            error_code="DOCUMENT_PROCESSING_ERROR",
        )

class VectorStoreError(SchemeSetuException):
    def __init__(self, message="VECTOR_STORE_ERROR"):
        super().__init__(
            message=message,
            status_code=500,
            error_code="VECTOR_STORE_ERROR",
        )

class LLMGenerationError(SchemeSetuException):
    def __init__(self, message="LLM generation failed"):
        super().__init__(
            message=message,
            status_code=500,
            error_code="LLM_GENERATION_ERROR",
        )