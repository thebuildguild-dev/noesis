import { useState, useCallback } from 'react'

/**
 * Wraps an async API call with loading + error state.
 * Returns { loading, error, call } where `call(fn, ...args)` executes fn.
 */
export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const call = useCallback(async (fn, ...args) => {
    setLoading(true)
    setError(null)
    try {
      return await fn(...args)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, call, clearError: () => setError(null) }
}
