-- ── Step 5: Multi-sentence array per word ──────────────────────────────────────
-- Run this in your Supabase SQL editor (https://supabase.com/dashboard → SQL Editor)

ALTER TABLE words
  ADD COLUMN IF NOT EXISTS example_sentences JSONB;
