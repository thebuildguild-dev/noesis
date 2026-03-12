-- 004_create_habit_logs.sql
CREATE TABLE IF NOT EXISTS habit_logs (
  id             UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id       UUID  NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed_date DATE  NOT NULL,
  UNIQUE(habit_id, completed_date)
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
