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

---

# Feature Shock #3 – Proof of Work

Users must provide visual proof when completing certain habits. Instead of clicking a checkbox, users upload an image that is verified by a two-step Gemini multimodal pipeline.

---

## Overview

Habits can be flagged with `requires_proof = true` when created. For these habits, the normal "Mark complete" button is replaced with an "Upload Proof" button. The user selects an image, which is analysed by Gemini in two sequential steps before the habit log is updated.

---

## Multimodal Architecture

```
POST /api/habits/:id/proof (multipart image)
  → auth.middleware.js          verify JWT
  → multer                      save file to backend/uploads/
  → habits.controller.js        submitProof()
  → habits.service.js
      1. ownership check (404/403)
      2. UPSERT habit_log (proof_image_url, status='pending')
      3. verify({ logId, userId, habitId, habitTitle, imagePath })
           → proof_verifier.agent.js
               Step 1: vision.service.js → describeImage()
               Step 2: vision.service.js → verifyHabitProof()
               UPDATE habit_log (status, comment, confidence, verified_at)
               if approved → bust streak caches
      4. return verification result to client
```

---

## Vision Analysis Pipeline

### Step 1 – Vision Description

```
vision.service.js → describeImage(imagePath)
  1. readFile(imagePath) → base64 encode
  2. GoogleGenAI.models.generateContent({
       model: GEMINI_GENERATION_MODEL,
       contents: [{ parts: [{ inlineData: { mimeType, data } }, { text: prompt }] }]
     })
  3. return one-sentence image description
```

Prompt: "Describe what is visible in this image in one sentence. Focus on objects relevant to habits such as books, food, exercise equipment, study materials."

Example result: `"An open book placed on a desk."`

### Step 2 – Habit Reasoning

```
vision.service.js → verifyHabitProof(habitTitle, visionDescription)
  1. GoogleGenAI.models.generateContent({
       model: GEMINI_GENERATION_MODEL,
       contents: text prompt
     })
  2. parse JSON response
  3. return { approved, reason, confidence }
```

Return schema: `{ "approved": true/false, "reason": "…", "confidence": 0–1 }`

---

## Gemini Vision Integration

- Uses `@google/genai` v1.x with `inlineData` for image bytes
- `MIME type` inferred from file extension (jpg/png/webp/gif)
- Both steps use `GEMINI_GENERATION_MODEL` from config (must be a multimodal model, e.g. `gemini-2.0-flash`)
- File: `backend/src/services/vision.service.js`

---

## Database Schema Changes

Migration `012_add_proof_to_habits_and_logs.sql`

```sql
-- habits table: opt-in proof requirement
ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS requires_proof BOOLEAN NOT NULL DEFAULT false;

-- habit_logs table: proof and verification columns
ALTER TABLE habit_logs
  ADD COLUMN IF NOT EXISTS proof_image_url          TEXT,
  ADD COLUMN IF NOT EXISTS verification_status      TEXT CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_comment     TEXT,
  ADD COLUMN IF NOT EXISTS vision_description       TEXT,
  ADD COLUMN IF NOT EXISTS verification_confidence  FLOAT,
  ADD COLUMN IF NOT EXISTS verified_at              TIMESTAMPTZ;
```

---

## Image Upload Flow

- `POST /api/habits/:id/proof` — multipart `proof` field
- Multer disk storage: saves to `backend/uploads/proof_<timestamp>.<ext>`
- File size limit: 10 MB; accepted types: JPEG, PNG, WebP, GIF
- Static file serving: `GET /uploads/<filename>` via `express.static`
- Image URL stored in `habit_logs.proof_image_url` as `/uploads/filename`

---

## Frontend Verification UI

### ProofUploadModal

Located at `frontend/src/components/ui/ProofUploadModal.jsx`.

States:

1. **Upload** — camera icon + file chooser + optional image preview + "Verify Proof" button
2. **Verifying** — uploaded image (dimmed) + spinner + "AI analyzing proof…"
3. **Result** — full `VerificationReport` with image, analysis, reasoning, result badge

### VerificationReport (inline component)

```
Proof Verification

Image Analysis
"An open book placed on a desk."

Reasoning
"The image clearly shows a book which fits the habit."

Confidence: 92%

✓ Proof Verified        (green, if approved)
✗ Verification Failed   (red, if rejected)
```

---

## Proof History (HabitDetailPage)

For habits with `requires_proof`, a "Proof History" section appears below the completion calendar. Each entry is a collapsible row showing:

- Date + status badge (verified / rejected)
- Expanded: proof image + Image Analysis + Reasoning + Confidence

---

## Habit Creation

The "Add a new habit" form includes a "Require photo proof" checkbox. When checked, the habit is created with `requires_proof = true`.

On `HabitsPage`, proof habits display:

- A grey "proof required" label under the title
- An "Upload Proof" button (blue, camera icon) instead of "Mark complete"
- A "Verified" state (shield icon) when today's proof has been approved

---

## Key Files

| File                                              | Role                                          |
| ------------------------------------------------- | --------------------------------------------- |
| `backend/src/db/migrations/012_add_proof_*.sql`   | schema: requires_proof + proof columns        |
| `backend/src/services/vision.service.js`          | Step 1 vision + Step 2 reasoning              |
| `backend/src/agents/proof_verifier.agent.js`      | orchestrates pipeline + DB update             |
| `backend/src/modules/habits/habits.service.js`    | `submitProof()`, `getProofHistory()`          |
| `backend/src/modules/habits/habits.controller.js` | `submitProof`, `getProofHistory` handlers     |
| `backend/src/modules/habits/habits.routes.js`     | multer + `POST /:id/proof`, `GET /:id/proofs` |
| `backend/src/app.js`                              | `express.static('/uploads')`                  |
| `frontend/src/components/ui/ProofUploadModal.jsx` | upload + loading + result modal               |
| `frontend/src/api/client.js`                      | `authUploadFetch()` for multipart uploads     |
| `frontend/src/api/habits.api.js`                  | `submitHabitProof()`, `getProofHistory()`     |
| `frontend/src/pages/habits/HabitsPage.jsx`        | proof upload flow + "require proof" toggle    |
| `frontend/src/pages/habits/HabitDetailPage.jsx`   | `ProofHistorySection` component               |
| `frontend/src/store/habits.store.js`              | `markProofApproved()`, `createHabit` update   |
