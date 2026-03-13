import 'dotenv/config'

const required = [
  'APP_NAME',
  'NODE_ENV',
  'POSTGRES_URL',
  'REDIS_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'ACCESS_TOKEN_EXPIRY',
  'REFRESH_TOKEN_EXPIRY',
  'RATE_LIMIT_WINDOW',
  'RATE_LIMIT_MAX',
  'RESEND_API_KEY',
  'RESEND_EMAIL_FROM',
  'APP_BASE_URL',
  'DEMO_USER_EMAIL',
  'DEMO_USER_PASSWORD',
  'HF_API_KEY',
  'HF_MODEL',
  'HF_SENTIMENT_MODEL'
]

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

const config = {
  app: {
    name: process.env.APP_NAME,
    env: process.env.NODE_ENV,
    port: 8000,
    baseUrl: process.env.APP_BASE_URL
  },
  db: {
    postgresUrl: process.env.POSTGRES_URL,
    redisUrl: process.env.REDIS_URL
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.ACCESS_TOKEN_EXPIRY,
    refreshExpiry: process.env.REFRESH_TOKEN_EXPIRY
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10),
    max: parseInt(process.env.RATE_LIMIT_MAX, 10)
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    emailFrom: process.env.RESEND_EMAIL_FROM
  },
  demoUser: {
    email: process.env.DEMO_USER_EMAIL,
    password: process.env.DEMO_USER_PASSWORD
  },
  hf: {
    apiKey: process.env.HF_API_KEY,
    model: process.env.HF_MODEL,
    sentimentModel: process.env.HF_SENTIMENT_MODEL
  }
}

export default config
