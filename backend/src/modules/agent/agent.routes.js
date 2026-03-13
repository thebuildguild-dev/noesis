import { Router } from 'express'
import authMiddleware from '../../middlewares/auth.middleware.js'
import { getMessages, triggerAudit } from './agent.controller.js'

const router = Router()

router.get('/messages', authMiddleware, getMessages)
router.post('/trigger', authMiddleware, triggerAudit)

export default router
