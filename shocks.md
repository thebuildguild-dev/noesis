# Feature Shock #1 – Mood Ring

---

## What Is This Feature?

Every time you write a journal entry, Noesis now quietly reads it in the background using Google
Gemini AI. It extracts two things: a single word that describes your emotional state (sentiment),
and a short list of topics you were thinking about (themes). These get saved back to the same
journal entry in the database.

Once enough entries are analyzed, a new page called **Mood Insights** becomes useful. It shows you
a line chart of your emotional ups and downs over 14 days, a color-coded calendar of each day's
mood, a ranked list of the topics you keep returning to, and a plain-English paragraph summarizing
how your week actually went.

The AI runs silently and never blocks you. If it fails, your entry is still saved. The insight
page just won't show that entry until analysis completes.

---

## How It Works — End to End

### Writing a Journal Entry (Human View)

1. You type something in the journal and hit save.
2. The entry appears in your list immediately. Nothing looks different.
3. Somewhere in the background, Gemini is reading that text and figuring out how you were feeling.
4. Within seconds, the entry now has a mood label and a set of themes attached to it in the
   database.
5. Next time you open Mood Insights, that entry contributes to your trend.

### Viewing Mood Insights (Human View)

1. You click **Mood Insights** in the sidebar (or bottom nav on mobile).
2. The page loads and shows a yellow sticky-note paragraph at the top — a plain English summary
   of how your last 7 days looked emotionally.
3. Below that is a line chart showing your mood score day by day across 14 days.
4. Below that is a small calendar grid — each day cell is colored green (positive), yellow
   (neutral), or red (negative). Days without entries are gray.
5. Click any day cell to see the mood label and themes for that day.
6. At the bottom, a horizontal bar chart ranks your most recurring themes.

### Resetting the Demo Account (Human View)

When you reset the demo account, all journal entries are wiped and re-seeded. Every seeded entry
already has a pre-set `sentiment` and `themes` value hardcoded into the seed data, so Mood Insights
is populated with real data immediately — no waiting for AI analysis.

---

## Code Flow — Journal Entry Creation

```
POST /api/journal
  └── auth.middleware.js         — verify Bearer JWT, attach req.user
  └── journal.controller.js      — createEntry()
        └── journal.service.js   — createEntry(userId, content)
              1. INSERT INTO journal_entries (user_id, content)
                 RETURNING id, content, sentiment, themes, created_at, updated_at
              2. cacheDelete(CacheKeys.journalList(userId))
              3. Fire-and-forget:
                   analyzeJournalEntry(content)          ← ai.service.js
                     └── GoogleGenAI({ apiKey })
                     └── ai.models.generateContent({ model, contents })
                     └── parse response JSON → { sentiment, themes }
                   → on success: updateJournalAnalysis(entry.id, { sentiment, themes })
                                   UPDATE journal_entries
                                   SET sentiment = $1, themes = $2
                                   WHERE id = $3
                   → on failure: silently ignored, entry unchanged
              4. Return entry to client immediately (AI runs in background)
  └── response.js  — created(res, { entry }, 'Journal entry created')
```

**Key behaviour:** The HTTP response is sent before AI analysis runs. The user never waits for
Gemini. The analysis result is written back to the DB row after the fact.

---

## Code Flow — Fetching Mood Insights

```
GET /api/journal/insights
  └── auth.middleware.js          — verify Bearer JWT
  └── journal.controller.js       — getInsights()
        └── journal.service.js    — getInsights(userId)
              1. SELECT DATE(created_at), sentiment, themes
                 FROM journal_entries
                 WHERE user_id = $1
                   AND created_at >= NOW() - INTERVAL '14 days'
                   AND sentiment IS NOT NULL
                 ORDER BY created_at DESC
              2. Build themeCounts map:
                   for each entry:
                     for each theme in entry.themes:
                       themeCounts[theme]++
              3. Return { entries, themeCounts }
  └── response.js  — success(res, { entries, themeCounts }, 'Insights fetched')
```

**Response shape:**
```json
{
  "success": true,
  "message": "Insights fetched",
  "data": {
    "entries": [
      { "date": "2026-03-10", "sentiment": "Positive", "themes": ["Study", "Focus"] }
    ],
    "themeCounts": {
      "Study": 4,
      "Focus": 3,
      "Sleep": 1
    }
  }
}
```

---

## Code Flow — Frontend Insights Page

```
InsightsPage mounts
  └── useEffect → useInsightsStore.fetchInsights()
        └── getJournalInsights()           ← journal.api.js
              └── authFetch('/api/journal/insights')
        └── set({ entries, themeCounts })

Render pipeline:
  entries + themeCounts
    ├── buildWeeklySummary(entries, themeCounts)
    │     1. Filter entries to last 7 days
    │     2. Count positive / negative / neutral sentiments
    │     3. Pick top 3 themes by frequency
    │     4. Determine dominant mood (positive / challenging / balanced)
    │     5. Compose plain-English paragraph
    │     → Returns string or null if no data
    │
    ├── chartData = days.map(date → { date, score, sentiment })
    │     score = getSentimentScore(sentiment)
    │       Positive/Happy/Energized/... → 5
    │       Neutral/Reflective/...       → 3
    │       Stressed/Anxious/Sad/...     → 1
    │
    ├── entryByDate = { "YYYY-MM-DD": entry }  (lookup map)
    │
    └── sortedThemes = Object.entries(themeCounts).sort by count.slice(0, 8)

Visible sections (in order):
  1. Weekly Summary Card    — yellow tape card, plain paragraph
  2. Mood Trend Chart       — Recharts LineChart, 14-day window
  3. Mood Calendar          — 7-column grid, color-coded cells, click for detail
  4. Top Themes             — horizontal bar chart, top 8 themes
```

