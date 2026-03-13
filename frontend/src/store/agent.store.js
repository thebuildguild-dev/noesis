import { create } from 'zustand'
import { fetchAgentMessages } from '../api/agent.api.js'

const POLL_INTERVAL = 60 * 1000

export const useAgentStore = create((set, get) => ({
  messages: [],
  timerId: null,

  startPolling() {
    const { timerId, poll } = get()
    if (timerId) return

    poll()

    const id = setInterval(() => {
      poll()
    }, POLL_INTERVAL)

    set({ timerId: id })
  },

  stopPolling() {
    const { timerId } = get()
    if (timerId) {
      clearInterval(timerId)
      set({ timerId: null })
    }
  },

  async poll() {
    try {
      const messages = await fetchAgentMessages()
      if (messages.length > 0) {
        set({ messages })
      }
    } catch {
      // silently ignore — agent messages are non-critical
    }
  },

  dismiss(id) {
    set((s) => ({ messages: s.messages.filter((m) => m.id !== id) }))
  }
}))
