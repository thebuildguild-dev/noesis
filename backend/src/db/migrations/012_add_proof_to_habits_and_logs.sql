-- 012_add_proof_to_habits_and_logs.sql

-- habits: flag for habits that require photo proof
ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS requires_proof BOOLEAN NOT NULL DEFAULT false;

-- habit_logs: proof image + AI verification result columns
ALTER TABLE habit_logs
  ADD COLUMN IF NOT EXISTS proof_image_url          TEXT,
  ADD COLUMN IF NOT EXISTS verification_status      TEXT CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_comment     TEXT,
  ADD COLUMN IF NOT EXISTS vision_description       TEXT,
  ADD COLUMN IF NOT EXISTS verification_confidence  FLOAT,
  ADD COLUMN IF NOT EXISTS verified_at              TIMESTAMPTZ;
