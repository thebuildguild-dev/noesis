import pool from './pool.js'

/**
 * Run a single parameterized query and return the result.
 *
 * @param {string} text   - SQL string with $1, $2 … placeholders
 * @param {Array}  params - Bound parameter values
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  return pool.query(text, params)
}

/**
 * Run multiple queries inside a single transaction.
 * Automatically rolls back on any error.
 *
 * @param {(client: import('pg').PoolClient) => Promise<*>} fn
 * @returns {Promise<*>}
 */
async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export { query, withTransaction }
