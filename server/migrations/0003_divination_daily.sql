CREATE TABLE IF NOT EXISTS divinations (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spread_type TEXT,
  template_id TEXT,
  cards JSONB DEFAULT '[]',
  positions JSONB,
  question TEXT,
  interpretation TEXT,
  card_deck TEXT,
  date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_div_user ON divinations(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS daily_cards (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  card_id INTEGER NOT NULL,
  orientation TEXT,
  deck TEXT,
  guidance TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date)
);
