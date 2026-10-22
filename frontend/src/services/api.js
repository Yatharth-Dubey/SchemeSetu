import axios from 'axios'

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 60_000, // generous: RAG + LLM can be slow
})

/**
 * Normalize an error into a plain Error with .code, .status, .userMessage.
 * Handles three shapes:
 *  - SchemeSetu chat envelope: { success: false, error: { code, message } }
 *  - FastAPI default: { detail: "..." } or { detail: [{ msg, ... }] }
 *  - Network / timeout: no response
 */
function normalizeError(err) {
  const fallback = new Error('Something went wrong. Please try again.')
  fallback.code = 'UNKNOWN'
  fallback.status = null
  fallback.userMessage = 'Something went wrong. Please try again.'

  if (!err || !err.isAxiosError) {
    if (typeof err?.userMessage === 'string') {
      fallback.userMessage = err.userMessage
    }
    if (typeof err?.code === 'string') {
      fallback.code = err.code
    }
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

  // 1. Chat envelope
  if (data.error && typeof data.error === 'object') {
    fallback.code = data.error.code || 'API_ERROR'
    fallback.userMessage =
      data.error.message || 'The request could not be completed.'
    return fallback
  }

  // 2. FastAPI detail (string or array of validation entries)
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

  // 3. Generic message field
  if (typeof data.message === 'string' && data.message) {
    fallback.code = 'HTTP_' + res.status
    fallback.userMessage = data.message
    return fallback
  }

  fallback.code = 'HTTP_' + res.status
  fallback.userMessage = `Request failed (${res.status}).`
  return fallback
}

export async function sendChat({ question }) {
  try {
    const res = await client.post('/api/chat', { question })
    const body = res.data || {}
    if (body.success === false) {
      const e = new Error('Chat request returned success:false')
      e.code = body?.error?.code || 'API_ERROR'
      e.userMessage = body?.error?.message || 'The request could not be completed.'
      throw e
    }
    const data = body.data && typeof body.data === 'object' ? body.data : {}
    return {
    ...data,
    message:
        typeof body.message === 'string' && body.message.trim() !== ''
        ? body.message
        : typeof data.message === 'string'
            ? data.message
            : undefined,
    }
  } catch (err) {
    throw normalizeError(err)
  }
}

export async function uploadPdf(file) {
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await client.post('/api/upload', fd, {
      // Let the browser set the multipart boundary
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const body = res.data || {}
    if (body.success === false) {
      const e = new Error('Upload returned success:false')
      e.code = body?.error?.code || 'API_ERROR'
      e.userMessage = body?.error?.message || 'Upload failed.'
      throw e
    }
    return body.data || {}
  } catch (err) {
    throw normalizeError(err)
  }
}

export default client