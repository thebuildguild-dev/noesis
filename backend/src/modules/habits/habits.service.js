import { createReadStream } from 'fs'
import { unlink } from 'fs/promises'
import { createHash } from 'crypto'
import { query } from '../../db/query.js'
import { cacheGet, cacheSet, cacheDelete, CacheKeys } from '../../utils/cache.js'
import { getHabitStreak, getAllStreaks } from '../streak/streak.service.js'
import { verifyProof } from '../../agents/proof_verifier.agent.js'

/** Compute SHA-256 hex digest of a file on disk. */
function computeFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}

/** YYYY-MM-DD string for today in server-local date. */
function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

/** Safely format a pg DATE/TIMESTAMP (Date object or raw string) to YYYY-MM-DD. */
const toDateStr = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10))

/** Validate a YYYY-MM-DD date string. */
function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str))
}

/**
 * Create a new habit for the user.
 * Returns the created row.
 */
async function createHabit(userId, title, requiresProof = false) {
  const { rows } = await query(
    `INSERT INTO habits (user_id, title, requires_proof)
     VALUES ($1, $2, $3)
     RETURNING id, title, requires_proof, created_at`,
    [userId, title, requiresProof]
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
       h.requires_proof,
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
           AND hl.completed_date >= CURRENT_DATE - INTERVAL '90 days'
         GROUP BY hl.completed_date
         ORDER BY hl.completed_date ASC`,
        [userId]
      )

  return rows.map((r) => ({ date: toDateStr(r.date), count: Number(r.count) }))
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
 * Also returns the habit's createdAt so the frontend can skip days before creation.
 * Ownership is verified.
 *
 * @param {string} userId
 * @param {string} habitId
 * @returns {Promise<{ dates: string[], createdAt: string }>}
 */
async function getHabitLogs(userId, habitId) {
  const { rows: habitRows } = await query('SELECT user_id, created_at FROM habits WHERE id = $1', [
    habitId
  ])
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
  return {
    dates: rows.map((r) => toDateStr(r.completed_date)),
    createdAt: toDateStr(habitRows[0].created_at)
  }
}

/**
 * Submit a proof image for a habit and run synchronous AI verification.
 * Creates or updates today's habit_log with the proof and verification result.
 *
 * @param {string} userId
 * @param {string} habitId
 * @param {string} imagePath  Absolute path to the uploaded image file
 * @param {string} imageUrl   Public URL path to serve the image
 * @returns {Promise<object>} AI verification result + log
 */
async function submitProof(userId, habitId, imagePath, imageUrl) {
  const { rows: habitRows } = await query('SELECT user_id, title FROM habits WHERE id = $1', [
    habitId
  ])
  if (habitRows.length === 0) {
    await unlink(imagePath).catch(() => {})
    const err = new Error('Habit not found')
    err.status = 404
    throw err
  }
  if (habitRows[0].user_id !== userId) {
    await unlink(imagePath).catch(() => {})
    const err = new Error('Access forbidden')
    err.status = 403
    throw err
  }

  const hash = await computeFileHash(imagePath)

  const { rows: dupRows } = await query(
    `SELECT hl.id, h.user_id = $1 AS is_same_user
     FROM habit_logs hl
     JOIN habits h ON h.id = hl.habit_id
     WHERE hl.proof_hash = $2
     LIMIT 1`,
    [userId, hash]
  )
  if (dupRows.length > 0) {
    await unlink(imagePath).catch(() => {})
    const msg = dupRows[0].is_same_user
      ? 'You have already submitted this image as proof'
      : 'This image has already been used as proof by another user'
    const err = new Error(msg)
    err.status = 409
    throw err
  }

  const today = todayStr()

  const { rows } = await query(
    `INSERT INTO habit_logs (habit_id, completed_date, proof_image_url, proof_hash, verification_status)
     VALUES ($1, $2, $3, $4, 'pending')
     ON CONFLICT (habit_id, completed_date) DO UPDATE SET
       proof_image_url      = EXCLUDED.proof_image_url,
       proof_hash           = EXCLUDED.proof_hash,
       verification_status  = 'pending'
     RETURNING id`,
    [habitId, today, imageUrl, hash]
  )

  const logId = rows[0].id
  const result = await verifyProof({
    logId,
    userId,
    habitId,
    habitTitle: habitRows[0].title,
    imagePath
  })

  return result
}

/**
 * Return proof attempts for a habit (logs that have proof_image_url set), newest first.
 * Verifies ownership before returning.
 *
 * @param {string} userId
 * @param {string} habitId
 * @returns {Promise<Array>}
 */
async function getProofHistory(userId, habitId) {
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
    `SELECT
       id,
       completed_date,
       proof_image_url,
       verification_status,
       verification_comment,
       vision_description,
       verification_confidence,
       verified_at
     FROM habit_logs
     WHERE habit_id = $1
       AND proof_image_url IS NOT NULL
     ORDER BY completed_date DESC
     LIMIT 30`,
    [habitId]
  )

  return rows.map((r) => ({
    ...r,
    completed_date: toDateStr(r.completed_date)
  }))
}

export {
  createHabit,
  getHabits,
  deleteHabit,
  completeHabit,
  getActivity,
  getHabitsForDate,
  getHabitLogs,
  submitProof,
  getProofHistory
}
export { getHabitStreak as getStreak, getAllStreaks }
