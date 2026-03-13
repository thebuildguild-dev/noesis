import { query } from '../../db/query.js'
import { success } from '../../utils/response.js'

async function getMessages(req, res, next) {
  try {
    const userId = req.user.id

    const { rows } = await query(
      `SELECT id, habit_id, message, escalation_level, created_at
       FROM agent_messages
       WHERE user_id = $1 AND seen = false
       ORDER BY created_at DESC`,
      [userId]
    )

    if (rows.length > 0) {
      const ids = rows.map((r) => r.id)
      await query(`UPDATE agent_messages SET seen = true WHERE id = ANY($1::uuid[])`, [ids])
    }

    success(res, { messages: rows }, 'Agent messages fetched')
  } catch (err) {
    next(err)
  }
}

export { getMessages }
