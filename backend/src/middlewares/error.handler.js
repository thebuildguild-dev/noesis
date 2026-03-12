import config from '../config/index.js'

/**
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500
  const isDev = config.app.env !== 'production'

  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(isDev && { stack: err.stack })
  })
}

export default errorHandler
