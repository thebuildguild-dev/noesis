import { create } from 'zustand'
import { getJournalInsights } from '../api/journal.api.js'

export const useInsightsStore = create((set) => ({
  entries: [],
  themeCounts: {},
  loading: false,
  error: null,

  fetchInsights: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await getJournalInsights()
      set({ entries: data.entries, themeCounts: data.themeCounts })
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  }
}))
