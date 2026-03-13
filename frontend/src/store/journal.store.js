import { create } from 'zustand'
import * as journalApi from '../api/journal.api.js'

export const useJournalStore = create((set) => ({
  entries: [],
  pagination: null,
  loading: false,
  error: null,

  fetchEntries: async (page = 1, limit = 20) => {
    set({ loading: true, error: null })
    try {
      const { data } = await journalApi.getJournalEntries({ page, limit })
      set({ entries: data.entries, pagination: data.pagination })
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  createEntry: async (content) => {
    const { data } = await journalApi.createJournalEntry({ content })
    set((s) => ({ entries: [data.entry, ...s.entries] }))
    return data.entry
  },

  updateEntry: async (id, content) => {
    const { data } = await journalApi.updateJournalEntry(id, { content })
    set((s) => ({
      entries: s.entries.map((e) => (e.id === id ? data.entry : e))
    }))
    return data.entry
  },

  deleteEntry: async (id) => {
    await journalApi.deleteJournalEntry(id)
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }))
  }
}))
