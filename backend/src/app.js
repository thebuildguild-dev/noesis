import express from 'express'
import { apiReference } from '@scalar/express-api-reference'
import corsMiddleware from './middlewares/cors.middleware.js'
import rateLimiter from './middlewares/rate.limiter.js'
import errorHandler from './middlewares/error.handler.js'
import openApiSpec from './docs/openapi.js'
import healthRouter from './system/health.routes.js'
import authRouter from './modules/auth/index.js'
import habitsRouter from './modules/habits/index.js'
import journalRouter from './modules/journal/index.js'
import agentRouter from './modules/agent/agent.routes.js'

const app = express()

app.set('trust proxy', 1)

app.use(corsMiddleware)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/docs', apiReference({ spec: { content: openApiSpec } }))

// Rate limiting
app.use(rateLimiter)

app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/habits', habitsRouter)
app.use('/api/journal', journalRouter)
app.use('/api/agent', agentRouter)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' })
})

// Global error handler
app.use(errorHandler)

export default app
