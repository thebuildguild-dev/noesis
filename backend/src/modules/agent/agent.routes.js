import { Router } from 'express'
import authMiddleware from '../../middlewares/auth.middleware.js'
import { getMessages } from './agent.controller.js'

const router = Router()

router.get('/messages', authMiddleware, getMessages)

export default router
