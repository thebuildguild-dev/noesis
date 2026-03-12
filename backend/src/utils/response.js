/**
 * Send a 200 OK response with optional data and message.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} message
 */
function success(res, data, message = 'OK') {
  res.status(200).json({ success: true, message, data: data ?? null })
}

/**
 * Send a 201 Created response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} message
 */
function created(res, data, message = 'Created') {
  res.status(201).json({ success: true, message, data: data ?? null })
}

/**
 * Send an error response with a given status code (default 400).
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} statusCode
 */
function error(res, message, statusCode = 400) {
  res.status(statusCode).json({ success: false, message })
}

export { success, created, error }
