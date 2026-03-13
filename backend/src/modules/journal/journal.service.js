import { query } from '../../db/query.js'
import { cacheGet, cacheSet, cacheDelete, CacheKeys } from '../../utils/cache.js'

/**
 * Create a new journal entry.
 * Returns the created row.
 */
async function createEntry(userId, content) {
  const { rows } = await query(
    `INSERT INTO journal_entries (user_id, content)
     VALUES ($1, $2)
     RETURNING id, content, created_at, updated_at`,
    [userId, content]
  )

  await cacheDelete(CacheKeys.journalList(userId))
  return rows[0]
}

/**
 * List journal entries for the user, newest first, with pagination.
 * Results are cached per user (invalidated on any write).
 *
 * @param {string} userId
 * @param {number} page   1-based page number
 * @param {number} limit  Entries per page (max 100)
 */
async function getEntries(userId, page = 1, limit = 20) {
  const safePage = Math.max(1, Math.floor(page))
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)))
  const offset = (safePage - 1) * safeLimit

  const cacheKey = CacheKeys.journalList(userId)

  // Only cache the first page with the default limit to keep cache simple.
  const useCache = safePage === 1 && safeLimit === 20
  if (useCache) {
    const cached = await cacheGet(cacheKey)
    if (cached) return cached
  }

  const [{ rows: entries }, { rows: countRows }] = await Promise.all([
    query(
      `SELECT id, content, created_at, updated_at
       FROM journal_entries
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, safeLimit, offset]
    ),
    query('SELECT COUNT(*)::int AS total FROM journal_entries WHERE user_id = $1', [userId])
  ])

  const result = {
    entries,
    pagination: {
      total: countRows[0].total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(countRows[0].total / safeLimit)
    }
  }

  if (useCache) {
    await cacheSet(cacheKey, result, CacheKeys.JOURNAL_LIST_TTL)
  }

  return result
}

/**
 * Update the content of a journal entry.
 * Throws 404 if the entry does not exist, 403 if it belongs to another user.
 */
async function updateEntry(userId, entryId, content) {
  const { rows: existing } = await query('SELECT user_id FROM journal_entries WHERE id = $1', [
    entryId
  ])
  if (existing.length === 0) {
    const err = new Error('Journal entry not found')
    err.status = 404
    throw err
  }
  if (existing[0].user_id !== userId) {
    const err = new Error('Access forbidden')
    err.status = 403
    throw err
  }

  const { rows } = await query(
    `UPDATE journal_entries
     SET content = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, content, created_at, updated_at`,
    [content, entryId]
  )

  await cacheDelete(CacheKeys.journalList(userId))
  return rows[0]
}

/**
 * Delete a journal entry owned by the user.
 * Throws 404 if the entry does not exist, 403 if it belongs to another user.
 */
async function deleteEntry(userId, entryId) {
  const { rows: existing } = await query('SELECT user_id FROM journal_entries WHERE id = $1', [
    entryId
  ])
  if (existing.length === 0) {
    const err = new Error('Journal entry not found')
    err.status = 404
    throw err
  }
  if (existing[0].user_id !== userId) {
    const err = new Error('Access forbidden')
    err.status = 403
    throw err
  }

  await query('DELETE FROM journal_entries WHERE id = $1', [entryId])
  await cacheDelete(CacheKeys.journalList(userId))
}

export { createEntry, getEntries, updateEntry, deleteEntry, getEntriesForDate }

/**
 * Return journal entries created on a specific calendar date.
 *
 * @param {string} userId
 * @param {string} date  YYYY-MM-DD
 */
async function getEntriesForDate(userId, date) {
  const { rows } = await query(
    `SELECT id, content, created_at, updated_at
     FROM journal_entries
     WHERE user_id = $1
       AND DATE(created_at) = $2
     ORDER BY created_at DESC`,
    [userId, date]
  )
  return rows
}
