# Shock #1 — Mood Ring

AI sentiment analysis on journal entries. Every entry gets a mood label and themes extracted by Gemini in the background. A dedicated Insights page visualises the data.

---

## Journal Entry Creation

```
POST /api/journal
  → auth.middleware.js          verify JWT
  → journal.controller.js       createEntry()
  → journal.service.js
      1. INSERT journal entry, return row
      2. cacheDelete journalList cache
      3. fire-and-forget:
           ai.service.js → analyzeJournalEntry(content)
             GoogleGenAI.models.generateContent()
             parse JSON response → { sentiment, themes }
           → UPDATE journal_entries SET sentiment, themes WHERE id
      4. return entry to client (AI runs after response)
```

## Mood Insights Fetch

```
GET /api/journal/insights
  → auth.middleware.js
  → journal.controller.js       getInsights()
  → journal.service.js
      SELECT date, sentiment, themes
      FROM journal_entries
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '14 days'
        AND sentiment IS NOT NULL
      build themeCounts map from all entries
      return { entries, themeCounts }
```

## Frontend Insights Page

```
InsightsPage mounts
  → useInsightsStore.fetchInsights()
  → GET /api/journal/insights
  → store entries + themeCounts

Render:
  buildWeeklySummary(entries, themeCounts)
    filter last 7 days → count pos/neg/neutral → pick top 3 themes → compose paragraph

  chartData = entries mapped to { date, score }
    score: positive=5, neutral=3, negative=1

  Mood Calendar = 14-day grid, cell color by sentiment
  Top Themes = horizontal bar chart, top 8 themes
```

## Demo Seed

```
seedDemoDataForUser(client, userId)
  INSERT 5 random habits
  INSERT habit_logs (days 3–16 ago, ~45% fill rate — no recent logs for broken streaks)
  INSERT 14 journal entries from a pool of 50
    each entry has sentiment + themes pre-set → insights page populated immediately
```

## Database

Migration `009_add_journal_sentiment_themes.sql`

```sql
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS sentiment TEXT,
  ADD COLUMN IF NOT EXISTS themes    JSONB;
```

## Key Files

| File                                             | Role                                    |
| ------------------------------------------------ | --------------------------------------- |
| `backend/src/services/ai.service.js`             | Gemini wrapper, `analyzeJournalEntry()` |
| `backend/src/modules/journal/journal.service.js` | fire-and-forget AI + `getInsights()`    |
| `backend/src/db/migrations/009_*.sql`            | schema change                           |
| `backend/src/db/seed.js`                         | pre-populated sentiment + themes        |
| `frontend/src/pages/insights/InsightsPage.jsx`   | full insights page                      |
| `frontend/src/store/insights.store.js`           | Zustand store                           |

---

# Shock #2 — Ruthless Accountability Coach

Background agents scan every user's habits every minute (dev) / 10 minutes (prod). Broken streaks trigger a Gemini-generated accountability message, delivered as an in-app notification and an email.

---

## Agent Job

```
node-cron (*/1 dev, */10 prod)
  → auditor.job.js → audit()
  → auditor.agent.js
      SELECT habit_id, user_id, habit_title, user_email,
             CURRENT_DATE - COALESCE(MAX(completed_date), created_at::date) AS days_missed
      FROM habits JOIN users LEFT JOIN habit_logs
      HAVING days_missed >= 2
  → for each habit → enforce({ userId, userEmail, habitId, habitTitle, daysMissed })
```

## Enforcer Agent

```
enforcer.agent.js — enforce({ userId, userEmail, habitId, habitTitle, daysMissed })
  1. getMemory(userId, habitId) from agent_memory
  2. if last_sent_at < 24h ago → skip (cooldown)
  3. level = prevLevel + 1 (capped at 3)
  4. getRecentJournalEntries(userId, 5)
  5. buildPrompt(habitTitle, daysMissed, level, journalEntries)
  6. gemini.service.js → generateAccountabilityMessage(prompt) → message text
  7. INSERT INTO agent_messages (user_id, habit_id, message, escalation_level)
  8. upsertMemory(userId, habitId, level)
  9. sendEmail → accountability template → user's email (fire-and-forget)
```

## Escalation

| Level | Tone                     | When           |
| ----- | ------------------------ | -------------- |
| 1     | Supportive reminder      | First message  |
| 2     | Sarcastic accountability | Second message |
| 3     | Ruthless coach           | Third+ message |

24-hour cooldown per habit. Level increments on each send, capped at 3.

## Accountability Email

```
emailTemplates.js → accountability({ email, habitTitle, daysMissed, message, escalationLevel })
  subject: "[AppName] Your coach is watching — "{habit}" (Xd missed)"
  body:
    habit name + days missed table
    coach message in a coloured quote block
    accent color: green (L1) / amber (L2) / red (L3)
```

## Frontend Delivery

```
AgentNotificationContainer (main.jsx)
  polls GET /api/agent/messages every 60s
  → agent.controller.js
      SELECT unseen messages for user
      UPDATE SET seen = true
      return messages[]
  → agent.store.js stores queue
  → AgentNotification.jsx shows first message in bottom-right card
      dismiss removes from local queue
```

## Database

Migration `010_create_agent_messages.sql`

```sql
CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  escalation_level INTEGER NOT NULL DEFAULT 1,
  seen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Migration `011_create_agent_memory.sql`

```sql
CREATE TABLE agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  message_count INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  escalation_level INTEGER NOT NULL DEFAULT 1,
  UNIQUE (user_id, habit_id)
);
```

## Key Files

| File                                               | Role                                                   |
| -------------------------------------------------- | ------------------------------------------------------ |
| `backend/src/jobs/auditor.job.js`                  | cron job, env-aware schedule                           |
| `backend/src/agents/auditor.agent.js`              | broken streak SQL query                                |
| `backend/src/agents/enforcer.agent.js`             | cooldown + escalation + Gemini + email                 |
| `backend/src/agents/memory.service.js`             | read/write agent_memory                                |
| `backend/src/services/gemini.service.js`           | `generateAccountabilityMessage()`                      |
| `backend/src/repositories/habit.repository.js`     | `getBrokenStreakHabits()`, `getRecentJournalEntries()` |
| `backend/src/utils/emailTemplates.js`              | `accountability()` email template                      |
| `backend/src/modules/agent/agent.routes.js`        | `GET /api/agent/messages`                              |
| `frontend/src/store/agent.store.js`                | Zustand store, polling                                 |
| `frontend/src/components/ui/AgentNotification.jsx` | notification card UI                                   |
