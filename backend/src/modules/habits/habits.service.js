import { query } from '../../db/query.js'
import { cacheGet, cacheSet, cacheDelete, CacheKeys } from '../../utils/cache.js'
import { getHabitStreak, getAllStreaks } from '../streak/streak.service.js'

/** YYYY-MM-DD string for today in server-local date. */
function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

/** Validate a YYYY-MM-DD date string. */
function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str))
}

/**
 * Create a new habit for the user.
 * Returns the created row.
 */
async function createHabit(userId, title) {
  const { rows } = await query(
    `INSERT INTO habits (user_id, title)
     VALUES ($1, $2)
     RETURNING id, title, created_at`,
    [userId, title]
  )
  await cacheDelete(CacheKeys.streakAll(userId))
  await cacheDelete(CacheKeys.dashboard(userId))
  return rows[0]
}

/**
 * List all habits for the user, annotated with whether each was completed today.
 * Result is cached for STREAK_ALL_TTL seconds.
 */
async function getHabits(userId) {
  const cacheKey = CacheKeys.streakAll(userId)
  const cached = await cacheGet(cacheKey)
  if (cached) return cached

  const { rows } = await query(
    `SELECT
       h.id,
       h.title,
       h.created_at,
       CASE WHEN hl.id IS NOT NULL THEN true ELSE false END AS completed_today
     FROM habits h
     LEFT JOIN habit_logs hl
       ON hl.habit_id = h.id
       AND hl.completed_date = CURRENT_DATE
     WHERE h.user_id = $1
     ORDER BY h.created_at ASC`,
    [userId]
  )

  await cacheSet(cacheKey, rows, CacheKeys.STREAK_ALL_TTL)
  return rows
}

/**
 * Delete a habit owned by the user.
 * Throws 404 if the habit does not exist, 403 if it belongs to another user.
 */
async function deleteHabit(userId, habitId) {
  const { rows: existing } = await query('SELECT user_id FROM habits WHERE id = $1', [habitId])
  if (existing.length === 0) {
    const err = new Error('Habit not found')
    err.status = 404
    throw err
  }
  if (existing[0].user_id !== userId) {
    const err = new Error('Access forbidden')
    err.status = 403
    throw err
  }

  await query('DELETE FROM habits WHERE id = $1', [habitId])
  await cacheDelete(CacheKeys.streakAll(userId))
  await cacheDelete(CacheKeys.streak(userId, habitId))
  await cacheDelete(CacheKeys.dashboard(userId))
}

/**
 * Mark a habit as complete for a given date (defaults to today).
 * Returns { log, alreadyCompleted }.
 */
async function completeHabit(userId, habitId, date) {
  const completedDate = date || todayStr()

  if (!isValidDate(completedDate)) {
    const err = new Error('Invalid date format — use YYYY-MM-DD')
    err.status = 400
    throw err
  }

  const { rows: habitRows } = await query('SELECT user_id FROM habits WHERE id = $1', [habitId])
  if (habitRows.length === 0) {
    const err = new Error('Habit not found')
    err.status = 404
    throw err
  }
  if (habitRows[0].user_id !== userId) {
    const err = new Error('Access forbidden')
    err.status = 403
    throw err
  }

  const { rows, rowCount } = await query(
    `INSERT INTO habit_logs (habit_id, completed_date)
     VALUES ($1, $2)
     ON CONFLICT (habit_id, completed_date) DO NOTHING
     RETURNING id, habit_id, completed_date`,
    [habitId, completedDate]
  )

  await cacheDelete(CacheKeys.streak(userId, habitId))
  await cacheDelete(CacheKeys.streakAll(userId))
  await cacheDelete(CacheKeys.dashboard(userId))

  if (rowCount === 0) {
    return { alreadyCompleted: true, log: null }
  }
  return { alreadyCompleted: false, log: rows[0] }
}

/**
 * Return per-day habit completion counts.
 * Accepts optional from/to date strings (YYYY-MM-DD); defaults to last 30 days.
 *
 * @param {string} userId
 * @param {string} [from] ISO date string
 * @param {string} [to]   ISO date string
 * @returns {Promise<Array<{ date: string, count: number }>>}
 */
async function getActivity(userId, from, to) {
  const fromDate = from && isValidDate(from) ? from : null
  const toDate = to && isValidDate(to) ? to : null

  const { rows } = fromDate
    ? await query(
        `SELECT hl.completed_date AS date, COUNT(*) AS count
         FROM habit_logs hl
         JOIN habits h ON hl.habit_id = h.id
         WHERE h.user_id = $1
           AND hl.completed_date >= $2
           AND hl.completed_date <= $3
         GROUP BY hl.completed_date
         ORDER BY hl.completed_date ASC`,
        [userId, fromDate, toDate ?? new Date().toISOString().slice(0, 10)]
      )
    : await query(
        `SELECT hl.completed_date AS date, COUNT(*) AS count
         FROM habit_logs hl
         JOIN habits h ON hl.habit_id = h.id
         WHERE h.user_id = $1
           AND hl.completed_date >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY hl.completed_date
         ORDER BY hl.completed_date ASC`,
        [userId]
      )

  return rows.map((r) => ({ date: String(r.date).slice(0, 10), count: Number(r.count) }))
}

/**
 * Return all habits for a user, annotated with whether each was completed on a specific date.
 * Used by the history calendar day-detail panel.
 *
 * @param {string} userId
 * @param {string} date  YYYY-MM-DD
 * @returns {Promise<Array<{ id, title, created_at, completed_on_date }>>}
 */
async function getHabitsForDate(userId, date) {
  if (!isValidDate(date)) {
    const err = new Error('Invalid date format — use YYYY-MM-DD')
    err.status = 400
    throw err
  }
  const { rows } = await query(
    `SELECT
       h.id,
       h.title,
       h.created_at,
       CASE WHEN hl.id IS NOT NULL THEN true ELSE false END AS completed_on_date
     FROM habits h
     LEFT JOIN habit_logs hl
       ON hl.habit_id = h.id
       AND hl.completed_date = $2
     WHERE h.user_id = $1
     ORDER BY h.created_at ASC`,
    [userId, date]
  )
  return rows
}

/**
 * Return completion dates for a specific habit (last 90 days), sorted newest-first.
 * Ownership is verified.
 *
 * @param {string} userId
 * @param {string} habitId
 * @returns {Promise<string[]>} YYYY-MM-DD strings
 */
async function getHabitLogs(userId, habitId) {
  const { rows: habitRows } = await query('SELECT user_id FROM habits WHERE id = $1', [habitId])
  if (habitRows.length === 0) {
    const err = new Error('Habit not found')
    err.status = 404
    throw err
  }
  if (habitRows[0].user_id !== userId) {
    const err = new Error('Access forbidden')
    err.status = 403
    throw err
  }

  const { rows } = await query(
    `SELECT completed_date
     FROM habit_logs
     WHERE habit_id = $1
       AND completed_date >= CURRENT_DATE - INTERVAL '90 days'
     ORDER BY completed_date DESC`,
    [habitId]
  )
  return rows.map((r) => String(r.completed_date).slice(0, 10))
}

export {
  createHabit,
  getHabits,
  deleteHabit,
  completeHabit,
  getActivity,
  getHabitsForDate,
  getHabitLogs
}
export { getHabitStreak as getStreak, getAllStreaks }
