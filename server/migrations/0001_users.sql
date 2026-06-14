-- 阶段 1：用户 + 学习进度（骨架）
CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- gen_random_uuid
-- pgvector 在 DB 初始化时单独装（CREATE EXTENSION vector），这里不重复以防未装导致 migration 整体失败

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  nickname        TEXT,
  daily_study_target SMALLINT DEFAULT 3,
  card_deck       TEXT DEFAULT 'eastern',
  personality_type TEXT,
  primary_mentor  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS study_progress (
  user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_phase    TEXT DEFAULT 'perception',
  learned_cards    INTEGER[] DEFAULT '{}',
  streak           INTEGER DEFAULT 0,
  longest_streak   INTEGER DEFAULT 0,
  total_sessions   INTEGER DEFAULT 0,
  last_study_date  DATE,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
