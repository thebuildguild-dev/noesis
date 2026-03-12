import * as authService from './auth.service.js'
import { success, created, error } from '../../utils/response.js'
import config from '../../config/index.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmailPassword(res, { email, password }) {
  if (!email || !password) {
    error(res, 'Email and password are required')
    return false
  }
  if (!EMAIL_RE.test(email)) {
    error(res, 'Invalid email format')
    return false
  }
  return true
}

/** Register a new user account. */
async function register(req, res, next) {
  try {
    const { email, password } = req.body

    if (!validateEmailPassword(res, { email, password })) return

    if (password.length < 8) {
      return error(res, 'Password must be at least 8 characters')
    }

    const user = await authService.register(email, password)
    return created(res, { user }, 'Account created successfully')
  } catch (err) {
    next(err)
  }
}

/** Authenticate a user and issue access and refresh tokens. */
async function login(req, res, next) {
  try {
    const { email, password } = req.body

    if (!validateEmailPassword(res, { email, password })) return

    const data = await authService.login(email, password)
    return success(res, data, 'Login successful')
  } catch (err) {
    next(err)
  }
}

/** Rotate the refresh token and issue a new access token. */
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return error(res, 'Refresh token is required')
    }

    const data = await authService.refresh(refreshToken)
    return success(res, data, 'Tokens refreshed')
  } catch (err) {
    next(err)
  }
}

/** Revoke the refresh token and end the session. */
async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return error(res, 'Refresh token is required')
    }

    await authService.logout(refreshToken)
    return success(res, null, 'Logged out successfully')
  } catch (err) {
    next(err)
  }
}

/** Send a password reset email. Always responds 200 to prevent email enumeration. */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body

    if (!email || !EMAIL_RE.test(email)) {
      return error(res, 'A valid email address is required')
    }

    if (email.toLowerCase() === config.demoUser.email) {
      return success(res, null, 'If that email is registered, a reset link has been sent.')
    }

    await authService.forgotPassword(email)
    return success(res, null, 'If that email is registered, a reset link has been sent.')
  } catch (err) {
    next(err)
  }
}

/** Reset a user's password using a valid reset token. */
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body

    if (!token) {
      return error(res, 'Reset token is required')
    }
    if (!password || password.length < 8) {
      return error(res, 'Password must be at least 8 characters')
    }

    await authService.resetPassword(token, password)
    return success(res, null, 'Password updated successfully. Please log in.')
  } catch (err) {
    next(err)
  }
}

/** Return the authenticated user's profile. */
async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id)
    return success(res, { user }, 'User profile fetched')
  } catch (err) {
    next(err)
  }
}

/** Update the authenticated user's profile (name). */
async function updateProfile(req, res, next) {
  try {
    if (req.user.email === config.demoUser.email) {
      return error(res, 'Demo account cannot be modified', 403)
    }

    const { name } = req.body
    if (!name || typeof name !== 'string' || !name.trim()) {
      return error(res, 'Name is required')
    }

    const user = await authService.updateProfile(req.user.id, { name: name.trim() })
    return success(res, { user }, 'Profile updated')
  } catch (err) {
    next(err)
  }
}

export { register, login, refresh, logout, forgotPassword, resetPassword, me, updateProfile }
