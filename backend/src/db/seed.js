import bcrypt from 'bcrypt'
import pool from './pool.js'
import config from '../config/index.js'

const DEMO_EMAIL = config.demoUser.email
const DEMO_NAME = 'Demo User'
const DEMO_PASSWORD = config.demoUser.password
const SALT_ROUNDS = 10

const HABITS = [
  'Deep Work Session',
  'Morning Exercise',
  'Read 30 Minutes',
  'Evening Review',
  'Write 500 Words',
  'Cold Outreach',
  'Meditation (10 mins)',
  'Inbox Zero',
  'Code Commit',
  'No Caffeine After 2 PM',
  'Gratitude Journaling',
  '10k Steps',
  'Learn New Concept',
  'Hydration (3L)',
  'Back Posture Check',
  'Plan Next Day',
  'Weekly Goal Review',
  'Limited Screen Time',
  'Healthy Breakfast',
  'Stretching'
]

const JOURNAL_ENTRIES = [
  {
    daysAgo: 0,
    sentiment: 'Accomplished',
    themes: ['Coding', 'Fitness', 'Focus'],
    content: `Today the architecture finally stopped fighting me. I spent four hours refactoring the auth middleware, and for the first time, the logic felt lean. It's funny how much energy we spend over-engineering things when a simple, direct approach is usually more secure anyway. Finished the day with a long run; my pace is improving, and my head feels clearer than it has all week. The consistency is paying off.`
  },
  {
    daysAgo: 1,
    sentiment: 'Frustrated',
    themes: ['Productivity', 'Boundaries', 'Focus'],
    content: `Total washout on the deep work front. A series of 'urgent' emails turned into a three-hour debugging session for a teammate. I need to get better at saying no, or at least 'not right now.' I did manage to finish my reading, though. The chapter on entropy in software systems was a bit too on-the-nose given the day I had. Tomorrow, the phone goes in the drawer until noon.`
  },
  {
    daysAgo: 2,
    sentiment: 'Energized',
    themes: ['Coding', 'Debugging', 'Focus'],
    content: `Woke up early and hit the flow state immediately. There is something magical about the 6 AM window—no notifications, just the terminal and the problem at hand. I finally cracked the caching issue that's been bloating the response times. It wasn't a code bug; it was a configuration oversight in the staging environment. Lesson learned: always check the environment variables first. Feeling energized.`
  },
  {
    daysAgo: 3,
    sentiment: 'Tired',
    themes: ['Rest', 'Reflection', 'Balance'],
    content: `Mid-week slump hit hard. I felt like I was moving through molasses all afternoon. I decided to lean into it rather than fight it—took a long walk, did some grocery shopping, and listened to a podcast on distributed systems. Sometimes the best way to solve a problem is to stop looking at it for a few hours. Skipped the evening review because I just wanted to sleep. Tracking it anyway.`
  },
  {
    daysAgo: 4,
    sentiment: 'Content',
    themes: ['Maintenance', 'Fitness', 'Organization'],
    content: `Spent the morning on 'The Boring Stuff.' Documentation, PR reviews, and updating dependencies. It's the digital equivalent of cleaning the kitchen, but the sense of order it brings is worth the lack of 'flashy' progress. My exercise streak is holding strong at 12 days. I'm noticing I don't get that 3 PM energy crash as often when I start the day with movement.`
  },
  {
    daysAgo: 5,
    sentiment: 'Curious',
    themes: ['Learning', 'Frontend', 'Study'],
    content: `Explored a new library today for the frontend redesign. It's powerful, but the learning curve is steeper than I anticipated. I spent most of my deep work session just reading the docs and trying to wrap my head around the state management pattern. It felt unproductive in the moment, but I know this 'slow' work is what prevents 'fast' mistakes later. Reading habit is the highlight of the day.`
  },
  {
    daysAgo: 6,
    sentiment: 'Reflective',
    themes: ['Review', 'Sleep', 'Goals'],
    content: `Weekly review day. Looking back at the logs, my deep work hours are trending up, but my sleep quality is trending down. I think I'm staying in 'problem-solving mode' too late into the evening. I'm setting a new hard rule: no screens after 9 PM. The goals for next week are focused on finishing the API integration and getting the first beta testers onboarded.`
  },
  {
    daysAgo: 7,
    sentiment: 'Proud',
    themes: ['Achievement', 'Coding', 'UI'],
    content: `Shipped the first major feature update. Seeing it live and functioning as intended is a massive weight off my shoulders. I got some early feedback that the UI feels a bit 'clunky' in the settings menu, which I agree with. It's functional but not beautiful. I'll spend some time on polish once the core logic is bulletproof. Celebrated with a proper meal and an extra hour of reading.`
  },
  {
    daysAgo: 8,
    sentiment: 'Disappointed',
    themes: ['Discipline', 'Habits', 'Self-Improvement'],
    content: `A day of 'Almosts.' I almost finished the deployment script. I almost went to the gym. I almost stayed off social media. It was one of those days where discipline felt like an uphill battle. The only thing that saved the day was the 30 minutes of reading before bed. It reminded me that progress isn't a straight line; it's a series of resets. Resetting for tomorrow.`
  },
  {
    daysAgo: 9,
    sentiment: 'Grateful',
    themes: ['Security', 'Coding', 'Review'],
    content: `Deep dive into security protocols today. I was auditing the new endpoints and found a potential vulnerability in how we handle file uploads. It took two hours to patch, but that's two hours well spent. If I hadn't been doing these regular reviews, that could have sat there for months. Feeling grateful for the 'paranoia' that comes with being a dev.`
  },
  {
    daysAgo: 10,
    sentiment: 'Motivated',
    themes: ['Database', 'Focus', 'Strategy'],
    content: `The power of a single task. I ignored everything else and just focused on the database migration. By 11 AM, it was done, tested, and merged. The rest of the day felt like a victory lap. I spent the afternoon researching some competitive products and realized we have a unique angle on the data privacy side. Need to lean into that in the next blog post.`
  },
  {
    daysAgo: 11,
    sentiment: 'Resilient',
    themes: ['Motivation', 'Habits', 'Coding'],
    content: `Woke up with zero motivation. Every task felt like a mountain. Instead of trying to scale the Everest of my to-do list, I just committed to doing five minutes of exercise. That turned into thirty. Then I committed to writing one function. That turned into two hours of coding. The 'just five minutes' trick is the most effective tool in my kit. Habits are the safety net for bad days.`
  },
  {
    daysAgo: 12,
    sentiment: 'Optimistic',
    themes: ['Planning', 'Goals', 'Collaboration'],
    content: `Productive collaboration session today. We mapped out the roadmap for the next three months. It's ambitious, maybe too much so, but it's better to aim high and miss than to aim low and hit. I need to make sure I'm not sacrificing my health for the sprint, though. 10k steps achieved, mostly while pacing during a long phone call.`
  },
  {
    daysAgo: 13,
    sentiment: 'Reflective',
    themes: ['Self-Awareness', 'Habits', 'Focus'],
    content: `Reflecting on the last two weeks. The habit of journaling has made me much more aware of my 'energy leaks.' I notice that when I skip the morning exercise, my focus at 2 PM is non-existent. The data doesn't lie. I'm starting to see the 'shape' of my ideal day, and it involves a lot more structure than I used to think I needed. Consistency over intensity.`
  },
  {
    daysAgo: 14,
    sentiment: 'Satisfied',
    themes: ['Learning', 'Reading', 'Systems Design'],
    content: `I finally finished that dense technical book on systems design. It took me nearly a month of consistent reading, but the mental models I've gained are already influencing how I think about the current project. It's like upgrading the OS of my brain. Code is easy; thinking is hard. Taking a rest day tomorrow to let all these new concepts settle in.`
  },
  {
    daysAgo: 15,
    sentiment: 'Content',
    themes: ['Maintenance', 'UI', 'Organization'],
    content: `A quiet day of maintenance. Fixed about a dozen small UI bugs that had been nagging me for weeks. It's not the most exciting work, but the product feels so much more professional now. I also took the time to reorganize my workspace—cluttered desk, cluttered mind. The evening review was short but positive. I'm in a good rhythm.`
  },
  {
    daysAgo: 16,
    sentiment: 'Frustrated',
    themes: ['Debugging', 'API', 'Problem-Solving'],
    content: `Hit a major roadblock with the third-party API. Their documentation is outdated, and their support is slow. I spent four hours banging my head against a wall before realizing I could just write a custom wrapper to handle the edge cases. It was a frustrating afternoon, but the solution I built is actually more robust than what they provided. Adapt and overcome.`
  },
  {
    daysAgo: 17,
    sentiment: 'Overwhelmed',
    themes: ['Focus', 'Time Management', 'Productivity'],
    content: `Focus was scattered today. I think I'm trying to juggle too many different types of tasks. Coding, marketing, and admin all require different mindsets, and switching between them is exhausting. Next week, I'm going to try 'thematic days'—Tuesdays for deep coding, Thursdays for outreach. Let's see if that reduces the mental friction.`
  },
  {
    daysAgo: 18,
    sentiment: 'Happy',
    themes: ['Fitness', 'Coding', 'Balance'],
    content: `Great morning workout. There's a specific kind of confidence that comes from pushing yourself physically before the rest of the world is even awake. It carried over into my work. I tackled a refactor I'd been dreading and knocked it out in ninety minutes. The evening was spent reading and relaxing. I feel like I'm finally finding a sustainable balance.`
  },
  {
    daysAgo: 19,
    sentiment: 'Curious',
    themes: ['Learning', 'Architecture', 'Technology'],
    content: `Spent the day learning about serverless architecture. It's a bit of a paradigm shift from what I'm used to, but the scalability benefits are hard to ignore. I built a small prototype to test some functions, and I'm impressed by the speed. I might migrate some of our background tasks to this model. Always be learning.`
  },
  {
    daysAgo: 20,
    sentiment: 'Calm',
    themes: ['Creativity', 'Fitness', 'Coding'],
    content: `I'm noticing a pattern: I get my best ideas when I'm not actually working. Today it happened during the morning stretch. A solution to the data-fetching lag just popped into my head. I need to trust the subconscious more and stop trying to 'force' insights. The 10k steps habit is helping facilitate this 'diffuse mode' thinking.`
  },
  {
    daysAgo: 21,
    sentiment: 'Proud',
    themes: ['Review', 'Habits', 'Goals'],
    content: `Weekly review time. Three weeks of consistent habits. I've read two books, exercised 18 times, and haven't missed a single deep work session. The momentum is real. My biggest challenge now is not getting complacent. I need to keep raising the bar for what I consider a 'productive' day. Goals for next week: finalize the landing page and start the beta outreach.`
  },
  {
    daysAgo: 22,
    sentiment: 'Anxious',
    themes: ['Marketing', 'Outreach', 'Business'],
    content: `Outreach day. It's way outside my comfort zone, but it's necessary. I sent 10 personalized emails to potential users. Even if only one person responds, it's a win. I'm learning that building the thing is only 20% of the battle; getting people to care is the other 80%. My posture was terrible today from sitting and drafting—need to be more mindful of the 'back posture' habit.`
  },
  {
    daysAgo: 23,
    sentiment: 'Excited',
    themes: ['Marketing', 'Communication', 'Business'],
    content: `Got a response from one of the outreach emails! They had some great questions that made me realize I haven't clearly communicated the value proposition of the security scanner. Spent the rest of the day rewriting the copy. It's much sharper now. It's amazing how a fifteen-minute conversation can save you weeks of building the wrong thing.`
  },
  {
    daysAgo: 24,
    sentiment: 'Peaceful',
    themes: ['Rest', 'Creativity', 'Nature'],
    content: `Deep work session was interrupted by a power outage. Talk about a forced break! I spent the time reading by the window and doing some manual planning on paper. It was actually quite refreshing to get away from the screen. It reminded me that the most important tools I have are my brain and a pen. Power came back on in the evening, but I decided to stay offline.`
  },
  {
    daysAgo: 25,
    sentiment: 'Motivated',
    themes: ['Coding', 'Testing', 'Focus'],
    content: `Back at it with high intensity. I'm working on the 'Pro' features now. It's complex logic, but I've got a clear plan. I'm using a TDD (Test Driven Development) approach this time, and it's saving me so much time on debugging. It's slower to write initially, but the peace of mind is worth every extra line of test code. Habit streak: 26 days.`
  },
  {
    daysAgo: 26,
    sentiment: 'Tired',
    themes: ['Resilience', 'Habits', 'Self-Care'],
    content: `Today was a test of discipline. I didn't sleep well, and I had a headache for most of the morning. I really wanted to just scrap the day and watch movies. Instead, I did a 'low-power' version of my habits. Short walk, 15 minutes of reading, and just one hour of deep work. It wasn't my best day, but I didn't break the chain. That's what matters.`
  },
  {
    daysAgo: 27,
    sentiment: 'Curious',
    themes: ['Design', 'UI', 'Creativity'],
    content: `Explored some new UI design patterns today. I'm trying to make the dashboard feel more intuitive without sacrificing the 'power user' features. It's a delicate balance. I spent most of the day in a design tool rather than the code editor. It's good to flex different muscles once in a while. 3L of water reached—feeling hydrated and focused.`
  },
  {
    daysAgo: 28,
    sentiment: 'Satisfied',
    themes: ['Documentation', 'Writing', 'Fitness'],
    content: `Finished the first draft of the user manual. Writing documentation is the best way to realize where your software is confusing. If I can't explain a feature in two sentences, the feature is too complicated. I've already flagged three areas that need a UI rethink. Exercise felt great today; I'm definitely getting stronger.`
  },
  {
    daysAgo: 29,
    sentiment: 'Excited',
    themes: ['Reflection', 'Habits', 'Achievement'],
    content: `One month of tracking. The transformation is subtle but profound. I'm more disciplined, more focused, and less prone to stress. The habits have become my 'operating system.' I don't have to think about doing them anymore; I just do them. I'm excited to see where I am in another 30 days. Today was a high-output day—everything just clicked.`
  },
  {
    daysAgo: 30,
    sentiment: 'Peaceful',
    themes: ['Rest', 'Nature', 'Balance'],
    content: `Took a 'Strategic Rest Day.' No coding, no work emails, no tech podcasts. I spent the day outdoors and focused on being present. I realized I've been a bit too obsessed with productivity lately. It's important to remember why I'm doing all this in the first place. I feel recharged and ready for the next sprint.`
  },
  {
    daysAgo: 31,
    sentiment: 'Focused',
    themes: ['Security', 'Coding', 'Organization'],
    content: `Back into the fray. I started the day with a massive inbox cleanup. Getting to zero feels like a weight being lifted. I then spent four hours on the payment gateway integration. It's a sensitive part of the app, so I'm moving slowly and double-checking everything. Security is the priority. Reading habit is still my favorite part of the day.`
  },
  {
    daysAgo: 32,
    sentiment: 'Frustrated',
    themes: ['Debugging', 'CSS', 'Technical Issues'],
    content: `Ran into a weird bug where the CSS wouldn't load properly on certain browsers. It turned out to be a caching issue with the CDN. These are the kinds of problems that drive you crazy because they have nothing to do with your code logic. Finally fixed it by 4 PM. Exercise was a quick HIIT session—short but effective.`
  },
  {
    daysAgo: 33,
    sentiment: 'Satisfied',
    themes: ['Performance', 'Coding', 'Gratitude'],
    content: `Deep work session was all about performance optimization. I managed to reduce the initial load time by 40% by lazy-loading some of the heavier components. It makes the whole app feel so much more responsive. I also spent some time on the gratitude journal tonight. It's easy to focus on what's wrong; it takes effort to focus on what's right.`
  },
  {
    daysAgo: 34,
    sentiment: 'Reflective',
    themes: ['Mentorship', 'Business', 'Focus'],
    content: `Had a productive meeting with a potential mentor. They gave me some harsh but fair feedback on the business model. It's better to hear it now than in six months. I've got some thinking to do. Habits were all checked off, but my mind was elsewhere during the reading session. Need to practice more focus during 'off' hours.`
  },
  {
    daysAgo: 35,
    sentiment: 'Excited',
    themes: ['Coding', 'UX', 'Achievement'],
    content: `Implemented a new 'Search' feature today. It uses some basic fuzzy matching logic to make finding items easier. It's a small addition, but it makes a huge difference in the user experience. I'm starting to see the finish line for the MVP (Minimum Viable Product). 10k steps achieved during a sunset walk. Kolkata is beautiful this time of year.`
  },
  {
    daysAgo: 36,
    sentiment: 'Reflective',
    themes: ['Review', 'Sleep', 'Goals'],
    content: `Weekly review. I've been a bit lax on the 'No caffeine after 2 PM' rule, and it's showing in my sleep data. I need to get back to being strict with that. Otherwise, progress is solid. I've hit 90% of my targets for the week. Next week is all about testing and bug-squashing. The 'Plan Next Day' habit is a lifesaver for staying organized.`
  },
  {
    daysAgo: 37,
    sentiment: 'Stressed',
    themes: ['Debugging', 'Security', 'Frustration'],
    content: `Stressful day. One of our dependencies had a major security update that broke half our codebase. I spent the entire day fixing the fallout. It was frustrating and repetitive, but it's part of the job. I did manage to get my exercise in, which helped burn off some of the frustration. Tomorrow will be better.`
  },
  {
    daysAgo: 38,
    sentiment: 'Resilient',
    themes: ['Coding', 'Inspiration', 'Reading'],
    content: `Finally finished the fix from yesterday. Everything is back to normal, and I even managed to improve some of the logic while I was in there. I spent the evening reading a biography of a famous engineer. It's inspiring to see that even the greats dealt with setbacks and 'wasted' days. Persistence is the only secret.`
  },
  {
    daysAgo: 39,
    sentiment: 'Focused',
    themes: ['Accessibility', 'Learning', 'Habits'],
    content: `Focusing on accessibility today. I want to make sure the app is usable for everyone. It's a lot of work to get the screen readers and keyboard navigation right, but it's the right thing to do. I'm learning a lot about how people actually interact with the web. Habits are holding steady. 39 days and counting.`
  },
  {
    daysAgo: 40,
    sentiment: 'Energized',
    themes: ['Flow State', 'Fitness', 'Meditation'],
    content: `High-energy day. I knocked out three major features before lunch. I was in a total flow state—the world just disappeared. I think the combination of the morning workout and the early start is the key. I spent the afternoon on some lighter admin tasks and then did a long meditation session. My mind feels incredibly quiet tonight.`
  },
  {
    daysAgo: 41,
    sentiment: 'Hopeful',
    themes: ['Planning', 'Business', 'Reading'],
    content: `I'm starting to think about the 'Post-Launch' phase. What does success look like? How will I handle growth? It's a bit scary but also exciting. I spent some time today writing out my thoughts on this. Reading habit is still going strong—finishing up a book on marketing for developers. Very relevant.`
  },
  {
    daysAgo: 42,
    sentiment: 'Neutral',
    themes: ['Habits', 'Consistency', 'Self-Discipline'],
    content: `A bit of a 'meh' day. I did the work, but I didn't feel particularly inspired. I guess that's where the habits really show their value. Even when the inspiration is missing, the system keeps you moving forward. I reached my step goal and stayed hydrated, so I'm counting it as a win. Consistency over everything.`
  },
  {
    daysAgo: 43,
    sentiment: 'Happy',
    themes: ['Productivity', 'Health', 'Habits'],
    content: `Weekly review. I'm officially ahead of schedule for the launch! This is a first for me. I think the 'Deep Work' sessions are the main reason. By carving out that uninterrupted time, I'm getting more done in four hours than I used to in eight. My health is also in a great place. The 'Healthy Breakfast' habit has been a game-changer.`
  },
  {
    daysAgo: 44,
    sentiment: 'Content',
    themes: ['UX', 'Testing', 'Fitness'],
    content: `Finalizing the onboarding flow. I want it to be as smooth as possible for new users. I've been testing it on some friends and making notes on where they get stuck. It's eye-opening to see how people use your product when you're not there to explain it. Exercise was a long bike ride. Felt good to get some speed.`
  },
  {
    daysAgo: 45,
    sentiment: 'Satisfied',
    themes: ['Marketing', 'Writing', 'Focus'],
    content: `Polishing the landing page. I'm trying to keep it simple and focused on the core problem we solve. I spent hours debating the phrasing of the headline. 'Words matter as much as code,' as a mentor once told me. I think I've finally got it right. Evening review was very satisfying. The end is in sight.`
  },
  {
    daysAgo: 46,
    sentiment: 'Focused',
    themes: ['Testing', 'Debugging', 'Habits'],
    content: `A day of testing, testing, and more testing. I'm trying to break my own app in every way possible. I found a couple of edge cases in the search logic that I missed earlier. Fixed them. It's tedious work, but I'd rather find these bugs now than have a user find them on day one. Reading session was a nice escape.`
  },
  {
    daysAgo: 47,
    sentiment: 'Anxious',
    themes: ['Launch', 'Habits', 'Fitness'],
    content: `Prep day for the beta launch. I'm getting the mailing list ready and double-checking the server capacity. Everything looks good to go. I feel a mix of nerves and excitement. I'm sticking to my habits to stay grounded. 10k steps achieved while listening to some lo-fi beats. I'm ready.`
  },
  {
    daysAgo: 48,
    sentiment: 'Excited',
    themes: ['Launch', 'Achievement', 'Fitness'],
    content: `Beta launch! I sent out the first batch of invites this morning. Now we wait. I've already had a few people sign up and start poking around. No major crashes so far—fingers crossed! I spent the rest of the day on some minor tweaks and responding to early questions. My exercise streak is now at 49 days. Tomorrow is the big 5-0.`
  },
  {
    daysAgo: 49,
    sentiment: 'Motivated',
    themes: ['Reflection', 'Habits', 'Achievement'],
    content: `50 days of consistency. Looking back at the first entry, it feels like a lifetime ago. The project has evolved, I've evolved, and the habits have become part of my identity. The beta feedback is coming in, and it's mostly positive. There's a lot of work ahead, but for the first time, I have zero doubt that I can handle it. One day at a time.`
  }
]

