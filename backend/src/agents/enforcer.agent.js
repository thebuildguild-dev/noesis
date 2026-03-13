import { query } from '../db/query.js'
import { getRecentJournalEntries } from '../repositories/habit.repository.js'
import { getMemory, upsertMemory } from './memory.service.js'
import { generateAccountabilityMessage } from '../services/gemini.service.js'
import { sendEmail } from '../utils/email.js'
import { accountability } from '../utils/emailTemplates.js'

const TONE = {
  1: 'supportive reminder – be warm and encouraging',
  2: 'sarcastic accountability – be witty and slightly cutting',
  3: 'ruthless coach – be blunt, no excuses tolerated'
}

function buildPrompt(habitTitle, daysMissed, level, journalEntries) {
  const entriesText =
    journalEntries.length > 0
      ? journalEntries.map((e, i) => `${i + 1}. ${e}`).join('\n')
      : 'No recent journal entries.'

  return `You are a ruthless accountability coach.

The user missed the habit: ${habitTitle}
They skipped it for ${daysMissed} days.

Escalation level: ${level}

Recent journal entries from the user:

${entriesText}

Write a short personalized message calling them out.

Tone guidelines:
Level 1 → ${TONE[1]}
Level 2 → ${TONE[2]}
Level 3 → ${TONE[3]}

Keep message under 3 sentences.

Return only the message text.`
}

function nextEscalationLevel(memory) {
  if (!memory) return 1
  const next = memory.escalation_level + 1
  return next > 3 ? 3 : next
}

function wasRecentlySent(memory) {
  if (!memory || !memory.last_sent_at) return false
  const hoursSince = (Date.now() - new Date(memory.last_sent_at).getTime()) / (1000 * 60 * 60)
  return hoursSince < 24
}

async function enforce({ userId, userEmail, habitId, habitTitle, daysMissed }) {
  try {
    const memory = await getMemory(userId, habitId)

    if (wasRecentlySent(memory)) {
      return
    }

    const level = nextEscalationLevel(memory)
    const journalEntries = await getRecentJournalEntries(userId, 5)
    const prompt = buildPrompt(habitTitle, daysMissed, level, journalEntries)
    const message = await generateAccountabilityMessage(prompt)

    await query(
      `INSERT INTO agent_messages (user_id, habit_id, message, escalation_level)
       VALUES ($1, $2, $3, $4)`,
      [userId, habitId, message, level]
    )

    await upsertMemory(userId, habitId, level)

    if (userEmail) {
      const { subject, html } = accountability({
        email: userEmail,
        habitTitle,
        daysMissed,
        message,
        escalationLevel: level
      })
      sendEmail({ to: userEmail, subject, html })
    }
  } catch (err) {
    console.error(`[enforcer] failed for habit ${habitId}:`, err.message)
  }
}

export { enforce }
