import { getBrokenStreakHabits } from '../repositories/habit.repository.js'
import { enforce } from './enforcer.agent.js'

async function audit() {
  const habits = await getBrokenStreakHabits()

  if (habits.length === 0) {
    return
  }

  for (const habit of habits) {
    await enforce({
      userId: habit.user_id,
      userEmail: habit.user_email,
      habitId: habit.habit_id,
      habitTitle: habit.habit_title,
      daysMissed: Number(habit.days_missed)
    })
  }
}

export { audit }
