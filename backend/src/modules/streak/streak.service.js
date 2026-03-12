import { query } from '../../db/query.js'
import { cacheGet, cacheSet, CacheKeys } from '../../utils/cache.js'

/**
 * Convert a Date or YYYY-MM-DD string to a YYYY-MM-DD string (UTC-safe).
 * @param {Date|string} d
 * @returns {string}
 */
function toDateStr(d) {
  if (d instanceof Date) {
    // Normalize Postgres DATE values using UTC components.
    const yyyy = d.getUTCFullYear()
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(d.getUTCDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }
  return d
}

/**
 * Return YYYY-MM-DD for today and yesterday in UTC.
 */
function todayAndYesterday() {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  const today = `${y}-${m}-${d}`

  const prev = new Date(Date.UTC(y, now.getUTCMonth(), now.getUTCDate() - 1))
  const yy = prev.getUTCFullYear()
  const ym = String(prev.getUTCMonth() + 1).padStart(2, '0')
  const yd = String(prev.getUTCDate()).padStart(2, '0')
  const yesterday = `${yy}-${ym}-${yd}`

  return { today, yesterday }
}

/**
 * Return the previous YYYY-MM-DD string by one calendar day (UTC-safe).
 * @param {string} dateStr
 * @returns {string}
 */
function prevDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d - 1))
  return toDateStr(dt)
}

/**
 * Calendar days between two YYYY-MM-DD strings.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function dayDiff(a, b) {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const msA = Date.UTC(ay, am - 1, ad)
  const msB = Date.UTC(by, bm - 1, bd)
  return Math.round((msB - msA) / 86_400_000)
}

/**
 * Compute current and longest streaks from a list of completion dates.
 * Current streak counts consecutive days ending today or yesterday; 0 if 2+ days ago.
 *
 * @param {Array<Date|string>} rawDates
 * @returns {{ currentStreak: number, longestStreak: number }}
 */
function computeStreaks(rawDates) {
  if (!rawDates || rawDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  const unique = [...new Set(rawDates.map(toDateStr))].sort()

  let longestStreak = 1
  let run = 1

  for (let i = 1; i < unique.length; i++) {
    if (dayDiff(unique[i - 1], unique[i]) === 1) {
      run++
      if (run > longestStreak) longestStreak = run
    } else {
      run = 1
    }
  }

  const { today, yesterday } = todayAndYesterday()
  const latest = unique[unique.length - 1]

  let currentStreak = 0

  if (latest === today || latest === yesterday) {
    let cursor = latest
    for (let i = unique.length - 1; i >= 0; i--) {
      if (unique[i] === cursor) {
        currentStreak++
        cursor = prevDay(cursor)
      } else {
        break
      }
    }
  }

  return { currentStreak, longestStreak }
}

/**
 * Return streak stats for a single habit.
 * Verifies ownership and throws 404 if the habit does not belong to the user.
 *
 * @param {string} userId
 * @param {string} habitId
 * @returns {Promise<{
 *   habitId: string,
 *   currentStreak: number,
 *   longestStreak: number,
 *   totalCompletions: number,
 *   lastCompletedDate: string|null
 * }>}
 */
async function getHabitStreak(userId, habitId) {
  const cacheKey = CacheKeys.streak(userId, habitId)
  const cached = await cacheGet(cacheKey)
  if (cached) return cached

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
     ORDER BY completed_date ASC`,
    [habitId]
  )

  const dates = rows.map((r) => r.completed_date)
  const { currentStreak, longestStreak } = computeStreaks(dates)
  const lastCompletedDate = dates.length > 0 ? toDateStr(dates[dates.length - 1]) : null

  const result = {
    habitId,
    currentStreak,
    longestStreak,
    totalCompletions: dates.length,
    lastCompletedDate
  }

  await cacheSet(cacheKey, result, CacheKeys.STREAK_TTL)
  return result
}

export { computeStreaks, getHabitStreak }
