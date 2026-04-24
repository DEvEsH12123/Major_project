import { useRef, useState, useCallback } from 'react'
import { Upload, FileText, CircleAlert as AlertCircle } from 'lucide-react'

interface Props {
  onFile: (file: File) => void
  disabled?: boolean
}

export function UploadZone({ onFile, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validate = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['pdf', 'doc', 'docx'].includes(ext)) {
      setError('Only PDF and DOCX files are supported.')
      return false
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File must be under 50 MB.')
      return false
    }
    setError(null)
    return true
  }, [])

  const handleFile = useCallback((file: File) => {
    if (validate(file)) onFile(file)
  }, [onFile, validate])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="upload-section">
      <div
        className={`upload-zone${dragging ? ' dragging' : ''}${disabled ? ' disabled' : ''}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={disabled ? undefined : onDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={e => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        aria-label="Upload document"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
          disabled={disabled}
        />
        <div className="upload-icon">
          <Upload size={40} strokeWidth={1.5} />
        </div>
        <h3 className="upload-title">Drop your document here</h3>
        <p className="upload-sub">or click to browse</p>
        <div className="upload-formats">
          <FileText size={14} />
          <span>PDF, DOC, DOCX — up to 50 MB</span>
        </div>
      </div>
      {error && (
        <div className="upload-error">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
