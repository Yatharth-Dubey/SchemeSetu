from app.services.chat_service import ChatService

service = ChatService()
response = service.chat(
    "WHO CAN APPLY FOR PMAY?"
)

print()
print("Answer")
print(response.answer)
print()
print("Sources")

for source in response.sources:
    print(
        f"{source.filename} (Page {source.page_number})"
    )

print()
print("Retrieved Chunks:", response.retrieved_chunks)