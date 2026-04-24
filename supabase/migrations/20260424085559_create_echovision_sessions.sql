/*
  # EchoVision Sessions Table

  1. New Tables
    - `ev_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users — nullable for anonymous use)
      - `session_id` (text) — the backend session ID returned from /process
      - `file_name` (text) — original uploaded filename
      - `file_size` (bigint) — file size in bytes
      - `status` (text) — processing | done | error
      - `error_message` (text, nullable)
      - `blocks_count` (int) — number of processed blocks
      - `audio_url` (text, nullable) — cached export URL if available
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `ev_sessions`
    - Policy: anonymous users can insert and read their own rows (via session cookie / anon key)
    - Since auth is not required, we use a permissive policy scoped to anon role
*/

CREATE TABLE IF NOT EXISTS ev_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id   text NOT NULL,
  file_name    text NOT NULL DEFAULT '',
  file_size    bigint NOT NULL DEFAULT 0,
  status       text NOT NULL DEFAULT 'processing',
  error_message text,
  blocks_count int NOT NULL DEFAULT 0,
  audio_url    text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ev_sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their own rows
CREATE POLICY "Authenticated users can insert own sessions"
  ON ev_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can select own sessions"
  ON ev_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own sessions"
  ON ev_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own sessions"
  ON ev_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow anon users to insert with null user_id (for unauthenticated use)
CREATE POLICY "Anon users can insert sessions without user_id"
  ON ev_sessions FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Anon users cannot read back sessions (no persistent identity)
-- They track state in localStorage instead

CREATE INDEX IF NOT EXISTS idx_ev_sessions_user_id ON ev_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ev_sessions_session_id ON ev_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_ev_sessions_created_at ON ev_sessions(created_at DESC);
