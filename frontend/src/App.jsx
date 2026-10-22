import { useCallback, useEffect, useRef, useState } from 'react'
import Home from './pages/Home'
import Sidebar from './components/layout/Sidebar'
import ThemeToggle from './components/layout/ThemeToggle'
import './App.css'

const THEME_KEY = 'schemesetu-theme'

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* ignore */ }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sessionDocuments, setSessionDocuments] = useState([])
  const toggleRef = useRef(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem(THEME_KEY, theme) } catch { /* ignore */ }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const handleDocumentUploaded = useCallback((doc) => {
    if (!doc?.filename) return
    setSessionDocuments((prev) => [...prev, { filename: doc.filename }])
  }, [])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
    toggleRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!sidebarOpen) return
    function onKey(e) { if (e.key === 'Escape') closeSidebar() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen, closeSidebar])

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onNavigate={closeSidebar}
        documents={sessionDocuments}
      />

      {sidebarOpen && (
        <div className="drawer-backdrop" onClick={closeSidebar} aria-hidden="true" />
      )}

      <div className="main-content">
        <header className="mobile-topbar">
          <button
            ref={toggleRef}
            type="button"
            className="button button-ghost button-icon"
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
            aria-controls="app-sidebar"
            onClick={() => setSidebarOpen(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <span className="sidebar-title">SchemeSetu</span>
          <span className="spacer" />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>

        <Home
          themeToggle={<ThemeToggle theme={theme} onToggle={toggleTheme} />}
          onDocumentUploaded={handleDocumentUploaded}
          documentsCount={sessionDocuments.length}
        />
      </div>
    </div>
  )
}