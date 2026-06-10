-- ── Step 4: Verb tense fields ─────────────────────────────────────────────────
-- Run this in your Supabase SQL editor (https://supabase.com/dashboard → SQL Editor)

ALTER TABLE words
  ADD COLUMN IF NOT EXISTS present_tense TEXT,
  ADD COLUMN IF NOT EXISTS past_tense    TEXT;
