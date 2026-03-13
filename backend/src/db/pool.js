import { Pool, types } from 'pg'
import config from '../config/index.js'

// Parse DATE columns as raw strings (YYYY-MM-DD) instead of local Date objects
// to prevent timezone shifts when converting implicitly
types.setTypeParser(1082, (val) => val)

const pool = new Pool({
  connectionString: config.db.postgresUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client:', err.message)
})

export default pool
