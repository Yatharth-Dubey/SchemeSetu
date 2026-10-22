import { useRef, useState } from 'react'
import { uploadPdf } from '../../services/api'

const PDF_EXT = /\.pdf$/i
const PDF_MIME = 'application/pdf'

function humanSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isPdf(file) {
  if (!file) return false
  const nameOk = PDF_EXT.test(file.name || '')
  const mimeOk = (file.type || '').toLowerCase() === PDF_MIME
  return nameOk || mimeOk
}

export default function UploadBox({ onUploaded, onUploadSuccess }) {
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  // Status shape: null | { kind: 'success', filename, message } | { kind: 'error', userMessage, code }
  const [status, setStatus] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef(null)

  function pickFile(f) {
    if (!f) return
    setStatus(null)
    if (!isPdf(f)) {
      setFile(null)
      setStatus({
        kind: 'error',
        userMessage: 'Please choose a PDF file.',
        code: 'CLIENT_VALIDATION',
      })
      return
    }
    setFile(f)
  }

  function onInputChange(e) {
    pickFile(e.target.files?.[0] ?? null)
    e.target.value = ''
  }

  function onDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer?.files?.[0] ?? null
    pickFile(f)
  }

  function onDragOver(e) {
    e.preventDefault()
    if (!isUploading) setIsDragOver(true)
  }

  function onDragLeave() {
    setIsDragOver(false)
  }

  async function upload() {
    if (!file || isUploading) return
    setIsUploading(true)
    setStatus(null)
    try {
      const data = await uploadPdf(file)
      // Backend contract: { filename }. The filesystem path stays server-side.
      const filename = typeof data?.filename === 'string' ? data.filename : file.name
      const message = typeof data?.message === 'string' ? data.message : null
      setStatus({ kind: 'success', filename, message })
      // Two distinct callbacks with distinct concerns:
      //  - onUploaded       → appended to session documents (Home/App)
      //  - onUploadSuccess  → tells Workspace to auto-switch to Chat
      onUploaded?.({ filename })
      onUploadSuccess?.({ filename })
    } catch (err) {
      setStatus({
        kind: 'error',
        userMessage: err?.userMessage || 'Upload failed. Please try again.',
        code: err?.code,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const canUpload = !!file && !isUploading

  return (
    <section className="card upload" aria-labelledby="upload-heading">
      <h2 id="upload-heading" className="upload-heading">
        Upload a scheme document
      </h2>
      <p className="upload-help">
        PDF only. The server saves the file; this screen does not confirm
        indexing.
      </p>

      <div
        className={`dropzone${isDragOver ? ' is-dragover' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <label htmlFor="upload-input" className="sr-only">
          Choose a PDF file to upload
        </label>
        <input
          id="upload-input"
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={onInputChange}
          disabled={isUploading}
        />
        <p className="dropzone-hint">
          Drag a PDF here, or use the file picker.
        </p>
      </div>

      {file && (
        <div className="upload-file" aria-live="polite">
          <strong>{file.name}</strong>
          <span>{humanSize(file.size)}</span>
        </div>
      )}

      <div className="upload-actions">
        <button
          type="button"
          className="button button-primary"
          onClick={upload}
          disabled={!canUpload}
          aria-disabled={!canUpload}
        >
          {isUploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>

      {status?.kind === 'success' && (
        <div className="alert alert-success" role="status">
          <div>
            <div>
              <strong>{status.filename}</strong>
              {' — '}
              <span className="badge">Received</span>
            </div>
            <div className="upload-status-note">
              {status.message
                ? status.message
                : 'The server accepted the file.'}
            </div>
          </div>
        </div>
      )}

      {status?.kind === 'error' && (
        <div className="alert alert-error" role="alert">
          <div>
            <div>{status.userMessage}</div>
            {/* {status.code && <div className="error-code">{status.code}</div>} */}
          </div>
        </div>
      )}
    </section>
  )
}