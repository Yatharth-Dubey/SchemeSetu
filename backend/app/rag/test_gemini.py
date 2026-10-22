from app.providers.gemini import GeminiGenerator

generator = GeminiGenerator()
answer = generator.generate(
    "Explain PMAY in One Sentence."
)
print(answer)