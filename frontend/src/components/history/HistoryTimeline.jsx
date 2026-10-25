import { useState, useLayoutEffect, useRef } from 'react'
import HistoryCard from './HistoryCard'

export default function HistoryTimeline({
  history,
  hasMore,
  loading,
  onLoadMore,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const containerRef = useRef(null)

  // Pichle render ka snapshot
  const prevHeightRef = useRef(0)
  const prevFirstIdRef = useRef(null)
  const prevLastIdRef = useRef(null)

  // Sirf "Load more" se aaye records par scroll animation chalani hai
  const loadMoreRequestedRef = useRef(false)

  function handleLoadMore() {
    loadMoreRequestedRef.current = true
    onLoadMore?.()
  }

  // --- SCROLL MANAGEMENT ---
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el || history.length === 0) return

    const firstId = history[0].id
    const lastId = history[history.length - 1].id
    const prevFirst = prevFirstIdRef.current
    const prevLast = prevLastIdRef.current
    const prevHeight = prevHeightRef.current

    const isFirstRender = prevFirst === null
    const prepended = !isFirstRender && firstId !== prevFirst // naye records upar aaye
    const appended = !isFirstRender && !prepended && lastId !== prevLast // naye records neeche aaye

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior = reduceMotion ? 'auto' : 'smooth'

    if (prepended) {
      // Step 1: content upar add hua hai, isliye turant utna neeche shift karo
      // taaki user ko wahi content dikhe jo wo padh raha tha (koi jump nahi).
      el.scrollTop += el.scrollHeight - prevHeight

      // Step 2: Load more se aaya hai to smoothly upar scroll karke naye records dikhao.
      if (loadMoreRequestedRef.current) {
        requestAnimationFrame(() => el.scrollTo({ top: 0, behavior }))
      }
    } else if (appended && loadMoreRequestedRef.current) {
      // Naye (purane) records neeche add hue hain: wahan tak scroll karo.
      requestAnimationFrame(() => el.scrollTo({ top: Math.max(prevHeight - 24, 0), behavior }))
    }

    // Request tabhi clear karo jab loading khatam ho chuki ho
    if (!loading) loadMoreRequestedRef.current = false

    // Snapshot update
    prevHeightRef.current = el.scrollHeight
    prevFirstIdRef.current = firstId
    prevLastIdRef.current = lastId
  }, [history, loading])
  // -------------------------

  if (history.length === 0 && !loading) return null

  return (
    <section className={`history${isCollapsed ? ' is-collapsed' : ''}`} aria-label="Previous questions and answers">

      <div className="history-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Past Conversations</h3>
          <span className="badge">{history.length}</span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          {hasMore && !isCollapsed && (
            <button
              type="button"
              className="button button-secondary"
              onClick={handleLoadMore}
              disabled={loading}
              style={{ height: 'var(--control-height-sm)', padding: '0 var(--space-3)' }}
            >
              {loading && <span className="spinner" style={{ marginRight: '6px', width: '12px', height: '12px', borderWidth: '2px' }} />}
              {loading ? 'Loading…' : 'Load more'}
            </button>
          )}

          <button
            type="button"
            className="button button-ghost button-icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand history' : 'Collapse history'}
            aria-expanded={!isCollapsed}
          >
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`history-content-wrapper ${isCollapsed ? 'is-collapsed' : ''}`}>
        <div className="history-scroll-area" ref={containerRef}>
          <ol className="timeline">
            {history.map((item, index) => (
              <li
                key={item.id}
                className="timeline-item"
                style={{ animationDelay: `${(index % 5) * 0.05}s` }}
              >
                <span className="timeline-marker" aria-hidden="true" />
                <HistoryCard item={item} />
              </li>
            ))}
          </ol>
        </div>
      </div>

    </section>
  )
}