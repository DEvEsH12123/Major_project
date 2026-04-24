import { useEffect, useState } from 'react'
import { FileText, Image, Loader as Loader2, CircleCheck as CheckCircle2, CircleAlert as AlertCircle } from 'lucide-react'

interface Block {
  index: number
  type: string
  content: string
  has_audio: boolean
}

interface Props {
  fileName: string
  status: 'processing' | 'done' | 'error'
  blocksReady: number
  totalBlocks: number
  blocks: Block[]
  error?: string | null
}

export function ProcessingView({ fileName, status, blocksReady, totalBlocks, blocks, error }: Props) {
  const [visibleBlocks, setVisibleBlocks] = useState<Block[]>([])

  useEffect(() => {
    setVisibleBlocks(blocks.slice(0, 8))
  }, [blocks])

  const progress = totalBlocks > 0 ? Math.round((blocksReady / totalBlocks) * 100) : 0
  const isDone = status === 'done'
  const isError = status === 'error'

  return (
    <div className="processing-view">
      <div className="processing-header">
        <FileText size={20} />
        <span className="processing-filename">{fileName}</span>
        {isDone && <span className="status-badge done"><CheckCircle2 size={13} /> Complete</span>}
        {isError && <span className="status-badge error"><AlertCircle size={13} /> Error</span>}
        {!isDone && !isError && <span className="status-badge processing"><Loader2 size={13} className="spin" /> Processing</span>}
      </div>

      {!isError && (
        <div className="progress-section">
          <div className="progress-bar-track">
            <div
              className={`progress-bar-fill${isDone ? ' done' : ''}`}
              style={{ width: `${isDone ? 100 : progress}%` }}
            />
          </div>
          <div className="progress-labels">
            <span>{isDone ? 'All blocks processed' : `${blocksReady} blocks processed`}</span>
            {!isDone && <span>{progress}%</span>}
          </div>
        </div>
      )}

      {isError && (
        <div className="processing-error">
          <AlertCircle size={16} />
          <span>{error || 'Processing failed. Please try again.'}</span>
        </div>
      )}

      {visibleBlocks.length > 0 && (
        <div className="blocks-preview">
          <p className="blocks-preview-label">Blocks processed so far</p>
          <div className="blocks-list">
            {visibleBlocks.map(block => (
              <div key={block.index} className={`block-item ${block.type}`}>
                <span className="block-icon">
                  {block.type === 'image' ? <Image size={13} /> : <FileText size={13} />}
                </span>
                <span className="block-content">{block.content.slice(0, 90)}{block.content.length > 90 ? '…' : ''}</span>
                {block.has_audio && <span className="block-audio-dot" title="Audio ready" />}
              </div>
            ))}
          </div>
          {blocks.length > 8 && (
            <p className="blocks-more">+{blocks.length - 8} more blocks</p>
          )}
        </div>
      )}
    </div>
  )
}
