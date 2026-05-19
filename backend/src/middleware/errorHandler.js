/**
 * Global Express error handler.
 * Logs the error and returns a JSON response with an appropriate status code.
 */
export function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err)

  // Determine status code
  const status = err.status || err.statusCode || 500

  // Determine message (avoid leaking internal errors to clients in production)
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Une erreur interne est survenue'
      : err.message || 'Une erreur est survenue'

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && status === 500 && { stack: err.stack })
  })
}
