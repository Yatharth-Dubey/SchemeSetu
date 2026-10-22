import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

function formatSources(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const s of raw) {
    if (!s || typeof s !== 'object') continue
    if (typeof s.filename !== 'string' || s.filename.trim() === '') continue
    out.push({
      filename: s.filename,
      page_number: typeof s.page_number === 'number' && Number.isFinite(s.page_number)
        ? s.page_number
        : null,
    })
  }
  return out
}

const ChatBox = forwardRef(function ChatBox(
  { messages, isSending, onSend, onRetry, disabled = false },
  ref
) {
  const [input, setInput] = useState('')
  const textareaRef = useRef(null)
  const bottomRef = useRef(null)

  useImperativeHandle(ref, () => ({
    setQuestion(text) {
      setInput(text)
      requestAnimationFrame(() => {
        const el = textareaRef.current
        if (!el) return
        el.focus()
        const len = text.length
        el.setSelectionRange(len, len)
      })
    },
  }), [])

  useEffect(() => {
    const el = bottomRef.current
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  function submit() {
    // if (disabled) return
    const q = input.trim()
    if (!q || isSending) return
    onSend(q)
    setInput('')
  }

  function onKeyDown(e) {
    if (e.key !== 'Enter') return
    if (e.nativeEvent?.isComposing) return
    if (e.shiftKey) return
    e.preventDefault()
    submit()
  }

  return (
    <section className="chat" aria-label="Chat">
      <div
        className="message-list"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {messages.length === 0 && (
          <div className="empty-state">
            {disabled
              ? 'Upload a scheme document first to start asking questions.'
              : 'Start by asking a question about an uploaded scheme document.'}
          </div>
        )}

        {messages.map((m) => {
          if (m.role === 'user') {
            return (
              <div key={m.id} className="message message-user">
                {m.text}
              </div>
            )
          }

          const sources = m.pending || m.error ? [] : formatSources(m.sources)

          return (
            <div key={m.id} className="message message-assistant">
              {m.error ? (
                <div className="alert alert-error" role="alert">
                  <div>
                    <div>{m.error.userMessage || 'Request failed.'}</div>
                    {m.error.code && (
                      <div className="error-code">{m.error.code}</div>
                    )}
                  </div>
                  {m.retryOf && (
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => onRetry(m.id)}
                      aria-label="Retry this question"
                    >
                      Retry
                    </button>
                  )}
                </div>
              ) : m.pending ? (
                <div className="loading-state" role="status" aria-live="polite">
                  <span className="sr-only">Generating answer…</span>
                  <span aria-hidden="true">Generating answer…</span>
                </div>
              ) : (
                <>
                  <div>{m.text || 'No answer returned.'}</div>
                  {sources.length > 0 && (
                    <div className="sources" aria-label="Sources">
                      <span className="sources-title">Sources</span>
                      {sources.map((s, i) => (
                        <span
                          className="source-card"
                          key={`${m.id}-src-${i}`}
                          title={s.filename}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <path
                              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                              strokeLinejoin="round"
                            />
                            <path d="M14 2v6h6" strokeLinejoin="round" />
                          </svg>
                          <strong>{s.filename}</strong>
                          {s.page_number != null && (
                            <span>· p. {s.page_number}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      <div className="composer">
        <label htmlFor="chat-input" className="sr-only">
          Ask a question about your uploaded scheme documents
        </label>
        <textarea
          id="chat-input"
          ref={textareaRef}
          className="textarea"
          placeholder="Ask about eligibility, required documents, benefits…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={3}
          disabled={isSending}
        />
        <div className="composer-row">
          <span className="composer-note">
            Answers are grounded in uploaded documents. Always verify against
            the original scheme document.
          </span>
          <button
            type="button"
            className="button button-primary"
            onClick={submit}
            disabled={isSending || input.trim() === ''}
            aria-label="Send question"
          >
            {isSending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </section>
  )
})

export default ChatBox