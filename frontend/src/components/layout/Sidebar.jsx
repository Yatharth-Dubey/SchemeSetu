import { useState, useEffect, useRef } from 'react';

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
  dots: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Sidebar({ open, onNavigate, onNewChat, documents = [], onLogout, userEmail = 'User' }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          <p className="sidebar-doc" style={{ opacity: 0.7 }}>No uploads yet.</p>
        ) : (
          <ul className="sidebar-docs">
            {documents.map((d, i) => {
              // Remove backend prefix (e.g., doc_8eea198e_)
              const cleanName = d.filename.replace(/^doc_[a-zA-Z0-9]+_/, '');
              return (
                <li key={`${d.document_id || d.filename}-${i}`} className="sidebar-doc" title={d.filename}>
                  {Icon.doc}
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cleanName}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="sidebar-footer" style={{ position: 'relative' }}>
        <p style={{ marginBottom: 'var(--space-3)' }}>Answers are grounded in uploaded documents.</p>
        
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button 
            type="button" 
            className="button button-ghost" 
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ width: '100%', justifyContent: 'space-between', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', overflow: 'hidden' }}>
              <div style={{ width: '24px', height: '24px', flexShrink: 0, borderRadius: '50%', background: 'var(--color-accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </span>
            </div>
            {Icon.dots}
          </button>

          {menuOpen && (
            <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 'var(--space-2)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', overflow: 'hidden', zIndex: 10 }}>
              <button 
                type="button" 
                className="button button-ghost" 
                onClick={() => { setMenuOpen(false); onLogout(); }}
                style={{ width: '100%', justifyContent: 'flex-start', padding: 'var(--space-3)', borderRadius: 0, color: 'var(--color-error)' }}
              >
                {Icon.logout} Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}