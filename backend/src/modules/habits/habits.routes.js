import { Router } from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import multer from 'multer'
import authMiddleware from '../../middlewares/auth.middleware.js'
import * as habitController from './habits.controller.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '../../../uploads')

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    cb(null, `proof_${Date.now()}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    cb(null, allowed.includes(file.mimetype))
  }
})

const router = Router()

router.use(authMiddleware)

router.post('/', habitController.createHabit)
router.get('/', habitController.getHabits)
router.get('/streaks', habitController.getAllStreaks)
router.get('/activity', habitController.getActivity)
router.get('/day', habitController.getHabitsForDate)
router.delete('/:id', habitController.deleteHabit)
router.post('/:id/complete', habitController.completeHabit)
router.get('/:id/streak', habitController.getStreak)
router.get('/:id/logs', habitController.getHabitLogs)
router.post('/:id/proof', upload.single('proof'), habitController.submitProof)
router.get('/:id/proofs', habitController.getProofHistory)

export default router
