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

/**
 * Fetch journal entries created on a specific local date.
 * Sends local-midnight boundaries as UTC ISO strings so the backend can use
 * a timestamp range instead of DATE() in UTC, which would miss entries
 * written before midnight UTC (e.g. users in UTC+ timezones).
 * @param {string} date YYYY-MM-DD (local date)
 */
export const getJournalForDate = (date) => {
  const from = new Date(date + 'T00:00:00').toISOString()
  const to = new Date(date + 'T23:59:59.999').toISOString()
  return authFetch(`/api/journal/day?from=${from}&to=${to}`)
}

export const getJournalForRange = (fromDate, toDate) => {
  const from = new Date(fromDate + 'T00:00:00').toISOString()
  const to = new Date(toDate + 'T23:59:59.999').toISOString()
  return authFetch(`/api/journal/day?from=${from}&to=${to}`)
}

export const getJournalInsights = () => authFetch('/api/journal/insights')
