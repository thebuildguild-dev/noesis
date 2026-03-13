import { authFetch } from './client.js'

/** @param {string} habitId */
export const getHabitStreak = (habitId) => authFetch(`/api/habits/${habitId}/streak`)
