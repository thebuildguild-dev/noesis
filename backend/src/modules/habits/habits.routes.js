import { Router } from 'express'
import authMiddleware from '../../middlewares/auth.middleware.js'
import * as habitController from './habits.controller.js'

const router = Router()

router.use(authMiddleware)

router.post('/', habitController.createHabit)
router.get('/', habitController.getHabits)
router.delete('/:id', habitController.deleteHabit)
router.post('/:id/complete', habitController.completeHabit)
router.get('/:id/streak', habitController.getStreak)

export default router
