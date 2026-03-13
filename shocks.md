# AI Protosprint Feature Shock Implementation

Noesis is a habit-tracking and journaling application with an integrated AI layer built on top of Google Gemini. The four AI features described in this document are called **Feature Shocks** — each one adds a dimension of intelligence to the core product.

The system implements:

- **Text Analysis** — Automatic sentiment and theme extraction from journal entries (Shock #1)
- **Multi-Agent System** — Autonomous background agents that detect habit failures and generate personalized accountability messages (Shock #2)
- **Multimodal Vision Verification** — Image upload and AI-powered visual proof verification for habit completion (Shock #3)
- **AI Interrogator Wildcard** — A confrontational AI gate that challenges users before they delete their data (Wildcard)

All AI features use Google Gemini via the `@google/genai` SDK, configured through `GEMINI_API_KEY` and `GEMINI_GENERATION_MODEL` environment variables.

---

# Feature Shock #1 — The Mood Ring

## Problem

Users write daily journal entries but have no way to understand their emotional patterns over time. Manual self-reflection is inconsistent and surface-level.

## Solution

Automatic sentiment and theme extraction. Every journal entry is analyzed by Gemini immediately after it is saved. The analysis extracts a sentiment label (e.g. `Positive`, `Anxious`, `Motivated`) and 3–5 theme keywords (e.g. `["work", "sleep", "productivity"]`). These are persisted back to the database and surfaced through an emotional dashboard.

---

## Implementation Flow

```
Journal Entry Saved
       ↓
Sentiment Analysis
  analyzeJournalEntry(content)   [Gemini text prompt]
       ↓
Theme Extraction
  { sentiment: string, themes: string[] }
       ↓
Database Update
  UPDATE journal_entries SET sentiment, themes WHERE id = $entryId
       ↓
Emotional Dashboard Visualization
  GET /api/journal/insights → mood chart, calendar, theme bar chart
```

Analysis is triggered **fire-and-forget** — the POST /api/journal response is returned to the client immediately and sentiment processing happens asynchronously in the background. Journal edits reset both columns to NULL and re-trigger analysis.

---

## Backend Architecture

### services/ai.service.js

The core of Shock #1. Sends a single structured prompt to Gemini requesting:

- A single-word sentiment label from a defined vocabulary: Positive, Negative, Neutral, Anxious, Happy, Angry, Sad, Motivated, Stressed, Calm, Excited
- 3–5 theme keywords as short phrases

The model is instructed to return raw JSON only (no markdown fencing). The service strips any accidental code fences before parsing. Returns `{ sentiment, themes }` or `null` on any failure.

There is no separate keyword extractor utility — theme extraction is handled inline within the same Gemini prompt, keeping the implementation simple and the AI call count at one per entry.

### Sentiment classification logic

Gemini responds with a single word label. The frontend maps these into display categories using two hard-coded `Set` collections (`POSITIVE_SENTIMENTS`, `NEGATIVE_SENTIMENTS`) with approximately 13 terms each.

### routes/journal.routes.js

```
POST   /api/journal            → createEntry
GET    /api/journal            → getEntries (paginated, ?page=&limit=)
GET    /api/journal/day        → getEntriesForDate (?from=ISO&to=ISO)
GET    /api/journal/insights   → getInsights
PUT    /api/journal/:id        → updateEntry
DELETE /api/journal/:id        → deleteEntry
```

All routes require `authMiddleware`.

### Journal Service — fire-and-forget pattern

`createEntry(userId, content)` — Inserts the entry row, then calls `analyzeJournalEntry(content)` fire-and-forget via `.then().catch()`. On success, writes results back via `updateJournalAnalysis(entryId, { sentiment, themes })`.

`updateEntry(userId, entryId, content)` — Resets `sentiment = NULL` and `themes = NULL` on edit, then re-triggers analysis fire-and-forget.

`getInsights(userId)` — Aggregates the last 14 days of journal entries. Returns per-day `{ date, sentiment, themes }` rows and a `themeCounts` frequency map computed in JavaScript.

### Storing metadata

Sentiment is stored as plain `TEXT`. Themes are stored as `JSONB` (a JSON array of strings), which allows efficient querying and flexible schema evolution.

---

## Database Changes

**Migration:** `backend/src/db/migrations/009_add_journal_sentiment_themes.sql`

`journal_entries` table extended with:

```sql
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS sentiment TEXT,
  ADD COLUMN IF NOT EXISTS themes    JSONB;
```

Both columns are nullable — entries that have not yet been analyzed (or where analysis failed) remain `NULL`.

---

## Emotional Dashboard

**File:** `frontend/src/pages/insights/InsightsPage.jsx`

Four visualizations driven by `GET /api/journal/insights`:

**Mood trend chart** — A Recharts `LineChart` mapping a numeric score per day over the past 14 days (Positive=5, Neutral=3, Negative/anxious=1).

**Theme summary** — A horizontal bar chart of the 8 most frequent journal themes over the period, built from the `themeCounts` map returned by the insights API.

**Mood Calendar** — A 14-day grid where each cell is colored green (positive), amber (neutral), red (negative), or grey (no entry). Clicking a cell reveals that day's sentiment label and theme badges.

**Weekly emotional insight** — A plain-English narrative auto-generated from the dominant sentiment category over the period (e.g. "This has been a positive week").

**State management:** `frontend/src/store/insights.store.js` — Zustand store; `fetchInsights()` calls `GET /api/journal/insights` and stores `{ entries, themeCounts }`.

---

# Feature Shock #2 — The Ruthless Accountability Coach

The second shock is a fully autonomous multi-agent system. Two agents operate independently in the background with no user interaction required.

**Agent A (Auditor)** — Periodically scans all habits across all users. Detects broken streaks.

**Agent B (Enforcer)** — Receives a specific habit with a broken streak. Generates a personalized accountability message using recent journal context and an escalating tone. Delivers it to the user.

---

## Agent Architecture

```
Cron Job (node-cron)
       ↓
Auditor Agent
  ↓ getBrokenStreakHabits()
Breaks Streak Detected (days_missed >= 2)
       ↓
  for each habit → Enforcer Agent
       ↓
  24h cooldown check (agent_memory)
       ↓
  Fetch last 5 journal entries (context)
       ↓
  Determine escalation level (1 → 2 → 3)
       ↓
Gemini Message Generation
       ↓
Notification System
  INSERT agent_messages → frontend polls → card delivered
  Fire-and-forget accountability email
```

---

## Agent A — Auditor

### Background job and cron scheduler

**Files:** `backend/src/agents/auditor.agent.js`, `backend/src/jobs/auditor.job.js`

The auditor is a thin orchestrator. It calls `getBrokenStreakHabits()` from the habit repository and iterates the results, forwarding each broken habit to the enforcer.

```js
async function audit() {
  const habits = await getBrokenStreakHabits()
  for (const habit of habits) {
    await enforce({ userId, userEmail, habitId, habitTitle, daysMissed })
  }
}
```

The job scheduler wraps this in a `node-cron` schedule:

```
Development:  */1 * * * *   (every 1 minute)
Production:   */10 * * * *  (every 10 minutes)
```

### Scanning habit logs

`getBrokenStreakHabits()` in `backend/src/repositories/habit.repository.js` runs a SQL JOIN across `habits`, `users`, and `habit_logs`. It computes `days_missed` as:

```sql
CURRENT_DATE - COALESCE(MAX(completed_date), created_at::date) AS days_missed
```

The `HAVING days_missed >= 2` clause filters to habits that have been neglected for two or more days. Returns `habit_id`, `user_id`, `habit_title`, `user_email`, and `days_missed`.

---

## Agent B — Enforcer

**File:** `backend/src/agents/enforcer.agent.js`

The enforcer manages the full personalized message generation and delivery pipeline.

### Personalized message generation

1. **Load memory** — Reads `agent_memory` for the `(userId, habitId)` pair to get `message_count`, `last_sent_at`, and `escalation_level`.
2. **24h cooldown** — Skips if a message was already sent within the last 24 hours.
3. **Escalation level** — Determines tone:
   - Level 1: supportive and warm (first message)
   - Level 2: sarcastic and witty (second message)
   - Level 3: ruthless and blunt (third+ message, capped here)
4. **Retrieve user journal entries** — Fetches the last 5 journal entries via `getRecentJournalEntries(userId, 5)`.
5. **Analyze context** — The Gemini prompt receives the habit name, days missed, tone instructions for the escalation level, and journal snippets to personalize the message to the user's recent mindset.
6. **Generate sarcastic accountability message using Gemini** — Calls `generateAccountabilityMessage(prompt)` from `gemini.service.js`. Returns a natural language accountability message.
7. **Persist** — `INSERT INTO agent_messages` with `user_id`, `habit_id`, `message`, `escalation_level`, `seen = false`.
8. **Update memory** — `upsertMemory(userId, habitId, newLevel)` increments `message_count`, sets `last_sent_at = NOW()`, and records the new escalation level.
9. **Email** — Fire-and-forget email using the `accountability` email template.

---

## Database Changes

**Migration:** `backend/src/db/migrations/010_create_agent_messages.sql`

`agent_messages` table stores the generated messages and delivery state:

```sql
CREATE TABLE IF NOT EXISTS agent_messages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id         UUID        REFERENCES habits(id) ON DELETE SET NULL,
  message          TEXT        NOT NULL,
  escalation_level INTEGER     NOT NULL DEFAULT 1,
  seen             BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Migration:** `backend/src/db/migrations/011_create_agent_memory.sql`

`agent_memory` stores per-habit agent state for cooldown and escalation tracking:

```sql
CREATE TABLE IF NOT EXISTS agent_memory (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id         UUID        NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  message_count    INTEGER     NOT NULL DEFAULT 0,
  last_sent_at     TIMESTAMPTZ,
  escalation_level INTEGER     NOT NULL DEFAULT 1,
  UNIQUE (user_id, habit_id)
);
```

The `UNIQUE (user_id, habit_id)` constraint ensures exactly one memory record per habit per user, enabling clean upsert semantics.

---

## Message Delivery

**Backend API:** `GET /api/agent/messages` (`backend/src/modules/agent/agent.routes.js`)

The controller reads all unseen messages for the authenticated user and marks them `seen = true` in the same request (read-and-mark pattern). No second round-trip needed from the client.

**Frontend notification system** — `frontend/src/components/ui/AgentNotification.jsx`

`AgentNotificationContainer` renders as a fixed bottom-right card. It displays one message at a time (index 0 of the local queue). Dismissing removes the message from the local array without a server call.

**Polling** — `frontend/src/store/agent.store.js` (Zustand). `startPolling()` sets a `setInterval` calling `GET /api/agent/messages` every 60 seconds. `startPolling()` / `stopPolling()` are triggered by authentication state changes in `main.jsx`.

---

# Feature Shock #3 — Proof of Work (Multimodal)

## Problem

Users can mark any habit as complete without actually performing it. The system has no way to verify that a reported "completed" workout or study session actually happened.

## Solution

Preventing users from cheating by requiring visual proof. Habits can be configured with `requires_proof = true`. When completing such a habit, the user must upload an image. Gemini runs a two-step multimodal pipeline: first describing what is visible in the image, then reasoning about whether the image constitutes evidence of the claimed habit.

---

## Multimodal Pipeline

```
Image Upload
  POST /api/habits/:id/proof  (multipart)
       ↓
SHA-256 hash computed → duplicate check (anti-cheat)
       ↓
INSERT habit_log with proof_image_url, status='pending'
       ↓
Vision Analysis
  describeImage(imagePath)  →  Gemini Vision
  "A bowl of salad with vegetables."
  stored as vision_description
       ↓
Habit Reasoning
  verifyHabitProof(habitTitle, visionDescription)  →  Gemini Text
  { approved, reason, confidence }
       ↓
Verification Decision
  UPDATE habit_logs SET verification_status, verification_comment,
    vision_description, verification_confidence, verified_at
       ↓
Habit Log Update
  if approved → bust streak + dashboard caches
  return full result to client
```

---

## Vision Step

**File:** `backend/src/services/vision.service.js` — `describeImage(imagePath)`

Reads the uploaded file from disk, base64-encodes it, and sends it to Gemini as a multimodal message (image bytes + text prompt). The prompt instructs Gemini to describe the image in a single sentence relevant to habit verification.

The returned one-sentence description is stored in `vision_description`.

Example result: `"An open book placed on a desk."`

Both vision steps use the `GEMINI_GENERATION_MODEL` from config (configured as a multimodal model, e.g. `gemini-2.0-flash`).

---

## Reasoning Step

**File:** `backend/src/services/vision.service.js` — `verifyHabitProof(habitTitle, visionDescription)`

A second Gemini call (text only) receives the habit title and the vision description from step 1. The prompt asks Gemini to determine whether the described scene constitutes evidence of the claimed habit.

Returns structured JSON:

```json
{
  "approved": true,
  "reason": "The image shows a prepared meal consistent with healthy eating habits.",
  "confidence": 0.87
}
```

The fields `approved`, `reason`, and `confidence` are written back to `habit_logs`.

---

## Database Changes

**Migration:** `backend/src/db/migrations/012_add_proof_to_habits_and_logs.sql`

`habit_logs` table extended with:

```sql
ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS requires_proof BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE habit_logs
  ADD COLUMN IF NOT EXISTS proof_image_url          TEXT,
  ADD COLUMN IF NOT EXISTS verification_status      TEXT
        CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_comment     TEXT,
  ADD COLUMN IF NOT EXISTS vision_description       TEXT,
  ADD COLUMN IF NOT EXISTS verification_confidence  FLOAT,
  ADD COLUMN IF NOT EXISTS verified_at              TIMESTAMPTZ;
```

**Migration:** `backend/src/db/migrations/013_add_proof_hash.sql`

```sql
ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS proof_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS habit_logs_proof_hash_idx
  ON habit_logs (proof_hash) WHERE proof_hash IS NOT NULL;
```

`proof_hash` is a SHA-256 digest of the uploaded image file. The partial unique index (only non-null values) prevents the same image from being reused as proof across different habits or users — a key anti-cheat measure. A 409 Conflict is returned if a duplicate hash is detected.

---

## Frontend Proof UI

**File:** `frontend/src/components/ui/ProofUploadModal.jsx`

The modal walks the user through three states:

**1. Upload state** — Camera icon drop zone with a hidden `<input type="file" accept="image/*">`. Accepts JPG, PNG, WebP, GIF up to 10 MB. Shows a preview thumbnail after file selection.

**2. Verifying state** — Spinner with "AI analyzing proof…" and sub-text "Running vision analysis and habit reasoning". Shown while the server pipeline runs.

**3. Result state** — The `VerificationReport` sub-component renders:

```
Proof Verification

Image Analysis
"An open book placed on a desk."

Reasoning
"The image clearly shows reading material consistent with this habit."

Confidence: 87%

✓ Proof Verified        (green badge, if approved)
✗ Verification Failed   (red badge, if rejected)
```

A "Try again" button is shown on rejection. A "Done" button closes the modal on approval.

**File:** `frontend/src/pages/habits/HabitDetailPage.jsx` — `ProofHistorySection`

Only rendered when `habit.requires_proof === true`. Shows a collapsible list of past proof submissions. Each row shows the submission date and a verified/rejected status badge. Expanding a row reveals the proof image thumbnail, vision description, AI reasoning, and confidence score. Data is fetched from `GET /api/habits/:id/proofs`.

---

# Wildcard — The AI Interrogator

## Problem

Users make impulsive decisions to delete habits or journal entries, often destroying data they will later regret losing. A simple confirmation dialog is too easy to dismiss without reflection.

## Solution

Preventing impulsive destructive actions. Before any deletion is executed, an AI-generated confrontational question forces the user to pause and articulate a genuine reason. The deletion only proceeds if the justification is at least 10 words long and passes an AI evaluation for specificity.

---

## Flow

```
User clicks delete
       ↓
Interrogator modal appears
       ↓
POST /api/interrogator/question
  AI generates confrontational question specific to the entity being deleted
       ↓
User reads the question
       ↓
User must type 10-word justification
  (word counter shown; delete button locked until minimum met)
       ↓
POST /api/interrogator/evaluate
  AI judges if justification is SPECIFIC/GENUINE vs VAGUE/WEAK
       ↓
If approved → Delete button unlocks → deletion proceeds
If rejected → feedback shown in yellow banner → user must refine
```

---

## Implementation

### Endpoint: /api/interrogator

**File:** `backend/src/modules/interrogator/interrogator.routes.js`

```
POST /api/interrogator/question    (requires auth)
POST /api/interrogator/evaluate    (requires auth)
```

Mounted in `app.js` under `/api/interrogator`.

### Gemini generates interrogation message

**File:** `backend/src/modules/interrogator/interrogator.controller.js`

`generateQuestion({ entityType, entityName })` — Sends a Gemini prompt asking it to produce a "short, sharp confrontational question" that challenges the deletion of the specific named entity. Returns `{ question: string }`.

Example for `entityType="habit"`, `entityName="Morning Workout"`:

> _"You've been building this habit for weeks — what exactly changed that makes giving up the right call?"_

`evaluateJustification({ entityType, entityName, justification })` — A second Gemini prompt presents the entity name and the user's justification. Gemini is instructed to judge whether the justification is `SPECIFIC and GENUINE` or `VAGUE and WEAK`. Returns:

```json
{ "approved": true, "feedback": "That's a legitimate reason." }
```

Falls back to `{ approved: true, feedback: '' }` if JSON parsing fails (fail-open to avoid blocking users on API errors). Both endpoints reuse `generateAccountabilityMessage(prompt)` from `backend/src/services/gemini.service.js`.

### Frontend validates justification length

**File:** `frontend/src/components/ui/InterrogatorModal.jsx`

The modal accepts `entityType`, `entityName`, `onConfirm`, and `onCancel` props.

On mount: fires `fetchInterrogationQuestion(entityType, entityName)` and displays the AI question.

The user types into a `<textarea>`. A live word counter updates on every keystroke with color coding: red when below 10 words, green when the minimum is met. The delete button is disabled until the 10-word threshold is reached.

On submit: calls `evaluateInterrogationJustification(entityType, entityName, justification)`.

- `approved === true` → `onConfirm()` called → deletion proceeds
- `approved === false` → `feedback` shown in yellow warning banner → user must revise
- API throws → deletion allowed to proceed (fail-open)

**Integration points** — The modal is used in two pages:

| Page                                             | entityType        | entityName                                            |
| ------------------------------------------------ | ----------------- | ----------------------------------------------------- |
| `frontend/src/pages/habits/HabitDetailPage.jsx`  | `"habit"`         | `habit.title`                                         |
| `frontend/src/pages/journal/JournalViewPage.jsx` | `"journal entry"` | Entry content stripped of HTML, truncated to 60 chars |

**File:** `frontend/src/api/interrogator.api.js`

```js
export async function fetchInterrogationQuestion(entityType, entityName) { ... }
export async function evaluateInterrogationJustification(entityType, entityName, justification) { ... }
```

---

# System Architecture Summary

All four AI features share the same Gemini backend but serve distinct purposes across the application lifecycle.

```
Journals
    ↓
Mood Analysis (Shock #1)
  analyzeJournalEntry() → sentiment + themes stored
  InsightsPage → mood trend chart, mood calendar, theme bar chart
    ↓
Habit Tracking
    ↓
Auditor Agent (Shock #2)
  cron job scans all habits for broken streaks (days_missed >= 2)
    ↓
Enforcer Agent
  Gemini message with journal context + escalation tone
  INSERT agent_messages → frontend polls every 60s
    ↓
AI Notification
  AgentNotificationContainer → bottom-right card delivery
    ↓
Proof Verification (Shock #3)
  Image upload → SHA-256 anti-cheat hash
    ↓
AI Vision Reasoning
  Step 1: describeImage() → natural language description
  Step 2: verifyHabitProof() → approved / rejected + confidence
  ProofUploadModal → VerificationReport with AI explanation
    ↓
AI Interrogator (Wildcard)
  InterrogatorModal → Gemini confrontational question
  10-word justification → AI evaluates SPECIFIC vs VAGUE
  Deletion only proceeds on approval
```

## AI Call Summary

| Feature         | Function                                | Input                                         | Output                                  |
| --------------- | --------------------------------------- | --------------------------------------------- | --------------------------------------- |
| Shock #1        | `analyzeJournalEntry(text)`             | Journal text                                  | `{ sentiment, themes }` JSON            |
| Shock #2        | `generateAccountabilityMessage(prompt)` | Habit context + journal snippets + tone level | Plain-text accountability message       |
| Shock #3 Step 1 | `describeImage(imagePath)`              | Image bytes + text prompt                     | One-sentence visual description         |
| Shock #3 Step 2 | `verifyHabitProof(title, description)`  | Habit title + vision description              | `{ approved, reason, confidence }` JSON |
| Wildcard Q      | `generateAccountabilityMessage(prompt)` | Entity type + entity name                     | Confrontational question string         |
| Wildcard E      | `generateAccountabilityMessage(prompt)` | Entity name + user justification              | `{ approved, feedback }` JSON           |

## File Reference Index

| File                                                             | Role                                                            |
| ---------------------------------------------------------------- | --------------------------------------------------------------- |
| `backend/src/services/ai.service.js`                             | Gemini text analysis — Shock #1                                 |
| `backend/src/services/gemini.service.js`                         | Gemini text generation — Shock #2, Wildcard                     |
| `backend/src/services/vision.service.js`                         | Gemini multimodal vision — Shock #3                             |
| `backend/src/agents/auditor.agent.js`                            | Broken streak scanner — Shock #2                                |
| `backend/src/agents/enforcer.agent.js`                           | Message generation and delivery — Shock #2                      |
| `backend/src/agents/memory.service.js`                           | Per-habit agent state — Shock #2                                |
| `backend/src/agents/proof_verifier.agent.js`                     | Proof pipeline orchestrator — Shock #3                          |
| `backend/src/jobs/auditor.job.js`                                | node-cron scheduler — Shock #2                                  |
| `backend/src/repositories/habit.repository.js`                   | Broken streak SQL, recent journal entries — Shock #2            |
| `backend/src/modules/journal/journal.service.js`                 | Fire-and-forget analysis trigger — Shock #1                     |
| `backend/src/modules/journal/journal.routes.js`                  | Journal and insights endpoints — Shock #1                       |
| `backend/src/modules/habits/habits.service.js`                   | Proof submit and verify — Shock #3                              |
| `backend/src/modules/habits/habits.routes.js`                    | Proof upload and history endpoints — Shock #3                   |
| `backend/src/modules/agent/agent.routes.js`                      | Agent messages endpoint — Shock #2                              |
| `backend/src/modules/interrogator/interrogator.routes.js`        | Interrogator endpoints — Wildcard                               |
| `backend/src/modules/interrogator/interrogator.controller.js`    | Question and evaluation logic — Wildcard                        |
| `backend/src/db/migrations/009_add_journal_sentiment_themes.sql` | `sentiment`, `themes` columns                                   |
| `backend/src/db/migrations/010_create_agent_messages.sql`        | `agent_messages` table                                          |
| `backend/src/db/migrations/011_create_agent_memory.sql`          | `agent_memory` table                                            |
| `backend/src/db/migrations/012_add_proof_to_habits_and_logs.sql` | Proof columns on `habit_logs`                                   |
| `backend/src/db/migrations/013_add_proof_hash.sql`               | Anti-cheat hash index                                           |
| `frontend/src/pages/insights/InsightsPage.jsx`                   | Mood dashboard — Shock #1                                       |
| `frontend/src/store/insights.store.js`                           | Insights Zustand store — Shock #1                               |
| `frontend/src/components/ui/AgentNotification.jsx`               | Bottom-right message card — Shock #2                            |
| `frontend/src/store/agent.store.js`                              | Agent polling Zustand store — Shock #2                          |
| `frontend/src/components/ui/ProofUploadModal.jsx`                | Upload and verification UI — Shock #3                           |
| `frontend/src/pages/habits/HabitDetailPage.jsx`                  | Proof history and interrogator integration — Shock #3, Wildcard |
| `frontend/src/components/ui/InterrogatorModal.jsx`               | Delete gate modal — Wildcard                                    |
| `frontend/src/api/interrogator.api.js`                           | Interrogator API client — Wildcard                              |
