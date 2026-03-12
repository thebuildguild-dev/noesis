import redis from './redis.js'

/**
 * Retrieve a cached value.
 *
 * @param {string} key
 * @returns {Promise<*|null>}  Parsed value, or null on miss / Redis error.
 */
async function cacheGet(key) {
  try {
    const raw = await redis.get(key)
    if (raw === null) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Store a value in cache with an optional TTL.
 *
 * @param {string} key
 * @param {*}      value  Will be JSON-serialised.
 * @param {number} [ttl]  Seconds until expiry. Omit for no expiry.
 * @returns {Promise<boolean>}  true on success, false on Redis error.
 */
async function cacheSet(key, value, ttl) {
  try {
    const serialised = JSON.stringify(value)
    if (ttl) {
      await redis.set(key, serialised, 'EX', ttl)
    } else {
      await redis.set(key, serialised)
    }
    return true
  } catch {
    return false
  }
}

/**
 * Remove a key from cache.
 *
 * @param {string} key
 * @returns {Promise<boolean>}  true on success, false on Redis error.
 */
async function cacheDelete(key) {
  try {
    await redis.del(key)
    return true
  } catch {
    return false
  }
}

/** Centralized cache key builders and TTL constants. */
const CacheKeys = {
  /** Current streak length for a single habit. TTL: 1 hour. */
  streak: (userId, habitId) => `streak:${userId}:${habitId}`,
  STREAK_TTL: 3_600,

  /** All streaks aggregated for a user. TTL: 1 hour. */
  streakAll: (userId) => `streak:${userId}:all`,
  STREAK_ALL_TTL: 3_600,

  /** Dashboard summary for a user. TTL: 5 minutes. */
  dashboard: (userId) => `dashboard:${userId}`,
  DASHBOARD_TTL: 300,

  /** Journal entry list for a user. TTL: 2 minutes. */
  journalList: (userId) => `journal:${userId}:list`,
  JOURNAL_LIST_TTL: 120
}

export { cacheGet, cacheSet, cacheDelete, CacheKeys }
