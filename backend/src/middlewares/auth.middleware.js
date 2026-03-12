import jwt from 'jsonwebtoken'
import config from '../config/index.js'

/** Verify Bearer JWT and attach req.user = { id, email }. */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access token required' })
  }

  const token = authHeader.slice(7)

  try {
    const payload = jwt.verify(token, config.jwt.accessSecret)
    req.user = { id: payload.sub, email: payload.email }
    next()
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token'
    res.status(401).json({ success: false, message })
  }
}

export default authMiddleware
