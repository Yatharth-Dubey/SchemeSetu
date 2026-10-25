import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from 'react'
import UploadBox from '../upload/UploadBox'
import ChatBox from '../chat/ChatBox'

const Workspace = forwardRef(function Workspace(
  { messages, isSending, onSend, onRetry, onDocumentUploaded, documents = [] },
  ref
) {
  const [activeTab, setActiveTab] = useState('upload')
  // Keep track of whether the user manually changed tabs
  const [userInteracted, setUserInteracted] = useState(false)
  
  const chatRef = useRef(null)
  
  // Track the most recently uploaded doc ID to know when to auto-switch
  const lastUploadedIdRef = useRef(null)

  const completedCount = documents.filter((d) => d.status === 'completed').length

  const handleUploadSuccess = useCallback(
    (doc) => {
      if (!doc?.document_id) return
      lastUploadedIdRef.current = doc.document_id
      setUserInteracted(false) // Reset user interaction since they just uploaded
      onDocumentUploaded?.(doc)
    },
    [onDocumentUploaded]
  )

  // Auto-switch logic
  useEffect(() => {
    // Only switch if we have a pending uploaded doc, the user hasn't interacted, 
    // and that doc is now completed.
    if (lastUploadedIdRef.current && !userInteracted) {
      const targetDoc = documents.find((d) => d.document_id === lastUploadedIdRef.current)
      
      if (targetDoc?.status === 'completed') {
        setActiveTab('chat')
        lastUploadedIdRef.current = null // Clear so we don't switch again for this doc
      } else if (targetDoc?.status === 'failed') {
        lastUploadedIdRef.current = null // Clear so we don't keep checking a failed doc
      }
    }
  }, [documents, userInteracted])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setUserInteracted(true)
  }

  useImperativeHandle(
    ref,
    () => ({
      focusComposerWithPrompt(prompt) {
        setActiveTab('chat')
        setUserInteracted(true) // This is a manual interaction
        requestAnimationFrame(() => {
          chatRef.current?.setQuestion(prompt)
        })
      },
    }),
    []
  )

  return (
    <div className="workspace">
      <div className="tabs" role="tablist" aria-label="Workspace view">
        <button
          type="button"
          role="tab"
          id="tab-upload"
          aria-selected={activeTab === 'upload'}
          aria-controls="panel-upload"
          className={`tab${activeTab === 'upload' ? ' is-active' : ''}`}
          onClick={() => handleTabChange('upload')}
        >
          Upload
        </button>
        <button
          type="button"
          role="tab"
          id="tab-chat"
          aria-selected={activeTab === 'chat'}
          aria-controls="panel-chat"
          className={`tab${activeTab === 'chat' ? ' is-active' : ''}`}
          onClick={() => handleTabChange('chat')}
        >
          Chat
          {completedCount > 0 && (
            <span
              className="tab-badge"
              aria-label={`${completedCount} document${completedCount === 1 ? '' : 's'} ready`}
            >
              {completedCount}
            </span>
          )}
        </button>
      </div>

      <div
        id="panel-upload"
        role="tabpanel"
        aria-labelledby="tab-upload"
        hidden={activeTab !== 'upload'}
      >
        <UploadBox onUploadSuccess={handleUploadSuccess} documents={documents} />
      </div>

      <div
        id="panel-chat"
        role="tabpanel"
        aria-labelledby="tab-chat"
        hidden={activeTab !== 'chat'}
      >
        <ChatBox
          ref={chatRef}
          messages={messages}
          isSending={isSending}
          onSend={onSend}
          onRetry={onRetry}
          disabled={completedCount === 0}
        />
      </div>
    </div>
  )
})

export default Workspace