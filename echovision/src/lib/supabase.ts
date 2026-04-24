import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type SessionRecord = {
  id: string
  user_id: string | null
  session_id: string
  file_name: string
  file_size: number
  status: 'processing' | 'done' | 'error'
  error_message: string | null
  blocks_count: number
  audio_url: string | null
  created_at: string
  updated_at: string
}
