-- ── Step 4: Gamification — User Stats + Daily Goal setting ───────────────────
-- Run this in your Supabase SQL editor (https://supabase.com/dashboard → SQL Editor)

-- 1. User stats table (XP, streak, daily words)
CREATE TABLE IF NOT EXISTS user_stats (
  user_id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp          INT         NOT NULL DEFAULT 0,
  streak            INT         NOT NULL DEFAULT 0,
  last_practice_date DATE,
  today_words_count INT         NOT NULL DEFAULT 0,
  today_date        DATE
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own stats"
  ON user_stats FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Add daily_goal column to the existing settings table
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS daily_goal INT NOT NULL DEFAULT 15;
