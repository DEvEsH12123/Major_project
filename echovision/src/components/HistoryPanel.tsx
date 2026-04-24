import { FileText, Trash2, Play, CircleAlert as AlertCircle, Loader as Loader2, CircleCheck as CheckCircle2, Calendar } from 'lucide-react'

interface HistoryItem {
  id?: string
  session_id: string
  file_name: string
  file_size: number
  status: 'processing' | 'done' | 'error'
  error_message?: string | null
  blocks_count: number
  created_at: string
}

interface Props {
  items: HistoryItem[]
  activeSessionId?: string
  onLoad: (item: HistoryItem) => void
  onDelete: (sessionId: string) => void
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(iso).toLocaleDateString()
}

export function HistoryPanel({ items, activeSessionId, onLoad, onDelete }: Props) {
  if (items.length === 0) {
    return (
      <div className="history-empty">
        <FileText size={36} strokeWidth={1} />
        <p>No sessions yet</p>
        <span>Upload a document to get started</span>
      </div>
    )
  }

  return (
    <div className="history-list">
      {items.map(item => {
        const isActive = item.session_id === activeSessionId
        return (
          <div key={item.session_id} className={`history-item${isActive ? ' active' : ''}`}>
            <div className="history-item-info">
              <div className="history-item-name">
                <FileText size={14} />
                <span title={item.file_name}>{item.file_name}</span>
              </div>
              <div className="history-item-meta">
                <span>{formatBytes(item.file_size)}</span>
                <span>·</span>
                <span>{item.blocks_count} blocks</span>
                <span>·</span>
                <span className="history-time"><Calendar size={11} />{timeAgo(item.created_at)}</span>
              </div>
            </div>

            <div className="history-item-status">
              {item.status === 'done' && <span className="status-dot done" title="Done"><CheckCircle2 size={13} /></span>}
              {item.status === 'processing' && <span className="status-dot processing" title="Processing"><Loader2 size={13} className="spin" /></span>}
              {item.status === 'error' && <span className="status-dot error" title={item.error_message || 'Error'}><AlertCircle size={13} /></span>}
            </div>

            <div className="history-item-actions">
              {item.status === 'done' && (
                <button className="btn-icon" onClick={() => onLoad(item)} title="Load audio">
                  <Play size={14} />
                </button>
              )}
              <button className="btn-icon danger" onClick={() => onDelete(item.session_id)} title="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
