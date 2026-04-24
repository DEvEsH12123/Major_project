const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export async function uploadDocument(file: File): Promise<{ session_id: string; message: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/process`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getStatus(sessionId: string) {
  const res = await fetch(`${API_BASE}/status/${sessionId}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<{
    session_id: string
    status: 'processing' | 'done' | 'error'
    error: string | null
    blocks_ready: number
  }>
}

export async function getBlocks(sessionId: string) {
  const res = await fetch(`${API_BASE}/blocks/${sessionId}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<{
    session_id: string
    status: string
    blocks: Array<{ index: number; type: string; content: string; has_audio: boolean }>
  }>
}

export function audioUrl(sessionId: string, blockIndex: number) {
  return `${API_BASE}/audio/${sessionId}/${blockIndex}`
}

export function exportUrl(sessionId: string) {
  return `${API_BASE}/export/${sessionId}`
}

export async function deleteSession(sessionId: string) {
  await fetch(`${API_BASE}/session/${sessionId}`, { method: 'DELETE' })
}

export async function healthCheck() {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) return null
  return res.json() as Promise<{ status: string; captioner_loaded: boolean }>
}
