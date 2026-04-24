import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, X, MessageSquare, Send } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
}

type SpeechRecognitionCtor = new () => {
  lang: string
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
}

interface Props {
  open: boolean
  onClose: () => void
  currentSession?: { fileName: string; status: string; blocksCount: number } | null
}

const HINTS = [
  'How many blocks were processed?',
  'What type of document is this?',
  'Can you summarize the content?',
  'Is the audio ready to play?',
]

export function VoiceAssistant({ open, onClose, currentSession }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        text: `Hi! I'm Echo, your document assistant. ${currentSession ? `I can see you're working on "${currentSession.fileName}". ` : ''}Ask me anything about your document or how to use EchoVision.`,
      }])
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const buildResponse = useCallback((text: string): string => {
    const lower = text.toLowerCase()

    if (!currentSession) {
      if (lower.includes('upload') || lower.includes('start') || lower.includes('how')) {
        return 'To get started, drag and drop a PDF or DOCX file onto the upload zone, or click to browse. EchoVision will convert your document into audio with image descriptions.'
      }
      return "I don't see any active document session yet. Upload a PDF or DOCX file to begin."
    }

    if (lower.includes('block') || lower.includes('how many')) {
      return `The document "${currentSession.fileName}" has ${currentSession.blocksCount} blocks processed. Each block is either a text passage or an image with a generated description.`
    }
    if (lower.includes('status') || lower.includes('ready') || lower.includes('done') || lower.includes('finish')) {
      if (currentSession.status === 'done') return `Your document is fully processed and ready to listen! Hit the play button to hear the complete audio.`
      if (currentSession.status === 'processing') return `Still processing "${currentSession.fileName}". ${currentSession.blocksCount} blocks done so far — audio will be ready once complete.`
      return `There was an error processing "${currentSession.fileName}". Please try uploading again.`
    }
    if (lower.includes('play') || lower.includes('audio') || lower.includes('listen')) {
      return currentSession.status === 'done'
        ? 'The full audio is ready! Use the player below to play, pause, skip, or download the complete document audio.'
        : 'The audio will be available once processing is complete. I\'ll let you know when it\'s ready!'
    }
    if (lower.includes('download')) {
      return currentSession.status === 'done'
        ? 'You can download the full audio using the download button in the audio player. It saves as a WAV file.'
        : 'The download will be available once processing finishes.'
    }
    if (lower.includes('image') || lower.includes('chart') || lower.includes('picture')) {
      return 'EchoVision uses an AI model to generate descriptions for any images, charts, or graphs found in your document. These descriptions are then converted to speech so nothing is missed.'
    }
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return `Hello! I'm Echo. ${currentSession.status === 'done' ? `Your document "${currentSession.fileName}" is ready to play!` : `I'm monitoring "${currentSession.fileName}" for you.`}`
    }
    if (lower.includes('thank')) {
      return "You're welcome! Let me know if you need anything else."
    }

    return `I can help you with information about "${currentSession.fileName}" (${currentSession.blocksCount} blocks, status: ${currentSession.status}). Try asking about the status, blocks, or how to play the audio.`
  }, [currentSession])

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    setTimeout(() => {
      const reply = buildResponse(text)
      const assistantMsg: Message = { id: Date.now().toString() + 'a', role: 'assistant', text: reply }
      setMessages(prev => [...prev, assistantMsg])

      if ('speechSynthesis' in window) {
        const utt = new SpeechSynthesisUtterance(reply)
        utt.rate = 1.0
        utt.onstart = () => setSpeaking(true)
        utt.onend = () => setSpeaking(false)
        speechSynthesis.cancel()
        speechSynthesis.speak(utt)
      }
    }, 400)
  }, [buildResponse])

  const toggleListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      sendMessage('Voice recognition is not supported in this browser.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const rec = new SpeechRecognition()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.onresult = e => {
      const transcript = e.results[0][0].transcript
      setListening(false)
      sendMessage(transcript)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
    rec.start()
    setListening(true)
  }, [listening, sendMessage])

  const stopSpeaking = () => {
    speechSynthesis.cancel()
    setSpeaking(false)
  }

  if (!open) return null

  return (
    <div className="va-overlay" role="dialog" aria-label="Voice Assistant">
      <div className="va-panel">
        <div className="va-header">
          <div className="va-header-left">
            <div className={`va-avatar${speaking ? ' speaking' : ''}`}>
              <MessageSquare size={18} />
            </div>
            <div>
              <h3>Echo</h3>
              <span>Document Assistant</span>
            </div>
          </div>
          <button className="btn-icon" onClick={() => { stopSpeaking(); onClose() }} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="va-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`va-msg ${msg.role}`}>
              <div className="va-bubble">{msg.text}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="va-hints">
          {HINTS.map(hint => (
            <button key={hint} className="va-hint" onClick={() => sendMessage(hint)}>{hint}</button>
          ))}
        </div>

        <div className="va-input-row">
          <input
            className="va-input"
            placeholder="Ask about your document…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          />
          <button
            className={`va-mic-btn${listening ? ' active' : ''}`}
            onClick={toggleListening}
            aria-label={listening ? 'Stop listening' : 'Start voice input'}
          >
            {listening ? <MicOff size={17} /> : <Mic size={17} />}
          </button>
          <button className="va-send-btn" onClick={() => sendMessage(input)} aria-label="Send">
            <Send size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}
