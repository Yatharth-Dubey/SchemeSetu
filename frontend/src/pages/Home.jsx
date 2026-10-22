import { useCallback, useRef, useState } from 'react'
import Workspace from '../components/workspace/Workspace'
import { sendChat } from '../services/api'

const PROMPTS = [
  'What are the eligibility criteria for PMAY?',
  'What documents are required to apply?',
  'What benefits does this scheme provide?',
]

let idCounter = 0
const nextId = () => `msg-${++idCounter}`

export default function Home({ themeToggle, onDocumentUploaded, documentsCount = 0 }) {
  const [messages, setMessages] = useState([])
  const [isSending, setIsSending] = useState(false)
  const workspaceRef = useRef(null)

  const runQuestion = useCallback(async (question, userMessageId) => {
    setIsSending(true)
    const assistantId = nextId()
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', pending: true, retryOf: userMessageId },
    ])
    try {
      const { answer, sources } = await sendChat({ question })
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, pending: false, text: answer, sources } : m))
      )
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, pending: false, error: { userMessage: err.userMessage || 'Something went wrong.', code: err.code } }
            : m
        )
      )
    } finally {
      setIsSending(false)
    }
  }, [])

  const handleSend = useCallback(
    (question) => {
      if (!question || isSending) return
      const userMessageId = nextId()
      setMessages((prev) => [...prev, { id: userMessageId, role: 'user', text: question }])
      runQuestion(question, userMessageId)
    },
    [isSending, runQuestion]
  )

  const handleRetry = useCallback(
    (assistantMessageId) => {
      if (isSending) return
      const assistant = messages.find((m) => m.id === assistantMessageId)
      const user = assistant?.retryOf ? messages.find((m) => m.id === assistant.retryOf) : null
      if (user) runQuestion(user.text, user.id)
    },
    [isSending, messages, runQuestion]
  )

  const handlePrompt = (prompt) => {
    workspaceRef.current?.focusComposerWithPrompt(prompt)
  }

  return (
    <main className="main-inner">
      <header className="page-header">
        <h1>SchemeSetu</h1>
        <span className="badge">AI document assistant</span>
        <span className="spacer" />
        {themeToggle}
      </header>

      {messages.length === 0 && documentsCount === 0 && (
        <section className="welcome" aria-labelledby="welcome-heading">
          <h2 id="welcome-heading">Government schemes, made easier.</h2>
          <p>
            Upload a scheme PDF to get started, then ask questions and get answers
            grounded in its content.
          </p>
          <div className="prompt-grid">
            {PROMPTS.map((p) => (
              <button key={p} type="button" className="prompt-card" onClick={() => handlePrompt(p)}>
                {p}
              </button>
            ))}
          </div>
        </section>
      )}

      <Workspace
        ref={workspaceRef}
        messages={messages}
        isSending={isSending}
        onSend={handleSend}
        onRetry={handleRetry}
        onDocumentUploaded={onDocumentUploaded}
        documentsCount={documentsCount}
      />
    </main>
  )
}