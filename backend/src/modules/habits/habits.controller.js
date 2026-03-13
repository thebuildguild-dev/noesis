import { unlink } from 'fs/promises'
import * as habitService from './habits.service.js'
import { success, created, error } from '../../utils/response.js'

/** Create a new habit for the authenticated user. */
async function createHabit(req, res, next) {
  try {
    const { title, requiresProof } = req.body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return error(res, 'Habit title is required')
    }
    if (title.trim().length > 255) {
      return error(res, 'Habit title must be 255 characters or fewer')
    }

    const habit = await habitService.createHabit(req.user.id, title.trim(), Boolean(requiresProof))
    return created(res, { habit }, 'Habit created')
  } catch (err) {
    next(err)
  }
}

/** List all habits for the authenticated user with today's completion status. */
async function getHabits(req, res, next) {
  try {
    const habits = await habitService.getHabits(req.user.id)
    return success(res, { habits }, 'Habits fetched')
  } catch (err) {
    next(err)
  }
}

/** Delete a habit owned by the authenticated user. */
async function deleteHabit(req, res, next) {
  try {
    await habitService.deleteHabit(req.user.id, req.params.id)
    return success(res, null, 'Habit deleted')
  } catch (err) {
    next(err)
  }
}

/** Log a habit completion for the authenticated user. */
async function completeHabit(req, res, next) {
  try {
    const { date } = req.body
    const result = await habitService.completeHabit(req.user.id, req.params.id, date)

    if (result.alreadyCompleted) {
      return success(res, null, 'Already completed for this date')
    }
    return created(res, { log: result.log }, 'Habit marked as complete')
  } catch (err) {
    next(err)
  }
}

/** Get streak statistics for a habit owned by the authenticated user. */
async function getStreak(req, res, next) {
  try {
    const streak = await habitService.getStreak(req.user.id, req.params.id)
    return success(res, { streak }, 'Streak fetched')
  } catch (err) {
    next(err)
  }
}

/** Get streak stats for all habits of the authenticated user. */
async function getAllStreaks(req, res, next) {
  try {
    const streaks = await habitService.getAllStreaks(req.user.id)
    return success(res, { streaks }, 'Streaks fetched')
  } catch (err) {
    next(err)
  }
}

/** Get daily habit completion counts. Accepts optional ?from=YYYY-MM-DD&to=YYYY-MM-DD. */
async function getActivity(req, res, next) {
  try {
    const activity = await habitService.getActivity(req.user.id, req.query.from, req.query.to)
    return success(res, { activity }, 'Activity fetched')
  } catch (err) {
    next(err)
  }
}

/** Get all habits with completion status for a specific date (?date=YYYY-MM-DD). */
async function getHabitsForDate(req, res, next) {
  try {
    const { date } = req.query
    if (!date) return error(res, 'date query param is required (YYYY-MM-DD)')
    const habits = await habitService.getHabitsForDate(req.user.id, date)
    return success(res, { habits }, 'Habits for date fetched')
  } catch (err) {
    next(err)
  }
}

/** Get completion dates for a single habit over the last 90 days. */
async function getHabitLogs(req, res, next) {
  try {
    const { dates, createdAt } = await habitService.getHabitLogs(req.user.id, req.params.id)
    return success(res, { dates, createdAt }, 'Habit logs fetched')
  } catch (err) {
    next(err)
  }
}

/** Upload and AI-verify a proof image for a habit. Synchronous — waits for verification. */
async function submitProof(req, res, next) {
  try {
    if (!req.file) return error(res, 'No image file provided')

    const imageUrl = `/uploads/${req.file.filename}`
    const result = await habitService.submitProof(
      req.user.id,
      req.params.id,
      req.file.path,
      imageUrl
    )
    return success(res, result, result.approved ? 'Proof verified!' : 'Proof rejected')
  } catch (err) {
    // Best-effort cleanup for any error path not already handled in the service
    if (req.file) await unlink(req.file.path).catch(() => {})
    next(err)
  }
}

/** Get proof submission history for a habit. */
async function getProofHistory(req, res, next) {
  try {
    const proofs = await habitService.getProofHistory(req.user.id, req.params.id)
    return success(res, { proofs }, 'Proof history fetched')
  } catch (err) {
    next(err)
  }
}

export {
  createHabit,
  getHabits,
  deleteHabit,
  completeHabit,
  getStreak,
  getAllStreaks,
  getActivity,
  getHabitsForDate,
  getHabitLogs,
  submitProof,
  getProofHistory
}
