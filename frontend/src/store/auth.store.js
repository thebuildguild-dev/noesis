import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as authApi from '../api/auth.api.js'

const syncToken = (token) => {
  if (token) localStorage.setItem('access_token', token)
  else localStorage.removeItem('access_token')
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

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
          syncToken(null)
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
        }
      },

      setUser: (user) => set({ user }),

      refreshAuth: async () => {
        const { refreshToken } = get()
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await authApi.refresh({ refreshToken })
        syncToken(data.accessToken)
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken
        })
      }
    }),
    {
      name: 'noesis-auth',
      // Re-sync access_token to localStorage whenever the persisted state hydrates
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) syncToken(state.accessToken)
      }
    }
  )
)
