import { query } from '../../db/query.js'
import { cacheGet, cacheSet, cacheDelete, CacheKeys } from '../../utils/cache.js'
import { analyzeJournalEntry } from '../../services/ai.service.js'

async function createEntry(userId, content) {
  const { rows } = await query(
    `INSERT INTO journal_entries (user_id, content)
     VALUES ($1, $2)
     RETURNING id, content, sentiment, themes, created_at, updated_at`,
    [userId, content]
  )

  await cacheDelete(CacheKeys.journalList(userId))

  const entry = rows[0]

  analyzeJournalEntry(content)
    .then((analysis) => {
      if (analysis) {
        return updateJournalAnalysis(entry.id, analysis)
      }
    })
    .catch(() => {})

  return entry
}

async function updateJournalAnalysis(entryId, { sentiment, themes }) {
  await query(`UPDATE journal_entries SET sentiment = $1, themes = $2 WHERE id = $3`, [
    sentiment,
    JSON.stringify(themes),
    entryId
  ])
}

async function getEntries(userId, page = 1, limit = 20) {
  const safePage = Math.max(1, Math.floor(page))
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)))
  const offset = (safePage - 1) * safeLimit

  const cacheKey = CacheKeys.journalList(userId)

  const useCache = safePage === 1 && safeLimit === 20
  if (useCache) {
    const cached = await cacheGet(cacheKey)
    if (cached) return cached
  }

  const [{ rows: entries }, { rows: countRows }] = await Promise.all([
    query(
      `SELECT id, content, sentiment, themes, created_at, updated_at
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
     SET content = $1, sentiment = NULL, themes = NULL, updated_at = NOW()
     WHERE id = $2
     RETURNING id, content, sentiment, themes, created_at, updated_at`,
    [content, entryId]
  )

  await cacheDelete(CacheKeys.journalList(userId))

  const entry = rows[0]

  analyzeJournalEntry(content)
    .then((analysis) => {
      if (analysis) {
        return updateJournalAnalysis(entry.id, analysis)
      }
    })
    .catch(() => {})

  return entry
}

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

async function getEntriesForDate(userId, date) {
  const { rows } = await query(
    `SELECT id, content, sentiment, themes, created_at, updated_at
     FROM journal_entries
     WHERE user_id = $1
       AND DATE(created_at) = $2
     ORDER BY created_at DESC`,
    [userId, date]
  )
  return rows
}

async function getInsights(userId) {
  const { rows } = await query(
    `SELECT
       DATE(created_at)::text AS date,
       sentiment,
       themes
     FROM journal_entries
     WHERE user_id = $1
       AND created_at >= NOW() - INTERVAL '14 days'
       AND sentiment IS NOT NULL
     ORDER BY created_at DESC`,
    [userId]
  )

  const themeCounts = {}
  for (const row of rows) {
    if (Array.isArray(row.themes)) {
      for (const theme of row.themes) {
        themeCounts[theme] = (themeCounts[theme] ?? 0) + 1
      }
    }
  }

  return {
    entries: rows.map((r) => ({ date: r.date, sentiment: r.sentiment, themes: r.themes ?? [] })),
    themeCounts
  }
}

export { createEntry, getEntries, updateEntry, deleteEntry, getEntriesForDate, getInsights }
