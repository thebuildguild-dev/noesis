import rateLimit from 'express-rate-limit'
import redis from '../utils/redis.js'
import config from '../config/index.js'

const KEY_PREFIX = 'rl:'

class RedisStore {
  constructor() {
    this.windowMs = null
    /** @type {Map<string, { hits: number; resetTime: Date }>} */
    this.memory = new Map()
  }

  init({ windowMs }) {
    this.windowMs = windowMs
  }

  async increment(key) {
    try {
      return await this._redisIncrement(key)
    } catch {
      return this._memIncrement(key)
    }
  }

  async decrement(key) {
    try {
      await redis.decr(KEY_PREFIX + key)
    } catch {
      const entry = this.memory.get(key)
      if (entry && entry.hits > 0) entry.hits--
    }
  }

  async resetKey(key) {
    try {
      await redis.del(KEY_PREFIX + key)
    } catch {
      // ignore
    }
    this.memory.delete(key)
  }

  async _redisIncrement(key) {
    const k = KEY_PREFIX + key
    const multi = redis.multi()
    multi.incr(k)
    multi.pttl(k)
    const [[, hits], [, ttlMs]] = await multi.exec()

    // Set expiry on first write (or if key has no TTL).
    if (ttlMs < 0) {
      await redis.pexpire(k, this.windowMs)
    }

    const remainingMs = ttlMs > 0 ? ttlMs : this.windowMs
    return {
      totalHits: hits,
      resetTime: new Date(Date.now() + remainingMs)
    }
  }

  _memIncrement(key) {
    const now = Date.now()
    let entry = this.memory.get(key)

    if (!entry || entry.resetTime.getTime() <= now) {
      entry = { hits: 0, resetTime: new Date(now + this.windowMs) }
      this.memory.set(key, entry)
    }

    entry.hits++
    return { totalHits: entry.hits, resetTime: entry.resetTime }
  }
}

const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore(),
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
})

export default rateLimiter
