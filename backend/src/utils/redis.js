import Redis from 'ioredis'
import config from '../config/index.js'

// Configured to fail fast (no offline queue) so Redis errors don't block the app.
const redis = new Redis(config.db.redisUrl, {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  connectTimeout: 3_000,
  retryStrategy(times) {
    const delay = Math.min(times * 150, 3_000)
    return delay
  },
  reconnectOnError() {
    return true
  }
})

redis.on('connect', () => {
  console.log('Redis connected')
})

redis.on('ready', () => {
  console.log('Redis ready')
})

redis.on('error', (err) => {
  // Log but never throw — Redis errors must not crash the process.
  console.error('Redis error:', err.message)
})

redis.on('close', () => {
  console.warn('Redis connection closed')
})

redis.on('reconnecting', () => {
  console.warn('Redis reconnecting…')
})

export default redis
