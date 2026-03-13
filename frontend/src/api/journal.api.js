import { authFetch } from './client.js'

/** @param {{ content: string }} body */
export const createJournalEntry = (body) =>
  authFetch('/api/journal', { method: 'POST', body: JSON.stringify(body) })

/** @param {{ page?: number, limit?: number }} [params] */
export const getJournalEntries = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
  ).toString()
  return authFetch(`/api/journal${qs ? `?${qs}` : ''}`)
}

/** @param {string} id @param {{ content: string }} body */
export const updateJournalEntry = (id, body) =>
  authFetch(`/api/journal/${id}`, { method: 'PUT', body: JSON.stringify(body) })

/** @param {string} id */
export const deleteJournalEntry = (id) => authFetch(`/api/journal/${id}`, { method: 'DELETE' })
