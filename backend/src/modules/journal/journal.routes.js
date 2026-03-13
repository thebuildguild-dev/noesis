import { Router } from 'express'
import authMiddleware from '../../middlewares/auth.middleware.js'
import * as journalController from './journal.controller.js'

const router = Router()

router.use(authMiddleware)

router.post('/', journalController.createEntry)
router.get('/', journalController.getEntries)
router.get('/day', journalController.getEntriesForDate)
router.get('/insights', journalController.getInsights)
router.put('/:id', journalController.updateEntry)
router.delete('/:id', journalController.deleteEntry)

export default router
