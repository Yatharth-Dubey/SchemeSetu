import { useCallback, useEffect, useRef, useState } from 'react'
import Home from './pages/Home'
import Sidebar from './components/layout/Sidebar'
import ThemeToggle from './components/layout/ThemeToggle'
import AuthScreen from './components/auth/AuthScreen'
import LandingPage from './components/landing/LandingPage'
import { getProcessedDocuments, getCurrentUser, tokenStore, setUnauthorizedHandler } from './services/api'
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
  const toggleRef = useRef(null)

  // Auth & User State
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const authenticatedRef = useRef(false)

  // Landing Page State
  const [showAuthScreen, setShowAuthScreen] = useState(false)

  // Document State
  const [documents, setDocuments] = useState([])
  const [isFetchingDocs, setIsFetchingDocs] = useState(false)
  const pollingRef = useRef(null)

  const handleLogout = useCallback(() => {
    authenticatedRef.current = false
    tokenStore.clear()
    setIsAuthenticated(false)
    setUserEmail('')
    setDocuments([])
    setShowAuthScreen(false) // Logout par wapas landing page par bhejo
    if (pollingRef.current) clearInterval(pollingRef.current)
  }, [])

  const completeAuth = useCallback((email) => {
    authenticatedRef.current = true
    setUserEmail(email)
    setIsAuthenticated(true)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      handleLogout()
    })
  }, [handleLogout])

  useEffect(() => {
    async function checkAuth() {
      const token = tokenStore.get()
      if (!token) {
        setIsInitializing(false)
        return
      }
      try {
        const user = await getCurrentUser()
        completeAuth(user.email)
      } catch {
        handleLogout()
      } finally {
        setIsInitializing(false)
      }
    }
    checkAuth()
  }, [handleLogout, completeAuth])

  const fetchDocuments = useCallback(async (isPolling = false) => {
    if (!isAuthenticated) return
    if (isFetchingDocs && isPolling) return
    try {
      if (!isPolling) setIsFetchingDocs(true)
      const docs = await getProcessedDocuments()
      setDocuments(docs)
    } catch (err) {
      if (err.status !== 401) console.warn('Doc fetch failed:', err.userMessage)
    } finally {
      if (!isPolling) setIsFetchingDocs(false)
    }
  }, [isAuthenticated, isFetchingDocs])

  useEffect(() => {
    if (isAuthenticated) fetchDocuments()
  }, [isAuthenticated]) // eslint-disable-line

  useEffect(() => {
    if (!isAuthenticated) return
    const hasActiveDocs = documents.some(
      (doc) => doc.status === 'uploaded' || doc.status === 'processing'
    )
    if (hasActiveDocs) {
      pollingRef.current = setInterval(() => fetchDocuments(true), 2500)
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [documents, isAuthenticated, fetchDocuments])

  const handleDocumentUploaded = useCallback((newDoc) => {
    if (!newDoc?.document_id) return
    setDocuments((prev) => {
      const existing = prev.findIndex((d) => d.document_id === newDoc.document_id)
      if (existing !== -1) {
        const updated = [...prev]
        updated[existing] = { ...updated[existing], ...newDoc }
        return updated
      }
      return [newDoc, ...prev]
    })
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem(THEME_KEY, theme) } catch { /* ignore */ }
  }, [theme])

  // Browser tab title follows the current view
  useEffect(() => {
    if (isInitializing) return
    if (isAuthenticated) document.title = 'SchemeSetu | Your documents'
    else if (showAuthScreen) document.title = 'Log in | SchemeSetu'
    else document.title = 'SchemeSetu | Government schemes, simplified by AI'
  }, [isAuthenticated, showAuthScreen, isInitializing])

  // Start every view at the top (landing -> auth -> app)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [isAuthenticated, showAuthScreen])

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
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

  if (isInitializing) {
    return (
      <div className="app-shell app-loading" role="status" aria-live="polite">
        <span className="spinner spinner-lg" aria-hidden="true" />
        <span>Loading SchemeSetu…</span>
      </div>
    )
  }

  // 1. Agar logged in nahi hai aur AuthScreen nahi dikha rahe -> Landing Page
  if (!isAuthenticated && !showAuthScreen) {
    return (
      <div className="view-fade">
        <LandingPage onGetStarted={() => setShowAuthScreen(true)} />
      </div>
    )
  }

  // 2. Agar logged in nahi hai aur Get Started click hua -> Auth Screen
  if (!isAuthenticated) {
    return (
      <div className="view-fade">
        <AuthScreen
          onAuthSuccess={(email) => completeAuth(email)}
          onBack={() => setShowAuthScreen(false)}
        />
      </div>
    )
  }

  // 3. Agar logged in hai -> Main App
  return (
    <div className="app-shell view-fade">
      <Sidebar
        open={sidebarOpen}
        onNavigate={closeSidebar}
        documents={documents}
        onLogout={handleLogout}
        userEmail={userEmail}
      />

      {sidebarOpen && <div className="drawer-backdrop" onClick={closeSidebar} aria-hidden="true" />}

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
          documents={documents}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  )
}