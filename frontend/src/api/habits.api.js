import { authFetch } from './client.js'

/** @param {{ title: string }} body */
export const createHabit = (body) =>
  authFetch('/api/habits', { method: 'POST', body: JSON.stringify(body) })

export const getHabits = () => authFetch('/api/habits')

/** @param {string} id */
export const deleteHabit = (id) => authFetch(`/api/habits/${id}`, { method: 'DELETE' })

/** @param {string} id @param {{ date?: string }} [body] */
export const completeHabit = (id, body = {}) =>
  authFetch(`/api/habits/${id}/complete`, { method: 'POST', body: JSON.stringify(body) })
