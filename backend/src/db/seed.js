import bcrypt from 'bcrypt'
import pool from './pool.js'
import config from '../config/index.js'

const DEMO_EMAIL = config.demoUser.email
const DEMO_NAME = 'Demo User'
const DEMO_PASSWORD = config.demoUser.password
const SALT_ROUNDS = 10

const HABITS = ['Deep Work Session', 'Morning Exercise', 'Read 30 Minutes', 'Evening Review']

const JOURNAL_ENTRIES = [
  {
    daysAgo: 0,
    content: `Today I finally felt the gears turning again. Spent three uninterrupted hours working through the architecture document that's been stalling me for weeks. The key insight was treating each service boundary as a contract rather than an implementation detail — once I reframed it that way, the whole design clicked.\n\nMorning run was exactly what I needed beforehand. There's something about physical movement that primes the brain for abstract thinking. Finished the day with an evening review and was genuinely surprised by how much shipped. The habit streak is holding, which feels good.\n\nTomorrow: get the prototype in front of someone else's eyes.`
  },
  {
    daysAgo: 1,
    content: `Harder day. The deep-work block got interrupted twice by "quick calls" that were not quick. I've decided to block my calendar more aggressively — mornings are non-negotiable focus time from now on.\n\nStill read in the afternoon, finishing the chapter on deliberate practice. The idea that most people plateau because they stop practicing at the edge of their ability is uncomfortable and motivating at the same time.\n\nSkipped evening review — too tired. Log it honestly and move on.`
  },
  {
    daysAgo: 2,
    content: `Clean, productive day. Set a single most-important task the night before and worked on nothing else until it was done. The sense of progress when you finish the thing that actually matters before lunch is hard to beat.\n\nThe reading habit is starting to compound. I made a connection today between a Feynman passage and a systems design problem I've been circling for weeks. Wrote three pages of notes almost involuntarily.\n\nFeel calm. Streak intact.`
  },
  {
    daysAgo: 3,
    content: `Woke up with a tight chest and a long list — classic recipe for nothing getting done. Instead of diving into the list, I spent the first fifteen minutes writing out what was actually bothering me. Turned out most of the anxiety was about two items, not twenty.\n\nDeep work session after a short walk was the best block of the week.\n\nNote to self: protect early morning like infrastructure.`
  },
  {
    daysAgo: 4,
    content: `Strong morning, weak afternoon. I hit flow during the first two hours — the kind where you look up and an hour has passed — but squandered the afternoon reacting to messages.\n\nEnding the day with a small win: I outlined a short essay I've been meaning to write for months. Sometimes the hardest part is just making the blank page slightly less blank.\n\nExercise streak at 9 days. Body feels different — lighter, faster to warm up.`
  },
  {
    daysAgo: 5,
    content: `Rest day, sort of. No deep work by design — gave the brain a maintenance cycle. Spent the morning on low-stakes administrative tasks, then took a long walk without headphones.\n\nHad an unexpected idea on the walk about a caching problem I've been wrestling with. The solution was embarrassingly simple, which usually means I was overcomplicating it.\n\nRead for an hour in the evening. The habit is genuinely enjoyable now.`
  },
  {
    daysAgo: 6,
    content: `Weekly review. The numbers: four deep work blocks (target: five), ten exercise sessions (target: seven — exceeded), 14 of 14 days of reading, seven of seven evening reviews.\n\nThe gap in deep work happened because I consistently underestimated context-switching costs. Next week: one async-only morning per week, no real-time comms until noon.\n\nBiggest insight this week: progress compounds, but so do bad defaults.`
  },
  {
    daysAgo: 7,
    content: `Shipped the first working prototype. It is rough, it has rough edges, and I am unreasonably proud of it. There is a specific satisfaction in taking something from a concept in your head to a thing you can actually click through.\n\nGot useful early feedback within an hour of sharing it. Most of it was about onboarding — people didn't know where to start. That's actionable and confirms the next sprint focus.\n\nDeep work: 3h. Exercise: yes. Read: yes. Evening review: brief. Good day.`
  },
  {
    daysAgo: 8,
    content: `Went back to basics today. Re-read my notes from the start of the month and was struck by how differently I was thinking about the problem then. What seemed mysterious three weeks ago is now obvious, which means what's mysterious today will eventually become obvious too.\n\nMorning exercise felt harder than usual. Pushed through. On the other side of resistance is almost always a better state than on this side.`
  },
  {
    daysAgo: 9,
    content: `Tackled the problem I'd been avoiding. It wasn't as bad as the avoidance had made it feel — avoidance is always the worst part. Resolved it in about ninety minutes once I stopped scheduling it and just started.\n\nLong reading session tonight. Working through a dense technical book slowly on purpose — not skimming for highlights but sitting with every concept until it makes sense.`
  },
  {
    daysAgo: 10,
    content: `Light day. Had a long conversation with a collaborator that ended up being more valuable than any solo work session could have been. Sometimes the leverage is in other people's perspectives, not more hours of thinking alone.\n\nKey takeaway: I've been optimising locally — making individual parts better without questioning whether those parts are the right parts. Need to zoom out more regularly.`
  },
  {
    daysAgo: 11,
    content: `Back to the grind after a sluggish start. Pomodoro method today — 25 minutes on, 5 off — because I couldn't trust myself to self-regulate focus. It worked. Sometimes the structure of a simple technique is all the scaffolding you need.\n\nStreak: 12 days of morning exercise. That's a record.`
  },
  {
    daysAgo: 12,
    content: `Journaling earlier than usual today because my mind is busy and writing clears it. There's a decision I've been sitting with for two weeks, and I think I've been waiting for certainty that isn't coming.\n\nWriting principle I keep returning to: make reversible decisions quickly, make irreversible decisions carefully. This one is largely reversible. Stop overthinking it.`
  },
  {
    daysAgo: 13,
    content: `First entry in a while where I'm reflecting on the practice of reflection itself. Fourteen days of showing up to this journal has changed something subtle in how I process the day. I'm noticing patterns I used to let slide past.\n\nThe habits are sticky now. Morning exercise and reading don't feel like obligations — they're just part of the day's shape. That's the transition point everyone talks about but rarely describes: it's not a switch, it's a slow normalisation.\n\nGrateful for the consistency. Curious about what comes next.`
  }
]

