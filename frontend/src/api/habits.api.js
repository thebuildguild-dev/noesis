import { authFetch, authUploadFetch } from './client.js'

/** @param {{ title: string }} body */
export const createHabit = (body) =>
  authFetch('/api/habits', { method: 'POST', body: JSON.stringify(body) })

export const getHabits = () => authFetch('/api/habits')

/** @param {string} id */
export const deleteHabit = (id) => authFetch(`/api/habits/${id}`, { method: 'DELETE' })

/** @param {string} id @param {{ date?: string }} [body] */
export const completeHabit = (id, body = {}) =>
  authFetch(`/api/habits/${id}/complete`, { method: 'POST', body: JSON.stringify(body) })

/** Fetch streak data for ALL habits of the current user in one request. */
export const getAllStreaks = () => authFetch('/api/habits/streaks')

/**
 * Fetch per-day completion counts.
 * @param {{ from?: string, to?: string }} [params] YYYY-MM-DD range (optional)
 */
export const getActivity = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
  ).toString()
  return authFetch(`/api/habits/activity${qs ? `?${qs}` : ''}`)
}

/**
 * Fetch all habits with completed_on_date flag for a specific date.
 * @param {string} date YYYY-MM-DD
 */
export const getHabitsForDate = (date) => authFetch(`/api/habits/day?date=${date}`)

/**
 * Fetch completion dates (last 90 days) for a single habit.
 * @param {string} id
 */
export const getHabitLogs = (id) => authFetch(`/api/habits/${id}/logs`)

/**
 * Upload a proof image for a habit. Uses multipart form upload.
 * @param {string} id
 * @param {File} file
 */
export const submitHabitProof = (id, file) => {
  const formData = new FormData()
  formData.append('proof', file)
  return authUploadFetch(`/api/habits/${id}/proof`, formData)
}

/**
 * Fetch proof submission history for a habit.
 * @param {string} id
 */
export const getProofHistory = (id) => authFetch(`/api/habits/${id}/proofs`)
