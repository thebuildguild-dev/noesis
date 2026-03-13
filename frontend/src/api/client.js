import config from '../config/index.js'
import { clearSession, refreshSession } from '../utils/authSession.js'

let refreshPromise = null

async function requestJson(path, options = {}) {
  const url = `${config.app.backendUrl}${path}`

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  const data = await res.json().catch(() => null)

  return { res, data: data ?? {} }
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshSession()
      .catch((err) => {
        clearSession()

        if (err instanceof Error && /refresh token|no refresh token/i.test(err.message)) {
          throw new Error('Session expired. Please sign in again.')
        }

        throw err
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

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
  const { res, data } = await requestJson(path, options)

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
export async function authFetch(path, options = {}, allowRefresh = true) {
  const token = localStorage.getItem('access_token')

  const { res, data } = await requestJson(path, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })

  if (
    allowRefresh &&
    res.status === 401 &&
    path !== '/api/auth/refresh' &&
    path !== '/api/auth/login' &&
    path !== '/api/auth/register'
  ) {
    await refreshAccessToken()
    return authFetch(path, options, false)
  }

  if (!res.ok) {
    throw new Error(data.message ?? `Request failed with status ${res.status}`)
  }

  return data
}
