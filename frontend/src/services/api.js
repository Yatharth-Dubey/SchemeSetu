import axios from 'axios'

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// --- TOKEN STORAGE ---
// For an MVP, localStorage is used. Note: This is vulnerable to XSS.
// For production, consider HttpOnly cookies.
const TOKEN_KEY = 'schemesetu_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 60_000,
})

// --- AXIOS INTERCEPTOR ---
client.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Global 401 handler callback
let onUnauthorized = null
export function setUnauthorizedHandler(cb) {
  onUnauthorized = cb
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized()
    }
    return Promise.reject(error)
  }
)
// --------------------------

function normalizeError(err) {
  const fallback = new Error('Something went wrong. Please try again.')
  fallback.code = 'UNKNOWN'
  fallback.status = null
  fallback.userMessage = 'Something went wrong. Please try again.'

  if (!err || !err.isAxiosError) {
    if (typeof err?.userMessage === 'string') fallback.userMessage = err.userMessage
    if (typeof err?.code === 'string') fallback.code = err.code
    return fallback
  }

  const res = err.response
  if (!res) {
    fallback.code = err.code === 'ECONNABORTED' ? 'TIMEOUT' : 'NETWORK'
    fallback.userMessage =
      err.code === 'ECONNABORTED'
        ? 'The request timed out. Please try again.'
        : 'Cannot reach the server. Check your connection and try again.'
    return fallback
  }

  const data = res.data || {}
  fallback.status = res.status

  if (data.error && typeof data.error === 'object') {
    fallback.code = data.error.code || 'API_ERROR'
    fallback.userMessage = data.error.message || 'The request could not be completed.'
    return fallback
  }
  if (typeof data.detail === 'string') {
    fallback.code = 'HTTP_' + res.status
    fallback.userMessage = data.detail
    return fallback
  }
  if (Array.isArray(data.detail) && data.detail[0]?.msg) {
    fallback.code = 'VALIDATION'
    fallback.userMessage = data.detail[0].msg
    return fallback
  }
  if (typeof data.message === 'string' && data.message) {
    fallback.code = 'HTTP_' + res.status
    fallback.userMessage = data.message
    return fallback
  }

  fallback.code = 'HTTP_' + res.status
  fallback.userMessage = `Request failed (${res.status}).`
  return fallback
}

// --- AUTH ENDPOINTS ---
export async function login(email, password) {
  try {
    // JSON payload matching your LoginRequest schema
    const res = await client.post('/api/auth/login', { email, password })
    
    if (res.data.access_token) {
      tokenStore.set(res.data.access_token)
    }
    return res.data
  } catch (err) {
    throw normalizeError(err)
  }
}

export async function register(email, password) {
  try {
    // JSON payload matching your SignupRequest schema
    // Correct endpoint is /signup, not /register
    const res = await client.post('/api/auth/signup', { email, password })
    return res.data
  } catch (err) {
    throw normalizeError(err)
  }
}

export async function getCurrentUser() {
  try {
    const res = await client.get('/api/auth/me')
    return res.data
  } catch (err) {
    throw normalizeError(err)
  }
}

// --- APP ENDPOINTS ---
export async function sendChat({ question }) {
  try {
    const res = await client.post('/api/chat', { question })
    const body = res.data || {}
    if (body.success === false) throw new Error(body?.error?.message || 'Chat failed')
    const data = body.data && typeof body.data === 'object' ? body.data : {}
    return { ...data, message: body.message || data.message }
  } catch (err) {
    throw normalizeError(err)
  }
}

export async function uploadPdf(file) {
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await client.post('/api/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const body = res.data || {}
    if (body.success === false) throw new Error(body?.error?.message || 'Upload failed')
    return body.data || {}
  } catch (err) {
    throw normalizeError(err)
  }
}

export async function getProcessedDocuments() {
  try {
    const res = await client.get('/api/processed')
    return Array.isArray(res.data) ? res.data : []
  } catch (err) {
    throw normalizeError(err)
  }
}

export async function getLatestQA() {
  try {
    const res = await client.get('/api/qa/latest')
    return res.data?.data || null
  } catch (err) {
    throw normalizeError(err)
  }
}

export async function getQAHistory({ limit = 5, before = null } = {}) {
  try {
    const params = { limit }
    if (before) params.before = before
    const res = await client.get('/api/qa/history', { params })
    return (
      res.data?.data || { items: [], has_more: false, next_cursor: null }
    )
  } catch (err) {
    throw normalizeError(err)
  }
}

export default client