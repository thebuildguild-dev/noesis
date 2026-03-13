import config from './config/index.js'
import app from './app.js'
import { corsOrigins } from './middlewares/cors.middleware.js'
import initDatabase from './db/init.js'
import { seedDemoUser } from './db/seed.js'
import { startAuditorJob } from './jobs/auditor.job.js'

const { port, name, env } = config.app

async function start() {
  console.log(`[startup] initialising database...`)
  await initDatabase()

  console.log(`[startup] seeding demo data...`)
  await seedDemoUser()

  app.listen(port, () => {
    const origins = Array.isArray(corsOrigins) ? corsOrigins.join(', ') : corsOrigins
    console.log(`${name} server running on port ${port} [${env}]`)
    console.log(`CORS allowed origins: ${origins}`)
    startAuditorJob()
  })
}

start().catch((err) => {
  console.error('[startup] fatal error:', err.message)
  process.exit(1)
})
