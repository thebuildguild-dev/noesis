CREATE TABLE IF NOT EXISTS agent_memory (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id         UUID        NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  message_count    INTEGER     NOT NULL DEFAULT 0,
  last_sent_at     TIMESTAMPTZ,
  escalation_level INTEGER     NOT NULL DEFAULT 1,
  UNIQUE (user_id, habit_id)
);
