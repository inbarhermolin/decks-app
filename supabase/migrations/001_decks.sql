-- ── Step 3: Decks system ─────────────────────────────────────────────────────
-- Run this in your Supabase SQL editor (https://supabase.com/dashboard → SQL Editor)

-- 1. Create decks table
CREATE TABLE IF NOT EXISTS decks (
  id         TEXT        PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own decks"
  ON decks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Add deck_id FK column to words
ALTER TABLE words
  ADD COLUMN IF NOT EXISTS deck_id TEXT REFERENCES decks(id) ON DELETE SET NULL;
