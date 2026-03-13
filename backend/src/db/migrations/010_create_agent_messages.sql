CREATE TABLE IF NOT EXISTS agent_messages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id         UUID        REFERENCES habits(id) ON DELETE SET NULL,
  message          TEXT        NOT NULL,
  escalation_level INTEGER     NOT NULL DEFAULT 1,
  seen             BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
