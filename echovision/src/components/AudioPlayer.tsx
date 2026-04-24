import { useRef, useState, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, Download, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react'

interface Props {
  src: string
  title: string
  onDownload?: () => void
}

function formatTime(sec: number) {
  if (!isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function AudioPlayer({ src, title, onDownload }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.src = src
    audio.load()
    setPlaying(false)
    setCurrentTime(0)
    setLoading(true)
  }, [src])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play(); setPlaying(true) }
  }, [playing])

  const restart = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    audio.play()
    setPlaying(true)
  }, [])

  const skip = (delta: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta))
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
    if (v === 0) setMuted(true)
    else setMuted(false)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    const next = !muted
    setMuted(next)
    audio.muted = next
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onDurationChange={() => { setDuration(audioRef.current?.duration || 0); setLoading(false) }}
        onEnded={() => setPlaying(false)}
        onCanPlay={() => setLoading(false)}
        onWaiting={() => setLoading(true)}
      />

      <div className="player-title">
        <Volume2 size={16} />
        <span>{title}</span>
      </div>

      <div className="player-waveform">
        <div className="player-progress-track" onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect()
          const pct = (e.clientX - rect.left) / rect.width
          if (audioRef.current) audioRef.current.currentTime = pct * duration
        }}>
          <div className="player-progress-fill" style={{ width: `${progressPct}%` }} />
          <div className="player-progress-thumb" style={{ left: `${progressPct}%` }} />
        </div>
        <div className="player-times">
          <span>{formatTime(currentTime)}</span>
          <span>{loading ? '—' : formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-controls">
        <div className="player-vol">
          <button className="player-btn-sm" onClick={toggleMute} aria-label="Toggle mute">
            {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <input
            type="range" min={0} max={1} step={0.02} value={muted ? 0 : volume}
            onChange={handleVolumeChange} className="vol-slider" aria-label="Volume"
          />
        </div>

        <div className="player-transport">
          <button className="player-btn-sm" onClick={() => skip(-10)} aria-label="Back 10s">
            <SkipBack size={16} />
          </button>
          <button className="player-btn-play" onClick={toggle} disabled={loading} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause size={22} /> : <Play size={22} />}
          </button>
          <button className="player-btn-sm" onClick={() => skip(10)} aria-label="Forward 10s">
            <SkipForward size={16} />
          </button>
        </div>

        <div className="player-actions">
          <button className="player-btn-sm" onClick={restart} aria-label="Restart">
            <RotateCcw size={15} />
          </button>
          {onDownload && (
            <button className="player-btn-sm" onClick={onDownload} aria-label="Download audio">
              <Download size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
