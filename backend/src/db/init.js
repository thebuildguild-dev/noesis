import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pool from './pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.join(__dirname, 'migrations')

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT        PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

/**
 * Run all pending SQL migrations in order. Idempotent — safe to call on every startup.
 * Does not close the pool so the connection remains available for the server.
 */
async function initDatabase() {
  const client = await pool.connect()
  try {
    await ensureMigrationsTable(client)

    const { rows } = await client.query('SELECT filename FROM schema_migrations ORDER BY filename')
    const applied = new Set(rows.map((r) => r.filename))

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    let ran = 0
    for (const file of files) {
      if (applied.has(file)) {
        continue
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file])
        await client.query('COMMIT')
        console.log(`  [db] applied migration: ${file}`)
        ran++
      } catch (err) {
        await client.query('ROLLBACK')
        throw new Error(`Migration ${file} failed: ${err.message}`)
      }
    }

    if (ran === 0) {
      console.log('  [db] schema up to date')
    } else {
      console.log(`  [db] ${ran} migration(s) applied`)
    }
  } finally {
    client.release()
  }
}

export default initDatabase