---

## Code Flow — Demo Seed / Account Reset

```
seedDemoUser() or resetAccount(userId, 'demo')
  └── seedDemoDataForUser(client, userId)
        1. INSERT 5 random habits
        2. INSERT random habit_logs for last 14 days
        3. Pick 14 random entries from JOURNAL_ENTRIES pool (50 entries)
           Each entry has: { daysAgo, content, sentiment, themes }
        4. INSERT INTO journal_entries
             (user_id, content, sentiment, themes, created_at, updated_at)
           VALUES ($1, $2, $3, $4::jsonb, $5, $5)
           → sentiment and themes pre-populated — no AI call needed
```

**Why pre-populate?** Mood Insights would be empty after a reset if we relied on AI analysis,
since the fire-and-forget only triggers on new entry creation, not on seed inserts. Hardcoding
the values into seed data means the page is immediately useful.

---

## AI Integration

**Package:** `@google/genai` (latest Google Gen AI SDK)

**Environment variables required:**

| Variable                  | Example value          | Purpose                       |
| ------------------------- | ---------------------- | ----------------------------- |
| `GEMINI_API_KEY`          | `AIza...`              | Authenticates Gemini API calls |
| `GEMINI_GENERATION_MODEL` | `gemini-2.5-flash`     | Model used for generation      |

**SDK usage pattern (`ai.service.js`):**
```js
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey })
const response = await ai.models.generateContent({
  model: modelName,
  contents: prompt
})
const text = response.text   // property, not a function call
```

**Prompt sent to Gemini:**
```
Analyze the following journal entry.

Extract:
- sentiment (one word describing emotional state, e.g. Positive, Negative, Neutral,
  Anxious, Happy, Sad, Motivated, Stressed, Calm, Excited)
- themes (3-5 key topics as short words or phrases)

Return JSON only, no markdown formatting.

Example output:
{"sentiment": "Positive", "themes": ["Study", "Focus", "Productivity"]}

Journal entry:
<user text here>
```

**Response handling:**
1. Strip any accidental markdown code fences (` ```json ... ``` `)
2. `JSON.parse()` the cleaned string
3. Validate shape: `sentiment` must be a string, `themes` must be an array
4. Return `{ sentiment, themes }` or `null` on any error

---

## Database Schema Changes

**Migration:** `backend/src/db/migrations/009_add_journal_sentiment_themes.sql`

```sql
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS sentiment TEXT,
  ADD COLUMN IF NOT EXISTS themes    JSONB;
```

| Column      | Type  | Nullable | Description                                           |
| ----------- | ----- | -------- | ----------------------------------------------------- |
| `sentiment` | TEXT  | YES      | One-word emotion label — populated by Gemini or seed  |
| `themes`    | JSONB | YES      | JSON array of topic strings — e.g. `["Focus","Rest"]` |

Both columns default to `NULL`. Existing entries without AI analysis are excluded from
insights queries via `WHERE sentiment IS NOT NULL`.

---

## Files Changed

| File | Type | What changed |
| ---- | ---- | ------------ |
| `backend/src/db/migrations/009_add_journal_sentiment_themes.sql` | New | Adds sentiment + themes columns |
| `backend/src/services/ai.service.js` | New | Gemini API wrapper, `analyzeJournalEntry()` |
| `backend/src/modules/journal/journal.service.js` | Modified | Fire-and-forget AI after create; new `getInsights()` |
| `backend/src/modules/journal/journal.controller.js` | Modified | New `getInsights` handler |
| `backend/src/modules/journal/journal.routes.js` | Modified | `GET /insights` route added |
| `backend/src/db/seed.js` | Modified | All 50 entries now include `sentiment` + `themes`; INSERT updated |
| `backend/package.json` | Modified | `@google/genai` added |
| `frontend/src/api/journal.api.js` | Modified | `getJournalInsights()` added |
| `frontend/src/store/insights.store.js` | New | Zustand store for insights data |
| `frontend/src/pages/insights/InsightsPage.jsx` | New | Full insights page with chart, calendar, themes, summary |
| `frontend/src/router.jsx` | Modified | `/insights` protected route |
| `frontend/src/components/layout/Sidebar.jsx` | Modified | "Mood Insights" nav link |
| `frontend/src/components/layout/BottomNav.jsx` | Modified | "Insights" mobile tab |
| `frontend/package.json` | Modified | `recharts` added |

---

## Weekly Summary Paragraph

Generated on the frontend — no extra API call. `buildWeeklySummary(entries, themeCounts)`:

1. Filters entries from the last 7 days
2. Classifies each sentiment as positive / negative / neutral using hardcoded sets
3. Determines the dominant mood category
4. Picks the top 3 themes by frequency
5. Collects up to 3 distinct raw sentiment labels from the week
6. Assembles a human-readable paragraph + closing line

Example output:
> *Over the past 7 days you made 5 journal entries, with your mood leaning positive.
> Your emotional range included energized, calm, motivated.
> The themes that came up most were Focus, Coding and Sleep.
> Keep the momentum going.*

---

## Result

Users write journal entries as they always did. AI analysis happens invisibly in the background.
When they navigate to **Mood Insights** they see — without any extra effort — a clear picture of:

- whether their week trended up or down emotionally
- which specific days were hard and which were good
- what topics are occupying their mind most
- a one-paragraph plain-English summary of how the week actually felt
