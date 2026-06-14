CREATE TABLE IF NOT EXISTS mentor_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id TEXT NOT NULL,
  memory_text TEXT NOT NULL,
  embedding vector(2560) NOT NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mentor_mem_user ON mentor_memory(user_id, mentor_id, created_at DESC);
