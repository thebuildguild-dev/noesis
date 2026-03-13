import cors from 'cors'
import config from '../config/index.js'

const rawOrigins = process.env.CORS_ORIGINS || ''
const isDev = config.app.env !== 'production'

// In dev with no CORS_ORIGINS set → allow all origins
// In prod with CORS_ORIGINS=* → allow all origins
// In prod with CORS_ORIGINS=url1,url2 → whitelist
const allowAll = rawOrigins.trim() === '*' || (isDev && rawOrigins.trim() === '')

export const corsOrigins = allowAll
  ? '*'
  : rawOrigins
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)

const credentials = process.env.CORS_ALLOW_CREDENTIALS === 'true'
const methods = process.env.CORS_ALLOW_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE'
const allowedHeaders = process.env.CORS_ALLOW_HEADERS || '*'

const origin = allowAll
  ? '*'
  : (requestOrigin, callback) => {
      if (!requestOrigin || corsOrigins.includes(requestOrigin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS: origin '${requestOrigin}' is not allowed`))
      }
    }

const corsOptions = { origin, credentials, methods, allowedHeaders }

export default cors(corsOptions)
