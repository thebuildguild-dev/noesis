import cron from 'node-cron'
import { audit } from '../agents/auditor.agent.js'
import config from '../config/index.js'

const isProd = config.app.env === 'production'
const cronSchedule = isProd ? '*/10 * * * *' : '*/1 * * * *'
const scheduleLabel = isProd ? 'every 10 minutes' : 'every 1 minute'

function startAuditorJob() {
  cron.schedule(cronSchedule, async () => {
    console.log('[auditor-job] running streak audit...')
    try {
      await audit()
    } catch (err) {
      console.error('[auditor-job] error:', err.message)
    }
  })
  console.log(`[auditor-job] scheduled — ${scheduleLabel}`)
}

export { startAuditorJob }
