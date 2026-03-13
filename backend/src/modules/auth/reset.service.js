import { withTransaction } from '../../db/query.js'
import { seedDemoDataForUser } from '../../db/seed.js'
import { cacheDelete, CacheKeys } from '../../utils/cache.js'

/**
 * Reset a user's data.
 * - demo role: clear all habits (cascades logs) + journal entries, then re-seed with 5 random
 *   habits + random 14-day logs + 14 random journal entries.
 * - user role: delete all habits (cascades logs) + journal entries.
 * @param {string} userId
 * @param {string} role  'user' | 'demo'
 */
async function resetAccount(userId, role) {
  await withTransaction(async (client) => {
    await client.query('DELETE FROM habits WHERE user_id = $1', [userId])
    await client.query('DELETE FROM journal_entries WHERE user_id = $1', [userId])

    if (role === 'demo') {
      await seedDemoDataForUser(client, userId)
    }
  })

  // Bust all relevant caches for this user.
  await Promise.all([
    cacheDelete(CacheKeys.streakAll(userId)),
    cacheDelete(CacheKeys.dashboard(userId)),
    cacheDelete(CacheKeys.journalList(userId))
  ])
}

export { resetAccount }
