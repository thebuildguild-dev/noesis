-- Add proof_hash to habit_logs for anti-cheat duplicate detection.
-- SHA-256 hex digest of the uploaded image. UNIQUE across all users/habits.
ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS proof_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS habit_logs_proof_hash_idx ON habit_logs (proof_hash) WHERE proof_hash IS NOT NULL;
