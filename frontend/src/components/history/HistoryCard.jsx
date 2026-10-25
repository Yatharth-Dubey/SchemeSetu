function formatTimestamp(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''

  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()

  const time = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (sameDay) return `Today · ${time}`
  if (isYesterday) return `Yesterday · ${time}`
  return (
    d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) +
    ' · ' +
    time
  )
}

function formatSources(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const s of raw) {
    if (!s || typeof s !== 'object') continue
    if (typeof s.filename !== 'string' || s.filename.trim() === '') continue
    out.push({
      filename: s.filename,
      page_number:
        typeof s.page_number === 'number' && Number.isFinite(s.page_number)
          ? s.page_number
          : null,
    })
  }
  return out
}

export default function HistoryCard({ item }) {
  const sources = formatSources(item.sources)
  return (
    <article className="history-card card">
      <header className="history-card-header">
        <span className="badge">{formatTimestamp(item.created_at)}</span>
      </header>

      <div className="history-q">
        <span className="history-label">Question</span>
        <p>{item.question}</p>
      </div>

      <div className="history-a">
        <span className="history-label">Answer</span>
        <p>{item.answer}</p>
      </div>

      {sources.length > 0 && (
        <div className="history-sources">
          <span className="history-label">Sources</span>
          <div className="sources">
            {sources.map((s, i) => (
              <span
                className="source-card"
                key={`${item.id}-src-${i}`}
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
                {s.page_number != null && <span>· p. {s.page_number}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}