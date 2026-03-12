import { Pool } from 'pg'
import config from '../config/index.js'

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
