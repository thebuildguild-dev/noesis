import { apiFetch, authFetch } from './client.js'

/** @param {{ email: string, password: string, name?: string }} body */
export const register = (body) =>
  apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(body) })

/** @param {{ email: string, password: string }} body */
export const login = (body) =>
  apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(body) })

/** @param {{ refresh_token: string }} body */
export const refresh = (body) =>
  apiFetch('/api/auth/refresh', { method: 'POST', body: JSON.stringify(body) })

/** @param {{ refresh_token: string }} body */
export const logout = (body) =>
  authFetch('/api/auth/logout', { method: 'POST', body: JSON.stringify(body) })

export const getMe = () => authFetch('/api/auth/me')

/** @param {{ name: string }} body */
export const updateProfile = (body) =>
  authFetch('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) })

/** @param {{ email: string }} body */
export const forgotPassword = (body) =>
  apiFetch('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) })

/** @param {{ token: string, new_password: string }} body */
export const resetPassword = (body) =>
  apiFetch('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(body) })

/** Reset the authenticated user's account data. */
export const resetAccount = () => authFetch('/api/auth/reset', { method: 'POST' })
