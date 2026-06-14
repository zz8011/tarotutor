-- 阶段 2：学习会话 + 消息 + 学习记录（间隔重复）+ 日记 + 成就
CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL,
  mentor_id TEXT,
  phase TEXT DEFAULT 'perception',
  lesson_stage TEXT DEFAULT 'observe',
  orientation TEXT DEFAULT 'upright',
  reflection TEXT DEFAULT '',
  symbol_observation TEXT DEFAULT '',
  scenario_answer TEXT DEFAULT '',
  follow_up TEXT DEFAULT '',
  quiz_question TEXT DEFAULT '',
  quiz_options JSONB DEFAULT '[]',
  quiz_answer TEXT DEFAULT '',
  quiz_answers JSONB DEFAULT '{}',
  quiz_result JSONB,
  summary TEXT DEFAULT '',
  user_feeling TEXT,
  knowledge_unlocked BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON study_sessions(user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS session_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  phase TEXT,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON session_messages(session_id, ts);

CREATE TABLE IF NOT EXISTS study_records (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL,
  mentor_id TEXT,
  stage TEXT DEFAULT 'observe',
  orientation TEXT DEFAULT 'upright',
  reflection TEXT DEFAULT '',
  symbol_observation TEXT DEFAULT '',
  scenario_answer TEXT DEFAULT '',
  follow_up TEXT DEFAULT '',
  quiz_question TEXT DEFAULT '',
  quiz_options JSONB DEFAULT '[]',
  quiz_answer TEXT DEFAULT '',
  quiz_answers JSONB DEFAULT '{}',
  quiz_result JSONB,
  mastered BOOLEAN DEFAULT FALSE,
  review_count INTEGER DEFAULT 0,
  last_studied_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, card_id)
);
CREATE INDEX IF NOT EXISTS idx_records_review ON study_records(user_id, next_review_at) WHERE next_review_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS diary_entries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER,
  content TEXT NOT NULL,
  mood TEXT,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_diary_user ON diary_entries(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  name TEXT,
  description TEXT,
  icon TEXT,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);