function daysAgoDate(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

/**
 * Seed the demo user (demo@noesis.local) with sample habits, logs, and journal entries.
 * Idempotent — safe to call on every startup.
 */
async function seedDemoUser() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS)

    const { rows: existing } = await client.query('SELECT id FROM users WHERE email = $1', [
      DEMO_EMAIL
    ])

    let userId
    if (existing.length > 0) {
      userId = existing[0].id
      console.log(`  [seed] demo user already exists (${DEMO_EMAIL})`)
    } else {
      const { rows } = await client.query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
        [DEMO_EMAIL, passwordHash, DEMO_NAME]
      )
      userId = rows[0].id
      console.log(`  [seed] created demo user: ${DEMO_EMAIL}`)
    }

    const habitIds = []
    for (const title of HABITS) {
      const { rows: existingHabit } = await client.query(
        'SELECT id FROM habits WHERE user_id = $1 AND title = $2',
        [userId, title]
      )

      if (existingHabit.length > 0) {
        habitIds.push(existingHabit[0].id)
      } else {
        const { rows } = await client.query(
          'INSERT INTO habits (user_id, title) VALUES ($1, $2) RETURNING id',
          [userId, title]
        )
        habitIds.push(rows[0].id)
      }
    }

    let logCount = 0
    for (let day = 0; day < 14; day++) {
      const dateStr = daysAgoDate(day)
      for (const habitId of habitIds) {
        if (Math.random() > 0.78) continue

        const { rowCount } = await client.query(
          `INSERT INTO habit_logs (habit_id, completed_date)
           VALUES ($1, $2)
           ON CONFLICT (habit_id, completed_date) DO NOTHING`,
          [habitId, dateStr]
        )
        if (rowCount > 0) logCount++
      }
    }

    let journalCount = 0
    for (const { daysAgo, content } of JOURNAL_ENTRIES) {
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - daysAgo)
      createdAt.setHours(21, Math.floor(Math.random() * 60), 0, 0)

      const { rows: existingEntry } = await client.query(
        `SELECT id FROM journal_entries WHERE user_id = $1 AND DATE(created_at) = $2`,
        [userId, daysAgoDate(daysAgo)]
      )

      if (existingEntry.length === 0) {
        await client.query(
          `INSERT INTO journal_entries (user_id, content, created_at, updated_at)
           VALUES ($1, $2, $3, $3)`,
          [userId, content, createdAt]
        )
        journalCount++
      }
    }

    await client.query('COMMIT')

    if (logCount > 0 || journalCount > 0) {
      console.log(`  [seed] inserted ${logCount} habit log(s), ${journalCount} journal entry(s)`)
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export { seedDemoUser }
