import { query } from '../db/query.js'

async function getBrokenStreakHabits() {
  const { rows } = await query(
    `SELECT
       h.id          AS habit_id,
       h.user_id,
       h.title       AS habit_title,
       u.email       AS user_email,
       (CURRENT_DATE - COALESCE(MAX(hl.completed_date), h.created_at::date)) AS days_missed
     FROM habits h
     JOIN users u ON u.id = h.user_id
     LEFT JOIN habit_logs hl ON hl.habit_id = h.id
     GROUP BY h.id, h.user_id, h.title, h.created_at, u.email
     HAVING (CURRENT_DATE - COALESCE(MAX(hl.completed_date), h.created_at::date)) >= 2`
  )
  return rows
}

async function getRecentJournalEntries(userId, limit = 5) {
  const { rows } = await query(
    `SELECT content
     FROM journal_entries
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  )
  return rows.map((r) => r.content)
}

export { getBrokenStreakHabits, getRecentJournalEntries }
