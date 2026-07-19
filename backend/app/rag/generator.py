class Generator:
    """
        Responsible for communicating with the LLM.
    """
    def generate(self, prompt: str) -> str:
        raise NotImplementedError(
            "LLM generator not implemented"
        )