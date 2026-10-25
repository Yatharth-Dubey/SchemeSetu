import { useState } from 'react'
import { login, register } from '../../services/api'

const eyeOpen = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
)
const eyeOff = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94 M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19 M14.12 14.12a3 3 0 1 1-4.24-4.24 M1 1l22 22" />
  </svg>
)

function getStrength(pw) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
  return { score, label: pw.length === 0 ? '' : labels[score] }
}

function PasswordField({ id, label, value, onChange, disabled, show, onToggle, onCapsLock, autoComplete }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={(e) => onCapsLock?.(e.getModifierState && e.getModifierState('CapsLock'))}
          disabled={disabled}
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          className="auth-eye"
          onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          tabIndex={-1}
        >
          {show ? eyeOff : eyeOpen}
        </button>
      </div>
    </div>
  )
}

export default function AuthScreen({ onAuthSuccess, onBack }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [errorKey, setErrorKey] = useState(0) // re-triggers the shake animation

  const strength = getStrength(password)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  function showError(message) {
    setError({ userMessage: message })
    setErrorKey((k) => k + 1)
  }

  function switchMode(toLogin) {
    if (toLogin === isLogin) return
    setIsLogin(toLogin)
    setError(null)
    setConfirmPassword('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!isLogin && password !== confirmPassword) {
      showError('Passwords do not match.')
      return
    }
    if (!email || !password) {
      showError('Please enter both email and password.')
      return
    }

    setIsLoading(true)
    try {
      if (isLogin) {
        await login(email, password)
        onAuthSuccess(email)
      } else {
        await register(email, password)
        await login(email, password)
        onAuthSuccess(email)
      }
    } catch (err) {
      showError(err.userMessage || 'Authentication failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app-shell auth-shell">
      <div className="auth-glow glow-a" aria-hidden="true" />
      <div className="auth-glow glow-b" aria-hidden="true" />

      <div className="card auth-card">
        {onBack && (
          <button type="button" className="auth-back" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5 M12 19l-7-7 7-7" />
            </svg>
            Back to home
          </button>
        )}

        <div className="auth-brand">
          <span className="sidebar-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
          <h1 key={isLogin ? 'h-login' : 'h-register'} className="auth-form-body" style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h1>
          <p key={isLogin ? 'p-login' : 'p-register'} className="auth-form-body" style={{ color: 'var(--color-text-muted)' }}>
            {isLogin ? 'Log in to access your documents.' : 'Register to start using SchemeSetu.'}
          </p>
        </div>

        <div className="auth-switch" role="tablist" aria-label="Choose log in or register">
          <button type="button" role="tab" aria-selected={isLogin} className={isLogin ? 'is-active' : ''} onClick={() => switchMode(true)} disabled={isLoading}>
            Log in
          </button>
          <button type="button" role="tab" aria-selected={!isLogin} className={!isLogin ? 'is-active' : ''} onClick={() => switchMode(false)} disabled={isLoading}>
            Register
          </button>
        </div>

        {error && (
          <div key={errorKey} className="alert alert-error shake" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
            {error.userMessage}
          </div>
        )}

        <form
          key={isLogin ? 'login' : 'register'}
          className="auth-form-body"
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
        >
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            disabled={isLoading}
            show={showPassword}
            onToggle={() => setShowPassword((s) => !s)}
            onCapsLock={setCapsLock}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />

          {capsLock && <div className="auth-hint is-warn" role="status">Caps Lock is on.</div>}

          {!isLogin && password.length > 0 && (
            <div className="strength" data-level={strength.score}>
              <div className="strength-bars" aria-hidden="true">
                <span /><span /><span /><span />
              </div>
              <span className="auth-hint">
                Password strength: <strong>{strength.label}</strong>. Use 8+ characters with upper and lower case, a number and a symbol.
              </span>
            </div>
          )}

          {!isLogin && (
            <>
              <PasswordField
                id="confirm"
                label="Confirm Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                disabled={isLoading}
                show={showPassword}
                onToggle={() => setShowPassword((s) => !s)}
                onCapsLock={setCapsLock}
                autoComplete="new-password"
              />
              {confirmPassword.length > 0 && (
                <div className={`auth-hint ${passwordsMatch ? 'is-ok' : 'is-warn'}`} role="status">
                  {passwordsMatch ? 'Passwords match.' : 'Passwords do not match yet.'}
                </div>
              )}
            </>
          )}

          <button type="submit" className="button button-primary auth-submit" disabled={isLoading} style={{ marginTop: 'var(--space-2)' }}>
            {isLoading && <span className="spinner" aria-hidden="true" />}
            {isLoading ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
          <button
            type="button"
            className="button-ghost"
            onClick={() => switchMode(!isLogin)}
            disabled={isLoading}
            style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer' }}
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Log in'}
          </button>
        </div>

        <div className="auth-trust">
          <span>Private to your account</span>
          <span>Answers cite page numbers</span>
        </div>
      </div>
    </div>
  )
}