function daysAgoDate(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function pickRandom(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}

/**
 * Insert 5 random habits with random 14-day logs and 14 random journal entries
 * for the given user. Assumes the caller is within a transaction.
 * @param {import('pg').PoolClient} client
 * @param {string} userId
 */
async function seedDemoDataForUser(client, userId) {
  const selectedHabits = pickRandom(HABITS, 5)
  const habitIds = []

  for (const title of selectedHabits) {
    const { rows } = await client.query(
      'INSERT INTO habits (user_id, title) VALUES ($1, $2) RETURNING id',
      [userId, title]
    )
    habitIds.push(rows[0].id)
  }

  let logCount = 0
  // Start from day 3 (skip today, yesterday, and day before) so the auditor
  // always detects a broken streak (days_missed >= 3) for every demo habit.
  for (let day = 3; day < 17; day++) {
    const dateStr = daysAgoDate(day)
    for (const habitId of habitIds) {
      if (Math.random() > 0.55) continue
      const { rowCount } = await client.query(
        `INSERT INTO habit_logs (habit_id, completed_date)
         VALUES ($1, $2)
         ON CONFLICT (habit_id, completed_date) DO NOTHING`,
        [habitId, dateStr]
      )
      if (rowCount > 0) logCount++
    }
  }

  const selectedJournals = pickRandom(JOURNAL_ENTRIES, 14).sort((a, b) => a.daysAgo - b.daysAgo)
  let journalCount = 0

  for (const { daysAgo, content, sentiment, themes } of selectedJournals) {
    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - daysAgo)
    createdAt.setHours(21, Math.floor(Math.random() * 60), 0, 0)

    await client.query(
      `INSERT INTO journal_entries (user_id, content, sentiment, themes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $5)`,
      [userId, content, sentiment, JSON.stringify(themes), createdAt]
    )
    journalCount++
  }

  return { logCount, journalCount }
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
      await client.query('UPDATE users SET role = $1 WHERE id = $2', ['demo', userId])
      console.log(`  [seed] demo user already exists (${DEMO_EMAIL})`)
    } else {
      const { rows } = await client.query(
        'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [DEMO_EMAIL, passwordHash, DEMO_NAME, 'demo']
      )
      userId = rows[0].id
      console.log(`  [seed] created demo user: ${DEMO_EMAIL}`)
    }

    const { rows: habitCheck } = await client.query(
      'SELECT COUNT(*) FROM habits WHERE user_id = $1',
      [userId]
    )
    const { rows: journalCheck } = await client.query(
      'SELECT COUNT(*) FROM journal_entries WHERE user_id = $1',
      [userId]
    )

    const hasHabits = parseInt(habitCheck[0].count, 10) > 0
    const hasJournals = parseInt(journalCheck[0].count, 10) > 0

    let logCount = 0
    let journalCount = 0

    if (!hasHabits && !hasJournals) {
      const counts = await seedDemoDataForUser(client, userId)
      logCount = counts.logCount
      journalCount = counts.journalCount
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

export { seedDemoUser, seedDemoDataForUser }
