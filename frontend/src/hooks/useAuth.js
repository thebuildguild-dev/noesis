import { useAuthStore } from '../store/auth.store.js'

export function useAuth() {
  return useAuthStore((s) => ({
    user: s.user,
    isAuthenticated: s.isAuthenticated,
    login: s.login,
    register: s.register,
    logout: s.logout,
    setUser: s.setUser
  }))
}
