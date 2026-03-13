import { query } from '../db/query.js'

async function getMemory(userId, habitId) {
  const { rows } = await query(
    `SELECT id, message_count, last_sent_at, escalation_level
     FROM agent_memory
     WHERE user_id = $1 AND habit_id = $2`,
    [userId, habitId]
  )
  return rows[0] ?? null
}

async function upsertMemory(userId, habitId, escalationLevel) {
  await query(
    `INSERT INTO agent_memory (user_id, habit_id, message_count, last_sent_at, escalation_level)
     VALUES ($1, $2, 1, NOW(), $3)
     ON CONFLICT (user_id, habit_id)
     DO UPDATE SET
       message_count    = agent_memory.message_count + 1,
       last_sent_at     = NOW(),
       escalation_level = $3`,
    [userId, habitId, escalationLevel]
  )
}

export { getMemory, upsertMemory }
