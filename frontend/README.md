# SchemeSetu — Frontend

An AI assistant for Indian government scheme documents. Ask questions about
uploaded PDFs; get answers grounded in their content, with source citations.

> **Status:** This is the frontend for SchemeSetu. The backend (FastAPI + RAG +
> FAISS + Gemini) is a separate service that must be running for chat and
> upload to work.

## Stack

- React 19 (functional components, hooks)
- Vite 8
- JavaScript / JSX (no TypeScript)
- Plain CSS with a centralized design system (no CSS framework)

No UI library, no icon library, no router, no state manager, no Markdown
renderer. Every dependency is in `package.json`; nothing is added at runtime.

## Quick start

```bash
cd frontend
npm install
cp .env.example .env       # on Windows: copy .env.example .env
# edit .env if your backend isn't on http://127.0.0.1:8000
npm run dev