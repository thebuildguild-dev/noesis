import * as habitService from './habits.service.js'
import { success, created, error } from '../../utils/response.js'

/** Create a new habit for the authenticated user. */
async function createHabit(req, res, next) {
  try {
    const { title } = req.body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return error(res, 'Habit title is required')
    }
    if (title.trim().length > 255) {
      return error(res, 'Habit title must be 255 characters or fewer')
    }

    const habit = await habitService.createHabit(req.user.id, title.trim())
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

export { createHabit, getHabits, deleteHabit, completeHabit, getStreak }
