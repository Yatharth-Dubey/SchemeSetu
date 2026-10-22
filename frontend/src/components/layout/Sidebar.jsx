const Icon = {
  logo: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  ),
  chat: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinejoin="round" />
    </svg>
  ),
  doc: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinejoin="round" />
      <path d="M14 2v6h6" strokeLinejoin="round" />
    </svg>
  ),
}

export default function Sidebar({ open, onNavigate, onNewChat, documents = [] }) {
  return (
    <aside
      id="app-sidebar"
      className={`sidebar${open ? ' is-open' : ''}`}
      aria-label="Primary"
    >
      <div className="sidebar-header">
        <span className="sidebar-logo" aria-hidden="true">{Icon.logo}</span>
        <div>
          <div className="sidebar-title">SchemeSetu</div>
          <div className="sidebar-tagline">Government Schemes, Simplified by AI</div>
        </div>
      </div>

      <div className="sidebar-section">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => { onNewChat?.(); onNavigate?.(); }}
        >
          {Icon.plus}
          New chat
        </button>
      </div>

      <nav className="sidebar-section" aria-label="Conversation">
        <span className="sidebar-section-title">Chat</span>
        <div className="sidebar-nav">
          <button type="button" className="sidebar-link" aria-current="page">
            {Icon.chat}
            Current conversation
          </button>
        </div>
      </nav>

      <div className="sidebar-section">
        <span className="sidebar-section-title">Uploaded this session</span>
        {documents.length === 0 ? (
          <p className="sidebar-doc" style={{ opacity: 0.7 }}>
            No uploads yet.
          </p>
        ) : (
          <ul className="sidebar-docs">
            {documents.map((d, i) => (
              <li key={`${d.filename}-${i}`} className="sidebar-doc" title={d.filename}>
                {Icon.doc}
                <span>{d.filename}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sidebar-footer">
        Answers are grounded in uploaded documents. Always verify against the
        original scheme document.
      </div>
    </aside>
  )
}