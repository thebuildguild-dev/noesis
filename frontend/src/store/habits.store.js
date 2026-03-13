import { create } from 'zustand'
import * as habitsApi from '../api/habits.api.js'
import * as streakApi from '../api/streak.api.js'

export const useHabitsStore = create((set, get) => ({
  habits: [],
  streaks: {},
  loading: false,
  error: null,

  fetchHabits: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await habitsApi.getHabits()
      set({ habits: data.habits })
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  createHabit: async (title) => {
    const { data } = await habitsApi.createHabit({ title })
    set((s) => ({ habits: [...s.habits, { ...data.habit, completed_today: false }] }))
    return data.habit
  },

  completeHabit: async (id) => {
    const { data } = await habitsApi.completeHabit(id)
    if (!data.alreadyCompleted) {
      set((s) => ({
        habits: s.habits.map((h) => (h.id === id ? { ...h, completed_today: true } : h))
      }))
    }
    return data
  },

  deleteHabit: async (id) => {
    await habitsApi.deleteHabit(id)
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }))
  },

  fetchStreak: async (id) => {
    const { data } = await streakApi.getHabitStreak(id)
    set((s) => ({ streaks: { ...s.streaks, [id]: data.streak } }))
    return data.streak
  },

  getStreak: (id) => get().streaks[id] ?? null
}))
