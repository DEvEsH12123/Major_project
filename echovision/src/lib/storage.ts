// Local storage persistence for session history (no auth required)
import type { SessionRecord } from './supabase'

const STORAGE_KEY = 'echovision_sessions'

export function loadLocalSessions(): Partial<SessionRecord>[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveLocalSession(record: Partial<SessionRecord>) {
  const sessions = loadLocalSessions()
  const idx = sessions.findIndex(s => s.session_id === record.session_id)
  if (idx >= 0) {
    sessions[idx] = { ...sessions[idx], ...record }
  } else {
    sessions.unshift(record)
  }
  // Keep latest 50
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 50)))
}

export function removeLocalSession(sessionId: string) {
  const sessions = loadLocalSessions().filter(s => s.session_id !== sessionId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}
