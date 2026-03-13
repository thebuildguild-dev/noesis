import { Router } from 'express'
import authMiddleware from '../../middlewares/auth.middleware.js'
import { generateQuestion, evaluateJustification } from './interrogator.controller.js'

const router = Router()

router.use(authMiddleware)

router.post('/question', generateQuestion)
router.post('/evaluate', evaluateJustification)

export default router
