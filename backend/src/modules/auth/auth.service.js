import crypto from 'crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { query, withTransaction } from '../../db/query.js'
import config from '../../config/index.js'
import { sendEmail } from '../../utils/email.js'
import * as templates from '../../utils/emailTemplates.js'

const SALT_ROUNDS = 10
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Parse a duration string like "15m", "7d", "1h" into milliseconds.
 * @param {string} str
 * @returns {number}
 */
function parseDurationMs(str) {
  const units = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }
  const match = str.match(/^(\d+)([smhd])$/)
  if (!match) throw new Error(`Invalid duration string: ${str}`)
  return parseInt(match[1], 10) * units[match[2]]
}

function generateAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry
  })
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex')
}

/** SHA-256 hex digest — used to store reset tokens without exposing raw value. */
function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

/**
 * Register a new user, issue tokens, and return the session — identical shape to login.
 * Throws 409 if the email is already in use.
 * @param {string} email
 * @param {string} password
 * @param {string} [name]
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: Object }>}
 */
async function register(email, password, name) {
  const normalised = email.toLowerCase()

  const { rows: existing } = await query('SELECT id FROM users WHERE email = $1', [normalised])
  if (existing.length > 0) {
    const err = new Error('Email already in use')
    err.status = 409
    throw err
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const { rows } = await query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, role, created_at, updated_at`,
    [normalised, passwordHash, name?.trim() || null]
  )

  const user = rows[0]

  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken()
  const expiresAt = new Date(Date.now() + parseDurationMs(config.jwt.refreshExpiry))

  await query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [
    user.id,
    refreshToken,
    expiresAt
  ])

  const { subject, html } = templates.welcome({ email: user.email })
  sendEmail({ to: user.email, subject, html }).catch(() => {})

  return { accessToken, refreshToken, user }
}

/**
 * Authenticate a user and issue an access token and refresh token.
 * Throws 401 on invalid credentials.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: Object }>}
 */
async function login(email, password) {
  const { rows } = await query(
    'SELECT id, email, name, role, password_hash, created_at, updated_at FROM users WHERE email = $1',
    [email.toLowerCase()]
  )

  // Constant-time check to avoid leaking whether the email exists.
  const user = rows[0] || null
  const hashToCheck = user
    ? user.password_hash
    : '$2b$10$invalidhashplaceholderXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'

  const valid = await bcrypt.compare(password, hashToCheck)

  if (!user || !valid) {
    const err = new Error('Invalid credentials')
    err.status = 401
    throw err
  }

  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken()
  const expiresAt = new Date(Date.now() + parseDurationMs(config.jwt.refreshExpiry))

  await query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [
    user.id,
    refreshToken,
    expiresAt
  ])

  const { subject, html } = templates.loginAlert({
    email: user.email,
    timestamp: new Date()
  })
  sendEmail({ to: user.email, subject, html }).catch(() => {})

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  }
}

/**
 * Rotate the refresh token and issue a new access token.
 * Throws 401 if the token is invalid or expired.
 * @param {string} token  Opaque refresh token.
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
async function refresh(token) {
  const { rows } = await query(
    'SELECT id, user_id, expires_at FROM refresh_tokens WHERE token = $1',
    [token]
  )

  if (rows.length === 0) {
    const err = new Error('Invalid refresh token')
    err.status = 401
    throw err
  }

  const record = rows[0]

  if (new Date(record.expires_at) < new Date()) {
    await query('DELETE FROM refresh_tokens WHERE id = $1', [record.id])
    const err = new Error('Refresh token expired')
    err.status = 401
    throw err
  }

  const { rows: userRows } = await query('SELECT id, email FROM users WHERE id = $1', [
    record.user_id
  ])

  if (userRows.length === 0) {
    const err = new Error('User not found')
    err.status = 401
    throw err
  }

  const user = userRows[0]

  // Rotate: delete old token, issue new one atomically.
  const newRefreshToken = generateRefreshToken()
  const expiresAt = new Date(Date.now() + parseDurationMs(config.jwt.refreshExpiry))

  await withTransaction(async (client) => {
    await client.query('DELETE FROM refresh_tokens WHERE id = $1', [record.id])
    await client.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, newRefreshToken, expiresAt]
    )
  })

  return {
    accessToken: generateAccessToken(user),
    refreshToken: newRefreshToken
  }
}

/**
 * Revoke the given refresh token, ending the session.
 * @param {string} token  Opaque refresh token.
 */
async function logout(token) {
  await query('DELETE FROM refresh_tokens WHERE token = $1', [token])
}

/**
 * Generates a reset token, stores its hash, and emails the reset link.
 * Always resolves successfully to prevent user-enumeration via timing.
 */
async function forgotPassword(email) {
  const normalised = email.toLowerCase()

  const { rows } = await query('SELECT id, email FROM users WHERE email = $1', [normalised])

  // No user — silently return to avoid email enumeration.
  if (rows.length === 0) return

  const user = rows[0]

  // Invalidate any existing unused tokens for this user.
  await query('DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL', [user.id])

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
  )

  const resetUrl = `${config.app.baseUrl}/reset-password?token=${rawToken}`

  const { subject, html } = templates.forgotPassword({
    email: user.email,
    resetUrl
  })
  sendEmail({ to: user.email, subject, html }).catch(() => {})
}

/**
 * Verifies the reset token and updates the user's password.
 * Rotates out all active sessions after a successful reset.
 */
async function resetPassword(rawToken, newPassword) {
  const tokenHash = hashToken(rawToken)

  const { rows } = await query(
    `SELECT prt.id, prt.user_id, prt.expires_at, prt.used_at, u.email
     FROM password_reset_tokens prt
     JOIN users u ON u.id = prt.user_id
     WHERE prt.token_hash = $1`,
    [tokenHash]
  )

  if (rows.length === 0) {
    const err = new Error('Invalid or expired reset token')
    err.status = 400
    throw err
  }

  const record = rows[0]

  if (record.email === config.demoUser.email) {
    const err = new Error('Demo account cannot be modified')
    err.status = 403
    throw err
  }

  if (record.used_at) {
    const err = new Error('Reset token has already been used')
    err.status = 400
    throw err
  }

  if (new Date(record.expires_at) < new Date()) {
    const err = new Error('Reset token has expired')
    err.status = 400
    throw err
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

  await withTransaction(async (client) => {
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      passwordHash,
      record.user_id
    ])
    await client.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [
      record.id
    ])
    // Revoke all active sessions — force re-login after password change.
    await client.query('DELETE FROM refresh_tokens WHERE user_id = $1', [record.user_id])
  })
}

/**
 * Return the authenticated user's profile.
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function getMe(userId) {
  const { rows } = await query(
    'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  )
  if (rows.length === 0) {
    const err = new Error('User not found')
    err.status = 404
    throw err
  }
  return rows[0]
}

/**
 * Update the authenticated user's profile fields.
 * Currently supports updating name.
 * @param {string} userId
 * @param {{ name: string }} fields
 * @returns {Promise<Object>}
 */
async function updateProfile(userId, { name }) {
  const { rows } = await query(
    `UPDATE users
     SET name = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, email, name, role, created_at, updated_at`,
    [name, userId]
  )
  if (rows.length === 0) {
    const err = new Error('User not found')
    err.status = 404
    throw err
  }
  return rows[0]
}

export { register, login, refresh, logout, forgotPassword, resetPassword, getMe, updateProfile }
