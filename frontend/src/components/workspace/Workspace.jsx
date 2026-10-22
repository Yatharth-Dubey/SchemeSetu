import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import UploadBox from '../upload/UploadBox'
import ChatBox from '../chat/ChatBox'

const Workspace = forwardRef(function Workspace(
  { messages, isSending, onSend, onRetry, onDocumentUploaded, documentsCount },
  ref
) {
  const [activeTab, setActiveTab] = useState('upload')
  const hasAutoSwitchedRef = useRef(false)
  const chatRef = useRef(null)
  const handleUploadSuccess = useCallback(
    (doc) => {
      onDocumentUploaded?.(doc)
      if (!hasAutoSwitchedRef.current) {
        hasAutoSwitchedRef.current = true
        setActiveTab('chat')
      }
    },
    [onDocumentUploaded]
  )

  useImperativeHandle(
    ref,
    () => ({
      focusComposerWithPrompt(prompt) {
        setActiveTab('chat')
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
          onClick={() => setActiveTab('upload')}
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
          onClick={() => setActiveTab('chat')}
        >
          Chat
          {documentsCount > 0 && (
            <span
              className="tab-badge"
              aria-label={`${documentsCount} document${documentsCount === 1 ? '' : 's'} uploaded`}
            >
              {documentsCount}
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
        <UploadBox onUploadSuccess={handleUploadSuccess} />
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
          disabled={documentsCount === 0}
        />
      </div>
    </div>
  )
})

export default Workspace