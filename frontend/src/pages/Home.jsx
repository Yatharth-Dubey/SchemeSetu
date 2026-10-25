import { useCallback, useEffect, useRef, useState } from 'react'
import Workspace from '../components/workspace/Workspace'
import HistoryTimeline from '../components/history/HistoryTimeline'
import { sendChat, getQAHistory } from '../services/api' // getLatestQA ki zaroorat nahi hai ab

const PROMPTS = [
  'What are the eligibility criteria for PMAY?',
  'What documents are required to apply?',
  'What benefits does this scheme provide?',
]

let idCounter = 0
const nextId = () => `msg-${++idCounter}`

export default function Home({
  themeToggle,
  onDocumentUploaded,
  documents = [],
  isAuthenticated = false,
}) {
  const [messages, setMessages] = useState([])
  const [isSending, setIsSending] = useState(false)
  
  const [history, setHistory] = useState([])
  const [historyHasMore, setHistoryHasMore] = useState(false)
  const [historyCursor, setHistoryCursor] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  
  const workspaceRef = useRef(null)

  // --- 1. INITIAL LOAD (Refresh / Login) ---
  useEffect(() => {
    if (!isAuthenticated) {
      setHistory([])
      setMessages([])
      setHistoryCursor(null)
      setHistoryHasMore(false)
      return
    }

    let cancelled = false
    async function restore() {
      try {
        // Hum SIRF 2 records maang rahe hain
        // 1 latest chat neeche current banegi, aur 1 purani chat upar history mein dikhegi.
        const page = await getQAHistory({ limit: 2 })
        
        if (cancelled) return

        if (page.items.length > 0) {
          // Sabse latest Q&A ko 'current chat' banao (jo sabse aakhri mein hai array ke)
          const latest = page.items[page.items.length - 1]
          
          setMessages([
            { id: nextId(), role: 'user', text: latest.question },
            { id: nextId(), role: 'assistant', text: latest.answer, sources: latest.sources, pending: false }
          ])

          // Baaki bachi hui 1 history ko timeline ke liye set karo
          const olderHistory = page.items.slice(0, -1)
          setHistory(olderHistory)
          
          // IMPORTANT: Cursor update karo. 
          // Agar humne 2 maange aur 2 aaye, toh has_more true hoga.
          // Lekin agar sirf 1 hi aaya, toh has_more false hoga (kyunki aur record nahi hain).
          setHistoryCursor(page.next_cursor)
          setHistoryHasMore(page.has_more)
        } else {
          setMessages([])
          setHistory([])
          setHistoryHasMore(false)
        }
      } catch (err) {
        console.error("Restore failed:", err)
      }
    }
    restore()
    return () => { cancelled = true }
  }, [isAuthenticated])

  // --- 2. LOAD MORE (Agli 5 purani chats laane ke liye) ---
  const loadMoreHistory = useCallback(async () => {
    if (!historyHasMore || historyLoading || !historyCursor) return
    setHistoryLoading(true)
    try {
      // Yahan hum exactly 5 records maang rahe hain
      const page = await getQAHistory({ limit: 5, before: historyCursor })
      
      setHistory((prev) => {
        const seen = new Set(prev.map((x) => x.id))
        const older = page.items.filter((x) => !seen.has(x.id))
        return [...older, ...prev] // Naye purane records upar prepend honge
      })
      
      setHistoryCursor(page.next_cursor)
      setHistoryHasMore(page.has_more)
    } catch (err) {
      console.error("Load more failed:", err)
    } finally {
      setHistoryLoading(false)
    }
  }, [historyHasMore, historyLoading, historyCursor])

  // --- 3. NEW CHAT ---
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
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, pending: false, text: answer, sources }
            : m
        )
      )
      // Current chat history mein NAHI jayegi jab tak refresh na ho.
      
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                pending: false,
                error: {
                  userMessage: err.userMessage || 'Something went wrong.',
                  code: err.code,
                },
              }
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
      setMessages((prev) => [
        ...prev,
        { id: userMessageId, role: 'user', text: question },
      ])
      runQuestion(question, userMessageId)
    },
    [isSending, runQuestion]
  )

  const handleRetry = useCallback(
    (assistantMessageId) => {
      if (isSending) return
      const assistant = messages.find((m) => m.id === assistantMessageId)
      const user = assistant?.retryOf
        ? messages.find((m) => m.id === assistant.retryOf)
        : null
      if (user) runQuestion(user.text, user.id)
    },
    [isSending, messages, runQuestion]
  )

  const handlePrompt = (prompt) => {
    workspaceRef.current?.focusComposerWithPrompt(prompt)
  }

  const completedCount = documents.filter((d) => d.status === 'completed').length
  const showWelcome = messages.length === 0 && completedCount === 0 && history.length === 0

  return (
    <main className="main-inner">
      <header className="page-header">
        <h1>SchemeSetu</h1>
        <span className="badge">AI document assistant</span>
        <span className="spacer" />
        {themeToggle}
      </header>

      {showWelcome && (
        <section className="welcome" aria-labelledby="welcome-heading">
          <h2 id="welcome-heading">Government schemes, made easier.</h2>
          <p>
            Upload a scheme PDF to get started, then ask questions and get
            answers grounded in its content.
          </p>
          <div className="prompt-grid">
            {PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                className="prompt-card"
                onClick={() => handlePrompt(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* History Timeline (jo load hote hi sirf 1 chat dikhayega) */}
      <HistoryTimeline
        history={history}
        hasMore={historyHasMore}
        loading={historyLoading}
        onLoadMore={loadMoreHistory}
      />

      {/* Current Chat (neeche) */}
      <Workspace
        ref={workspaceRef}
        messages={messages}
        isSending={isSending}
        onSend={handleSend}
        onRetry={handleRetry}
        onDocumentUploaded={onDocumentUploaded}
        documents={documents}
      />
    </main>
  )
}