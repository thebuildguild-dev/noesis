let refreshHandler = null
let clearHandler = null

export function registerAuthSessionHandlers(handlers) {
  refreshHandler = handlers.refreshAuth
  clearHandler = handlers.clearAuth
}

export async function refreshSession() {
  if (!refreshHandler) {
    throw new Error('Auth session unavailable')
  }

  return refreshHandler()
}

export function clearSession() {
  clearHandler?.()
}
