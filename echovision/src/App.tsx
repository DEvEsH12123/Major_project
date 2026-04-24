import { useState, useEffect, useCallback, useRef } from 'react'
import { Mic, Clock, File as FileAudio, Sun, Moon } from 'lucide-react'
import { UploadZone } from './components/UploadZone'
import { ProcessingView } from './components/ProcessingView'
import { AudioPlayer } from './components/AudioPlayer'
import { HistoryPanel } from './components/HistoryPanel'
import { VoiceAssistant } from './components/VoiceAssistant'
import { uploadDocument, getStatus, getBlocks, exportUrl, deleteSession } from './lib/api'
import { loadLocalSessions, saveLocalSession, removeLocalSession } from './lib/storage'
import './App.css'

type Tab = 'upload' | 'history'

interface Block {
  index: number
  type: string
  content: string
  has_audio: boolean
}

interface SessionState {
  sessionId: string
  fileName: string
  fileSize: number
  status: 'processing' | 'done' | 'error'
  error: string | null
  blocksReady: number
  totalBlocks: number
  blocks: Block[]
  audioReady: boolean
  createdAt: string
}

export default function App() {
  const [tab, setTab] = useState<Tab>('upload')
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('ev_theme') as 'dark' | 'light') || 'dark'
  )
  const [session, setSession] = useState<SessionState | null>(null)
  const [uploading, setUploading] = useState(false)
  const [historyItems, setHistoryItems] = useState(() => loadLocalSessions())
  const [vaOpen, setVaOpen] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ev_theme', theme)
  }, [theme])

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  const startPolling = useCallback((sid: string) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const [statusData, blocksData] = await Promise.all([
          getStatus(sid),
          getBlocks(sid),
        ])

        setSession(prev => {
          if (!prev) return prev
          const updated: SessionState = {
            ...prev,
            status: statusData.status,
            error: statusData.error,
            blocksReady: statusData.blocks_ready,
            totalBlocks: blocksData.blocks.length,
            blocks: blocksData.blocks,
            audioReady: statusData.status === 'done',
          }

          saveLocalSession({
            session_id: sid,
            file_name: prev.fileName,
            file_size: prev.fileSize,
            status: statusData.status,
            error_message: statusData.error,
            blocks_count: blocksData.blocks.length,
            created_at: prev.createdAt,
          })

          return updated
        })

        setHistoryItems(loadLocalSessions())

        if (statusData.status === 'done' || statusData.status === 'error') {
          stopPolling()
        }
      } catch {
        // silently retry
      }
    }, 2000)
  }, [stopPolling])

  const handleFile = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const { session_id } = await uploadDocument(file)
      const now = new Date().toISOString()
      const newSession: SessionState = {
        sessionId: session_id,
        fileName: file.name,
        fileSize: file.size,
        status: 'processing',
        error: null,
        blocksReady: 0,
        totalBlocks: 0,
        blocks: [],
        audioReady: false,
        createdAt: now,
      }
      setSession(newSession)
      saveLocalSession({
        session_id,
        file_name: file.name,
        file_size: file.size,
        status: 'processing',
        blocks_count: 0,
        created_at: now,
      })
      setHistoryItems(loadLocalSessions())
      startPolling(session_id)
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
    }
  }, [startPolling])

  const handleLoadHistory = useCallback((item: ReturnType<typeof loadLocalSessions>[number]) => {
    const s: SessionState = {
      sessionId: item.session_id!,
      fileName: item.file_name!,
      fileSize: item.file_size || 0,
      status: (item.status as SessionState['status']) || 'done',
      error: item.error_message || null,
      blocksReady: item.blocks_count || 0,
      totalBlocks: item.blocks_count || 0,
      blocks: [],
      audioReady: item.status === 'done',
      createdAt: item.created_at!,
    }
    setSession(s)
    setTab('upload')
    if (s.status === 'processing') startPolling(s.sessionId)
  }, [startPolling])

  const handleDeleteHistory = useCallback(async (sessionId: string) => {
    removeLocalSession(sessionId)
    setHistoryItems(loadLocalSessions())
    try { await deleteSession(sessionId) } catch { /* ignore */ }
    if (session?.sessionId === sessionId) {
      stopPolling()
      setSession(null)
    }
  }, [session, stopPolling])

  useEffect(() => () => stopPolling(), [stopPolling])

  const currentExportUrl = session?.audioReady ? exportUrl(session.sessionId) : null

  const vaContext = session
    ? { fileName: session.fileName, status: session.status, blocksCount: session.blocksReady }
    : null

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <FileAudio size={22} />
          </div>
          <span className="logo-text">EchoVision</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item${tab === 'upload' ? ' active' : ''}`}
            onClick={() => setTab('upload')}
          >
            <FileAudio size={18} />
            <span>Document</span>
          </button>
          <button
            className={`nav-item${tab === 'history' ? ' active' : ''}`}
            onClick={() => setTab('history')}
          >
            <Clock size={18} />
            <span>History</span>
            {historyItems.length > 0 && (
              <span className="nav-badge">{historyItems.length}</span>
            )}
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button
            className="va-trigger"
            onClick={() => setVaOpen(true)}
            aria-label="Open voice assistant"
          >
            <Mic size={20} />
            <span>Echo Assistant</span>
          </button>
          <button
            className="theme-toggle"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="main-header">
          <div>
            <h1 className="page-title">
              {tab === 'upload' ? 'Document Reader' : 'Session History'}
            </h1>
            <p className="page-sub">
              {tab === 'upload'
                ? 'Upload a PDF or DOCX and listen to your document'
                : 'Your previous processing sessions'}
            </p>
          </div>
          {session && tab === 'upload' && (
            <div className="header-session-status">
              <span className={`pill ${session.status}`}>{session.status}</span>
            </div>
          )}
        </header>

        <div className="content-area">
          {tab === 'upload' && (
            <div className="upload-tab">
              <UploadZone onFile={handleFile} disabled={uploading || session?.status === 'processing'} />

              {session && (
                <ProcessingView
                  fileName={session.fileName}
                  status={session.status}
                  blocksReady={session.blocksReady}
                  totalBlocks={session.totalBlocks}
                  blocks={session.blocks}
                  error={session.error}
                />
              )}

              {session?.audioReady && currentExportUrl && (
                <div className="player-section">
                  <h2 className="section-heading">Document Audio</h2>
                  <AudioPlayer
                    src={currentExportUrl}
                    title={session.fileName}
                    onDownload={() => {
                      const a = document.createElement('a')
                      a.href = currentExportUrl
                      a.download = session.fileName.replace(/\.\w+$/, '') + '_audio.wav'
                      a.click()
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <HistoryPanel
              items={historyItems as Parameters<typeof HistoryPanel>[0]['items']}
              activeSessionId={session?.sessionId}
              onLoad={handleLoadHistory}
              onDelete={handleDeleteHistory}
            />
          )}
        </div>
      </main>

      <VoiceAssistant open={vaOpen} onClose={() => setVaOpen(false)} currentSession={vaContext} />
    </div>
  )
}
