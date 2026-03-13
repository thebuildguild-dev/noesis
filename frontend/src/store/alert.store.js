import { create } from 'zustand'

export const useAlertStore = create((set) => ({
  toast: null,
  showSuccess: (message) => set({ toast: { message, type: 'success' } }),
  showError: (message) => set({ toast: { message, type: 'error' } }),
  showInfo: (message) => set({ toast: { message, type: 'info' } }),
  dismiss: () => set({ toast: null })
}))
