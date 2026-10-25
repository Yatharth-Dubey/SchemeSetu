import { useState, useEffect, useRef, useCallback } from 'react'

import previewUpload from '../../assets/screenshots/preview-uploadbase.png'
import previewChat from '../../assets/screenshots/preview-chat.png'
import previewHistory from '../../assets/screenshots/preview-history.png'
import previewLoadMore from '../../assets/screenshots/preview-loadmore.png'

// --- SVG ICONS (ChatBox ke style se consistent) ---
const svgProps = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
const Icons = {
  chat: <svg {...svgProps}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  doc: <svg {...svgProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8"/></svg>,
  shield: <svg {...svgProps}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  history: <svg {...svgProps}><path d="M3 3v5h5 M3.05 13A9 9 0 1 0 6 5.3L3 8 M12 7v5l4 2"/></svg>,
  upload: <svg {...svgProps}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12"/></svg>,
  list: <svg {...svgProps}><path d="M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01"/></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  chevron: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>,
  arrowUp: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5 M5 12l7-7 7 7"/></svg>,
  play: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z"/></svg>,
  pause: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6z M14 4h4v16h-4z"/></svg>,
  github: <svg {...svgProps}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>,
  linkedin: <svg {...svgProps}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg>,
  link: <svg {...svgProps}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  sun: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" /></svg>,
  moon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" strokeLinejoin="round" /></svg>,
}

// --- NEW: Concentric Rings Component ---
const ConcentricRings = ({ size, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 800 800" 
    fill="none" 
    className={`rings ${className}`}
  >
    <circle cx="400" cy="400" r="380" stroke="currentColor" strokeWidth="1" strokeOpacity="0.1" />
    <circle cx="400" cy="400" r="300" stroke="currentColor" strokeWidth="1" strokeOpacity="0.15" />
    <circle cx="400" cy="400" r="220" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
    <circle cx="400" cy="400" r="140" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
    <circle cx="400" cy="400" r="60" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
  </svg>
)

// ============================================================
// CONTENT (edit karna ho to yahin se karo)
// ============================================================

const ASK_WORDS = ['eligibility', 'benefits', 'documents required', 'last dates', 'how to apply']

const TOUR = [
  {
    id: 'upload',
    icon: Icons.upload,
    label: 'Upload',
    title: '1. Upload your scheme PDF',
    desc: 'Click the Upload button and pick a scheme PDF, or drag it into the upload box.',
    bullets: [
      'Only PDFs of government schemes are needed',
      'Status updates live: uploaded, processing, ready',
      'Your file appears in the sidebar once it is ready',
    ],
    image: previewUpload,
    alt: 'SchemeSetu upload screen with the Upload button highlighted',
    hotspot: { x: 31, y: 58, w: 55, h: 40 },
    tag: 'Click Upload to add your PDF',
    tagPos: 'above',
    tagAlign: 'right',
  },
  {
    id: 'ask',
    icon: Icons.chat,
    label: 'Ask',
    title: '2. Ask in plain English',
    desc: 'Type your question in the chat box, just like you would ask a friend.',
    bullets: [
      'Ask about eligibility, benefits or documents',
      'No special keywords or forms',
      'Ask follow-up questions anytime',
    ],
    image: previewChat,
    alt: 'SchemeSetu chat box with a question being asked',
    hotspot: { x: 31, y: 53, w: 55, h: 30 },
    tag: 'Type your question here',
    tagPos: 'above',
    tagAlign: 'left',
  },
  {
    id: 'history',
    icon: Icons.history,
    label: 'History',
    title: '3. Find old answers in History',
    desc: 'Every question and answer is saved on a timeline, so you never have to ask twice.',
    bullets: [
      'Newest questions appear first',
      'Each answer keeps its page citations',
      'Collapse the box when you need more room',
    ],
    image: previewHistory,
    alt: 'SchemeSetu history timeline with past questions',
    hotspot: { x: 30.5, y: 10, w: 55, h: 58 },
    tag: 'Your past questions live here',
    tagPos: 'below',
    tagAlign: 'left',
  },
  {
    id: 'more',
    icon: Icons.list,
    label: 'Load more',
    title: '4. Load more when you need it',
    desc: 'History loads a few items at a time. Press Load more to go further back.',
    bullets: [
      'Keeps the page fast and tidy',
      'Older answers load without a refresh',
      'Scroll inside the box, the page stays put',
    ],
    image: previewLoadMore,
    alt: 'SchemeSetu history with the Load more button highlighted',
    hotspot: { x: 70.5, y: 12, w: 15, h: 12 },
    tag: 'Press Load more for older answers',
    tagPos: 'above',
    tagAlign: 'left',
  },
]

const STEPS = [
  {
    n: 1,
    icon: Icons.upload,
    title: 'Upload PDF',
    desc: (
      <>
        Pick any government scheme <mark className="hl">PDF</mark> from your device. SchemeSetu reads it page by page and
        builds a private <mark className="hl">searchable index</mark>.
      </>
    ),
    points: ['Progress shows live as the file is processed', 'Your file is linked only to your account'],
    exampleLabel: 'Example file',
    example: 'scheme-guidelines.pdf',
  },
  {
    n: 2,
    icon: Icons.chat,
    title: 'Ask questions',
    desc: (
      <>
        Write what you want to know in <mark className="hl">plain English</mark>. Ask about{' '}
        <mark className="hl">eligibility</mark>, benefits or the documents you need.
      </>
    ),
    points: ['Short or detailed questions both work', 'Ask follow-ups to dig deeper'],
    exampleLabel: 'Example question',
    example: 'Who is eligible, and which documents do I need to apply?',
  },
  {
    n: 3,
    icon: Icons.doc,
    title: 'Get answers',
    desc: (
      <>
        Receive a clear answer taken <mark className="hl">only from your PDF</mark>, with the{' '}
        <mark className="hl">page number</mark> beside it so you can check it yourself.
      </>
    ),
    points: ['Open the cited page to confirm the details', 'Answers are saved in your History'],
    exampleLabel: 'Example source',
    example: (
      <span className="chip-source">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
        scheme-guidelines.pdf, page 4
      </span>
    ),
  },
]

const FEATURES = [
  { icon: Icons.doc, title: 'Document Grounded', text: 'Answers are generated only from your uploaded PDFs, preventing AI hallucinations.' },
  { icon: Icons.history, title: 'Page Citations', text: 'Every answer includes the exact filename and page number so you can verify instantly.' },
  { icon: Icons.shield, title: 'Private & Secure', text: 'Your documents are processed securely and scoped only to your account. No cross-user data leaks.' },
  { icon: Icons.chat, title: 'Conversation History', text: 'Access your past questions and answers anytime with our persistent timeline.' },
]

const FAQ = [
  { q: 'Which documents can I upload?', a: 'Upload government scheme documents in PDF format. Text-based PDFs work best, because SchemeSetu reads the text on each page.' },
  { q: 'How do I know an answer is correct?', a: 'Every answer shows the file name and page number it came from. Open that page in your PDF and check it yourself.' },
  { q: 'Can other users see my documents?', a: 'No. Your documents and your history are tied to your account only.' },
  { q: 'What if the PDF does not have the answer?', a: 'SchemeSetu answers only from your document. If the information is not there, it will tell you instead of guessing.' },
]

const DEV = {
  name: 'Yatharth Dubey',
  initials: 'YD',
  role: 'Full-Stack Developer',
  status: 'Open to collaborate',
  bio: 'I build AI-powered products with clean, fast interfaces. SchemeSetu started from a simple question: why is it so hard to read a government scheme PDF?',
  stack: ['React', 'JavaScript', 'AI / RAG', 'REST APIs', 'FAST APIs', 'UI Design'],
  facts: [
    { title: 'Why I built it', text: 'To make scheme details easy to find.' },
    { title: 'What it focuses on', text: 'Verified answers with page citations.' },
    { title: 'What is next', text: 'More documents and more languages.' },
  ],
  links: [
    { label: 'Portfolio', href: 'https://yatharthdubey.vercel.app/', icon: Icons.link },
    { label: 'GitHub', href: 'https://github.com/Yatharth-Dubey', icon: Icons.github },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/yatharth-dubey-34a532316', icon: Icons.linkedin },
  ],
}

// ============================================================
// HOOKS
// ============================================================

function useScrollReveal(threshold = 0.1) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return [ref, isVisible]
}

// ============================================================
// COMPONENT
// ============================================================

export default function LandingPage({ onGetStarted }) {
  const [theme, setTheme] = useState('light')
  const [heroRef, heroVisible] = useScrollReveal()
  const [featuresRef, featuresVisible] = useScrollReveal()
  const [tourRef, tourVisible] = useScrollReveal(0.15)
  const [howRef, howVisible] = useScrollReveal(0.2)
  const [devRef, devVisible] = useScrollReveal()
  const [faqRef, faqVisible] = useScrollReveal()
  const [ctaRef, ctaVisible] = useScrollReveal()

  const [progress, setProgress] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [showTop, setShowTop] = useState(false)
  const [wordIdx, setWordIdx] = useState(0)
  const [activeTour, setActiveTour] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const currentTheme = document.documentElement.dataset.theme || 'light'
    setTheme(currentTheme)
  }, [])

  useEffect(() => {
    let ticking = false
    function update() {
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(y / max, 1) : 0)
      setScrolled(y > 10)
      setShowTop(y > 600)
      ticking = false
    }
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setWordIdx((i) => (i + 1) % ASK_WORDS.length), 2200)
    return () => clearInterval(id)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = newTheme
    setTheme(newTheme)
  }

  const goNextTour = useCallback(() => setActiveTour((i) => (i + 1) % TOUR.length), [])
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const tour = TOUR[activeTour]
  const tourPaused = hovering || !autoplay
  const hs = tour.hotspot

  return (
    <div className="landing-wrapper">
      
      {/* --- NEW: Concentric Rings Background --- */}
      <div className="landing-bg-rings" aria-hidden="true">
        <ConcentricRings size={900} className="rings-1" />
        <ConcentricRings size={600} className="rings-2" />
      </div>

      <div className="scroll-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />

      {/* Navbar */}
      <nav className={`landing-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="landing-logo">
          <span className="sidebar-logo" style={{ width: 32, height: 32 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>SchemeSetu</span>
        </div>
        <div className="landing-nav-links">
          <div className="nav-anchors">
            <a href="#tour" className="nav-anchor">Product tour</a>
            <a href="#how-it-works" className="nav-anchor">How it works</a>
            <a href="#developer" className="nav-anchor">Developer</a>
            <a href="#faq" className="nav-anchor">FAQ</a>
          </div>
          
          {/* Premium SVG Theme Toggle */}
          <button 
            type="button" 
            className="button button-ghost button-icon" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? Icons.sun : Icons.moon}
          </button>

          <button className="button button-secondary" onClick={onGetStarted}>
            Log in
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className={`landing-hero ${heroVisible ? 'is-visible' : ''}`} ref={heroRef}>
        <div className="hero-content">
          <span className="badge" style={{ marginBottom: 'var(--space-4)' }}>AI-Powered Document Assistant</span>
          <h1 className="hero-title">
            Government Schemes, <br />
            <span style={{ color: 'var(--color-accent)' }}>Simplified by AI.</span>
          </h1>
          <p className="hero-subtitle">
            Stop digging through confusing PDFs. Upload a scheme document and ask questions. Get instant, accurate answers with exact page citations.
          </p>
          <div className="hero-ask" aria-live="polite">
            <span>Ask about</span>
            <span className="hero-ask-word" key={wordIdx}>{ASK_WORDS[wordIdx]}</span>
            <span className="hero-ask-caret" aria-hidden="true" />
          </div>
          <div className="hero-actions">
            <button className="button button-primary" style={{ padding: '0 var(--space-8)', height: '48px', fontSize: 'var(--text-lg)' }} onClick={onGetStarted}>
              Get Started for Free
            </button>
            <a href="#tour" className="button button-ghost" style={{ height: '48px' }}>
              See it in action ↓
            </a>
          </div>
          <div className="hero-trust">
            <span>{Icons.check} Grounded in your PDF</span>
            <span>{Icons.check} Page citations</span>
            <span>{Icons.check} Private to your account</span>
          </div>
        </div>

        {/* Screenshot Preview (Real image) */}
        <div className="hero-preview">
          <div className="float-chip chip-a">{Icons.check} Page 4 cited</div>
          <div className="float-chip chip-b">{Icons.doc} PDF indexed</div>
          <div className="preview-window">
            <div className="preview-header">
              <span className="preview-dot" style={{ background: '#ef4444' }}></span>
              <span className="preview-dot" style={{ background: '#f59e0b' }}></span>
              <span className="preview-dot" style={{ background: '#22c55e' }}></span>
              <span className="preview-url">schemesetu</span>
            </div>
            <div className="preview-body" style={{ padding: 0 }}>
              <img src={previewChat} alt="SchemeSetu Chat Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className={`landing-features ${featuresVisible ? 'is-visible' : ''}`} ref={featuresRef}>
        <div className="section-header">
          <h2>Why use SchemeSetu?</h2>
          <p>Built for speed, accuracy, and privacy.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div className="card feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Product Tour: screenshots with highlights */}
      <section className={`landing-tour ${tourVisible ? 'is-visible' : ''}`} id="tour" ref={tourRef}>
        <div className="section-header">
          <h2>See it in action</h2>
          <p>A quick look at the app, one screen at a time.</p>
        </div>

        <div
          className="tour"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onFocus={() => setHovering(true)}
          onBlur={() => setHovering(false)}
        >
          <div>
            <div className="tour-tabs" role="tablist" aria-label="Product tour steps">
              {TOUR.map((item, i) => {
                const isActive = i === activeTour
                return (
                  <div
                    key={item.id}
                    className={`tour-tab ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveTour(i)}
                  >
                    <button
                      type="button"
                      role="tab"
                      id={`tour-tab-${item.id}`}
                      aria-selected={isActive}
                      aria-controls="tour-panel"
                      className="tour-tab-head"
                    >
                      <span className="tour-tab-icon">{item.icon}</span>
                      <span className="tour-tab-title">{item.title}</span>
                    </button>
                    <div className="tour-tab-body">
                      <div>
                        <p className="tour-tab-desc">{item.desc}</p>
                        <ul className="tour-bullets">
                          {item.bullets.map((b) => (
                            <li key={b}>{Icons.check}<span>{b}</span></li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {isActive && (
                      <span className="tour-progress" aria-hidden="true">
                        <span
                          className={`tour-progress-bar ${tourVisible && autoplay ? 'is-running' : ''} ${tourPaused ? 'is-paused' : ''}`}
                          onAnimationEnd={goNextTour}
                        />
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="tour-controls">
              <span>{autoplay ? 'Auto-playing. Hover to pause.' : 'Auto-play is off.'}</span>
              <button type="button" className="button button-ghost" onClick={() => setAutoplay((a) => !a)} style={{ gap: 6 }}>
                {autoplay ? Icons.pause : Icons.play}
                {autoplay ? 'Pause' : 'Play'}
              </button>
            </div>
          </div>

          <div className="tour-stage" id="tour-panel" role="tabpanel" aria-labelledby={`tour-tab-${tour.id}`}>
            <div className="stage-window">
              <div className="preview-header">
                <span className="preview-dot" style={{ background: '#ef4444' }}></span>
                <span className="preview-dot" style={{ background: '#f59e0b' }}></span>
                <span className="preview-dot" style={{ background: '#22c55e' }}></span>
                <span className="preview-url">schemesetu / {tour.label.toLowerCase()}</span>
              </div>
              <div className="stage-canvas">
                <img key={tour.id} src={tour.image} alt={tour.alt} />
                <span className="stage-badge" key={`badge-${tour.id}`}>Step {activeTour + 1} of {TOUR.length}</span>
                <div
                  key={`hs-${tour.id}`}
                  className="hotspot"
                  style={{ left: `${hs.x}%`, top: `${hs.y}%`, width: `${hs.w}%`, height: `${hs.h}%` }}
                >
                  <span className={`hotspot-tag is-${tour.tagPos} is-${tour.tagAlign}`}>{tour.tag}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={`landing-how ${howVisible ? 'is-visible' : ''}`} id="how-it-works" ref={howRef}>
        <div className="section-header">
          <h2>How it works</h2>
          <p>Three simple steps to clarity.</p>
        </div>
        <div className="how-track">
          <div className="how-line" aria-hidden="true" />
          <div className="how-steps">
            {STEPS.map((s) => (
              <div className="step" key={s.n}>
                <div className="step-number">{s.n}</div>
                <div className="card step-card">
                  <div className="step-card-top">
                    <span className="step-card-icon">{s.icon}</span>
                    <h3>{s.title}</h3>
                  </div>
                  <p>{s.desc}</p>
                  <ul className="step-points">
                    {s.points.map((p) => (
                      <li key={p}>{Icons.check}<span>{p}</span></li>
                    ))}
                  </ul>
                  <div className="step-example">
                    <span className="step-example-label">{s.exampleLabel}</span>
                    <span className="step-example-text">{s.example}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className={`landing-dev ${devVisible ? 'is-visible' : ''}`} id="developer" ref={devRef}>
        <div className="section-header" style={{ marginBottom: 'var(--space-6)' }}>
          <h2>Meet the developer</h2>
          <p>The person behind SchemeSetu.</p>
        </div>
        <div className="dev-card">
          <div className="dev-avatar" aria-hidden="true">
            <div className="dev-avatar-inner">{DEV.initials}</div>
          </div>

          <div className="dev-main">
            <span className="dev-status">
              <span className="dev-status-dot" />
              {DEV.status}
            </span>
            <div className="dev-info">
              <h3>{DEV.name}</h3>
              <div className="dev-role">{DEV.role}</div>
              <p>{DEV.bio}</p>
            </div>
            <div className="dev-stack" aria-label="Tech stack">
              {DEV.stack.map((t) => (
                <span className="dev-chip" key={t}>{t}</span>
              ))}
            </div>
            <div className="dev-links">
              {DEV.links.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="button button-secondary dev-btn">
                  {l.icon} {l.label}
                </a>
              ))}
            </div>
          </div>

          <div className="dev-facts">
            {DEV.facts.map((f) => (
              <div className="dev-fact" key={f.title}>
                <strong>{f.title}</strong>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={`landing-faq ${faqVisible ? 'is-visible' : ''}`} id="faq" ref={faqRef}>
        <div className="section-header" style={{ marginBottom: 'var(--space-6)' }}>
          <h2>Questions you may have</h2>
        </div>
        <div className="faq-list">
          {FAQ.map((item) => (
            <details className="faq-item" key={item.q}>
              <summary>
                {item.q}
                {Icons.chevron}
              </summary>
              <p className="faq-answer">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className={`landing-cta ${ctaVisible ? 'is-visible' : ''}`} ref={ctaRef}>
        <div className="cta-card">
          <h2>Ready to read your first scheme?</h2>
          <p>Create a free account, upload a PDF, and get your first cited answer in a few minutes.</p>
          <button
            className="button button-primary"
            style={{ padding: '0 var(--space-8)', height: '48px', fontSize: 'var(--text-lg)' }}
            onClick={onGetStarted}
          >
            Get Started for Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} SchemeSetu. Built for a better tomorrow.</p>
      </footer>

      <button
        type="button"
        className={`back-to-top ${showTop ? 'is-shown' : ''}`}
        onClick={scrollTop}
        aria-label="Back to top"
        tabIndex={showTop ? 0 : -1}
      >
        {Icons.arrowUp}
      </button>
    </div>
  )
}