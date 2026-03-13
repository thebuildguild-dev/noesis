import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as authApi from '../api/auth.api.js'
import { registerAuthSessionHandlers } from '../utils/authSession.js'

const AUTH_STORAGE_KEY = 'noesis-auth'

const syncToken = (token) => {
  if (token) localStorage.setItem('access_token', token)
  else localStorage.removeItem('access_token')
}

const readPersistedRefreshToken = () => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    return parsed?.state?.refreshToken ?? null
  } catch {
    return null
  }
}

const emptyAuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      ...emptyAuthState,

      login: async (email, password) => {
        const { data } = await authApi.login({ email, password })
        syncToken(data.accessToken)
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true
        })
        return data
      },

      register: async (email, password, name) => {
        const { data } = await authApi.register({
          email,
          password,
          name: name?.trim() || undefined
        })
        syncToken(data.accessToken)
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true
        })
        return data
      },

      logout: async () => {
        try {
          const { refreshToken } = get()
          if (refreshToken) await authApi.logout({ refreshToken })
        } finally {
          get().clearAuth()
        }
      },

      clearAuth: () => {
        syncToken(null)
        set(emptyAuthState)
      },

      setUser: (user) => set({ user }),

      refreshAuth: async () => {
        const refreshToken = get().refreshToken ?? readPersistedRefreshToken()
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await authApi.refresh({ refreshToken })
        syncToken(data.accessToken)
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true
        })
        return data
      }
    }),
    {
      name: AUTH_STORAGE_KEY,
      // Re-sync access_token to localStorage whenever the persisted state hydrates
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) syncToken(state.accessToken)
      }
    }
  )
)

registerAuthSessionHandlers({
  refreshAuth: () => useAuthStore.getState().refreshAuth(),
  clearAuth: () => useAuthStore.getState().clearAuth()
})
