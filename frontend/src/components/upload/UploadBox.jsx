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

export default function UploadBox({ onUploaded, onUploadSuccess, documents = [] }) {
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [status, setStatus] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef(null)

  // Grab the most recent document to show its persistent status
  const latestDoc = documents.length > 0 ? documents[0] : null;

  function pickFile(f) {
    if (!f) return
    setStatus(null)
    if (!isPdf(f)) {
      setFile(null)
      setStatus({ kind: 'error', userMessage: 'Please choose a PDF file.', code: 'CLIENT_VALIDATION' })
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
    pickFile(e.dataTransfer?.files?.[0] ?? null)
  }

  function onDragOver(e) {
    e.preventDefault()
    if (!isUploading) setIsDragOver(true)
  }

  function onDragLeave() { setIsDragOver(false) }

  async function upload() {
    if (!file || isUploading) return
    setIsUploading(true)
    setStatus(null)
    try {
      const data = await uploadPdf(file)
      const filename = typeof data?.filename === 'string' ? data.filename : file.name
      const message = typeof data?.message === 'string' ? data.message : 'Uploaded. Processing has been queued.'
      setStatus({ kind: 'success', filename, message })
      onUploaded?.(data)
      onUploadSuccess?.(data)
    } catch (err) {
      setStatus({ kind: 'error', userMessage: err?.userMessage || 'Upload failed.', code: err?.code })
    } finally {
      setIsUploading(false)
    }
  }

  const canUpload = !!file && !isUploading

  return (
    <section className="card upload" aria-labelledby="upload-heading">
      <h2 id="upload-heading" className="upload-heading">Upload a scheme document</h2>
      <p className="upload-help">PDF only. The server will queue it for indexing.</p>

      {/* Persistent backend status block */}
      {latestDoc && (
        <div className="alert" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', marginBottom: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <strong>{latestDoc.filename.replace(/^doc_[a-zA-Z0-9]+_/, '')}</strong>
              <div className="upload-status-note">
                {latestDoc.status === 'processing' || latestDoc.status === 'uploaded' 
                  ? 'Processing document... (This may take a moment)'
                  : latestDoc.status === 'completed'
                  ? 'Ready to chat'
                  : 'Processing failed: ' + (latestDoc.error || 'Unknown error')}
              </div>
            </div>
            <span className="badge" style={{
               background: latestDoc.status === 'completed' ? 'var(--color-success-soft)' : 
                           latestDoc.status === 'failed' ? 'var(--color-error-soft)' : 'var(--color-accent-soft)',
               color: latestDoc.status === 'completed' ? 'var(--color-success)' : 
                      latestDoc.status === 'failed' ? 'var(--color-error)' : 'var(--color-accent)'
            }}>
              {latestDoc.status === 'completed' ? 'Done' : 
               latestDoc.status === 'failed' ? 'Failed' : 'Processing'}
            </span>
          </div>
        </div>
      )}

            {/* Dropzone */}
      <div className={`dropzone${isDragOver ? ' is-dragover' : ''}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        
        {/* Hidden Input */}
        <input 
          id="upload-input" 
          ref={inputRef} 
          type="file" 
          accept="application/pdf,.pdf" 
          onChange={onInputChange} 
          disabled={isUploading} 
          style={{ display: 'none' }} // <-- CHUPA DIYA
        />
        
        {/* Custom Button UI */}
        <label htmlFor="upload-input" className="button button-secondary" style={{ cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.5 : 1 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Choose PDF
        </label>

        <p className="dropzone-hint">Drag a PDF here, or use the file picker.</p>
      </div>

      {file && (
        <div className="upload-file" aria-live="polite">
          <strong>{file.name}</strong>
          <span>{humanSize(file.size)}</span>
        </div>
      )}

      <div className="upload-actions">
        <button type="button" className="button button-primary" onClick={upload} disabled={!canUpload} aria-disabled={!canUpload}>
          {isUploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>

      {/* Transient feedback (only if no backend doc is showing) */}
      {status?.kind === 'success' && !latestDoc && (
        <div className="alert alert-success" role="status" style={{ marginTop: 'var(--space-3)' }}>
          <div><strong>{status.filename}</strong> — {status.message}</div>
        </div>
      )}
      {status?.kind === 'error' && (
        <div className="alert alert-error" role="alert" style={{ marginTop: 'var(--space-3)' }}>
          <div>{status.userMessage}</div>
        </div>
      )}
    </section>
  )
}