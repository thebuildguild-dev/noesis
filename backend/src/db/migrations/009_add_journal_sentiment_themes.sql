-- 009_add_journal_sentiment_themes.sql
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS sentiment TEXT,
  ADD COLUMN IF NOT EXISTS themes    JSONB;
