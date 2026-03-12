import config from '../config/index.js'

/** Return application health status. */
function healthCheck(req, res) {
  res.json({
    success: true,
    app: config.app.name,
    env: config.app.env,
    status: 'ok',
    timestamp: new Date().toISOString()
  })
}

export { healthCheck }
