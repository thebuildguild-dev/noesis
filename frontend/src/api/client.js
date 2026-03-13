import config from '../config/index.js'

/**
 * Core fetch wrapper. All API calls should go through this function so that
 * the base URL is always sourced from the runtime config rather than hard-coded.
 *
 * @param {string} path  - Route path, e.g. "/api/auth/login"
 * @param {RequestInit} options - Standard fetch options
 * @returns {Promise<any>} Parsed JSON response body
 * @throws {Error} When the response status is not ok
 */
export async function apiFetch(path, options = {}) {
  const url = `${config.app.backendUrl}${path}`

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message ?? `Request failed with status ${res.status}`)
  }

  return data
}

/**
 * Convenience wrapper that attaches a Bearer token from localStorage.
 *
 * @param {string} path
 * @param {RequestInit} options
 * @returns {Promise<any>}
 */
export async function authFetch(path, options = {}) {
  const token = localStorage.getItem('access_token')

  return apiFetch(path, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
}
