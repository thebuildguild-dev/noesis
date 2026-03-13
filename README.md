# Noesis

> AI-powered habit tracking and journaling platform with autonomous agents and multimodal verification.

Built for the **AI Protosprint Hackathon**. Noesis helps users track habits, write daily journals, analyze emotional patterns, maintain streaks, and verify habit completion using AI.

---

## Features

- **Habit management** — create, track, and delete habits with daily completion logging
- **Streak tracking** — current streak, longest streak, and total completions per habit
- **Daily journaling** — rich journal entries with pagination and full edit history
- **AI emotional insights** — automatic sentiment analysis and theme extraction from journal entries
- **Autonomous accountability agents** — background agents that detect broken streaks and send personalized messages
- **Multimodal proof verification** — upload an image as habit evidence; Gemini Vision verifies it
- **AI interrogation before deletion** — confrontational AI gate that challenges impulsive destructive actions
- **Demo account** — pre-seeded with habits, logs, and journal entries on every fresh boot

---

## Feature Shock Implementation

All AI features use Google Gemini via the `@google/genai` SDK.

### Shock #1 — Mood Ring

Every journal entry is automatically analyzed by Gemini immediately after it is saved. The analysis extracts:

- A **sentiment label** from a fixed vocabulary (`Positive`, `Anxious`, `Motivated`, `Stressed`, etc.)
- **3–5 theme keywords** describing recurring topics (`work`, `sleep`, `productivity`)

Analysis runs **fire-and-forget** — the API responds immediately and processing happens in the background. The `/api/journal/insights` endpoint aggregates the last 14 days and powers four dashboard visualizations:

- Mood trend line chart (numeric score per day)
- Theme frequency bar chart (top 8 themes)
- 14-day mood calendar (color-coded per sentiment)
- Weekly plain-English insight narrative

```
Journal Entry Saved
      ↓
analyzeJournalEntry(content)  →  Gemini text prompt
      ↓
{ sentiment, themes }
      ↓
UPDATE journal_entries SET sentiment, themes
      ↓
InsightsPage visualization
```

---

### Shock #2 — Ruthless Accountability Coach

Two autonomous agents run in the background with no user interaction required.

**Auditor Agent** — scans all habits across all users on a cron schedule. Detects habits with `days_missed >= 2` using a SQL JOIN across habits, users, and habit logs.

**Enforcer Agent** — receives each broken habit and runs a full personalized delivery pipeline:

1. Checks 24-hour cooldown per `(user, habit)` pair
2. Determines escalation tone: Level 1 (supportive) → Level 2 (sarcastic) → Level 3 (ruthless)
3. Fetches the user's last 5 journal entries for personalization context
4. Sends a structured prompt to Gemini with habit name, days missed, tone, and journal context
5. Persists the generated message to `agent_messages`
6. Updates `agent_memory` with new escalation level and timestamp
7. Sends a fire-and-forget accountability email

The frontend polls `GET /api/agent/messages` every 60 seconds and displays unread messages as a bottom-right notification card.

```
Cron Job (1 min dev / 10 min prod)
      ↓
Auditor → getBrokenStreakHabits()
      ↓
Enforcer per habit
  → 24h cooldown check
  → fetch journal context
  → Gemini message generation
  → INSERT agent_messages
  → upsert agent_memory
      ↓
Frontend polls → notification card delivered
```

---

### Shock #3 — Proof of Work (Multimodal)

Habits configured with `requires_proof = true` cannot be completed without uploading an image as evidence. The system runs a two-step Gemini pipeline:

**Step 1 — Vision description**: the uploaded image is base64-encoded and sent to Gemini Vision. Gemini returns a one-sentence natural language description of what it sees (e.g. `"An open book placed on a desk."`).

**Step 2 — Habit reasoning**: a second Gemini text call receives the habit title and the vision description and reasons about whether the scene constitutes evidence of the claimed habit.

```json
{
  "approved": true,
  "reason": "The image shows reading material consistent with this habit.",
  "confidence": 0.87
}
```

A SHA-256 hash of the uploaded image is stored as a partial unique index — reusing the same image across different habits or users returns a 409 Conflict (anti-cheat).

```
POST /api/habits/:id/proof  (multipart image)
      ↓
SHA-256 hash → duplicate check
      ↓
INSERT habit_log (status=pending)
      ↓
describeImage()  →  Gemini Vision  →  one-sentence description
      ↓
verifyHabitProof()  →  Gemini Text  →  { approved, reason, confidence }
      ↓
UPDATE habit_logs SET verification_status, verification_comment, confidence
      ↓
ProofUploadModal → VerificationReport shown to user
```

---

### Wildcard — AI Interrogator

Before any habit or journal deletion is executed, an AI-generated confrontational question forces the user to pause and justify the action. The deletion only proceeds if:

1. The justification is at least **10 words long** (enforced client-side with a live word counter)
2. Gemini evaluates the justification as `SPECIFIC and GENUINE` (not `VAGUE and WEAK`)

```
User clicks delete
      ↓
POST /api/interrogator/question
  → Gemini generates confrontational question specific to the entity
      ↓
User types justification (10-word minimum enforced)
      ↓
POST /api/interrogator/evaluate
  → Gemini judges: SPECIFIC/GENUINE vs VAGUE/WEAK
      ↓
approved → deletion proceeds
rejected → feedback shown, user must refine
```

Falls back to `approved: true` on any API error (fail-open) to avoid permanently blocking users.

---

## Tech Stack

| Layer     | Technology                              |
| --------- | --------------------------------------- |
| Frontend  | React 18, Vite 5, Zustand, Tailwind CSS |
| Backend   | Node.js, Express (ES Modules)           |
| Database  | PostgreSQL 16                           |
| Cache     | Redis 7                                 |
| Scheduler | node-cron                               |
| AI        | Google Gemini (`@google/genai`)         |
| Email     | Resend                                  |
| Infra     | Docker, Docker Compose                  |

---

## Project Structure

```
noesis/
├── docker-compose.yml
├── .env
│
├── backend/
│   └── src/
│       ├── agents/          # Auditor + Enforcer agents, memory service
│       ├── services/        # Gemini, vision, AI analysis services
│       ├── jobs/            # node-cron scheduler
│       ├── repositories/    # Raw SQL queries (broken streaks, journal entries)
│       ├── modules/
│       │   ├── auth/
│       │   ├── habits/
│       │   ├── journal/
│       │   ├── streak/
│       │   ├── agent/
│       │   └── interrogator/
│       ├── db/
│       │   └── migrations/  # 001–013 SQL migrations
│       ├── middlewares/
│       └── utils/
│
└── frontend/
    └── src/
        ├── pages/           # Dashboard, Habits, Journal, Insights, Profile
        ├── components/
        │   └── ui/          # ProofUploadModal, InterrogatorModal, AgentNotification, Toast
        ├── store/           # Zustand stores (habits, journal, agent, insights)
        ├── api/             # API client wrappers
        └── config/
```

---

## Local Development Setup

### Prerequisites

- Docker and Docker Compose
- A Google Gemini API key

### Step 1 — Clone the repository

```bash
git clone <repo-url>
cd noesis
```

### Step 2 — Create the environment file

```bash
cp .env.example .env
```

### Step 3 — Configure environment variables

Edit `.env` with your values (see the section below).

### Step 4 — Start the development environment

```bash
docker compose up
```

This starts four services: `backend`, `frontend`, `postgres`, and `redis`. The database is migrated and seeded automatically on first boot.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# App
APP_NAME=Noesis
NODE_ENV=development

# Ports
BACKEND_PORT=5000
FRONTEND_PORT=5173

# PostgreSQL
POSTGRES_USER=app
POSTGRES_PASSWORD=app
POSTGRES_DB=noesis
POSTGRES_URL=postgresql://app:app@postgres:5432/noesis

# Redis
REDIS_URL=redis://redis:6379

# Auth
JWT_ACCESS_SECRET=dev_access_secret
JWT_REFRESH_SECRET=dev_refresh_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Rate limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# AI — required for all Shock features
GEMINI_API_KEY=your_gemini_api_key
GEMINI_GENERATION_MODEL=gemini-2.0-flash
HF_API_KEY=your_hf_api_key
HF_MODEL=your_hf_model
HF_SENTIMENT_MODEL=your_hf_sentiment_model

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
RESEND_EMAIL_FROM=noreply@yourdomain.com

# App URL (used in password reset emails)
APP_BASE_URL=http://localhost:5173

# Demo account
DEMO_USER_EMAIL=demo@noesis.local
DEMO_USER_PASSWORD=demo1234

# Frontend (consumed at runtime by docker-entrypoint.sh)
BACKEND_URL=http://localhost:5000
```

---

## Running the Project

```bash
docker compose up
```

| Service     | URL                        |
| ----------- | -------------------------- |
| Frontend    | http://localhost:5173      |
| Backend API | http://localhost:5000      |
| API Docs    | http://localhost:5000/docs |

The backend runs database migrations and seeds the demo account automatically on startup. No manual setup required.

---

## Demo Account

A demo account is seeded with realistic data on every fresh boot:

```
email:    demo@noesis.local
password: demo1234
```

The demo account includes:

- 5 sample habits with ~45% daily completion across a 14-day history
- Habit logs seeded 3–16 days ago (never today or yesterday) — guaranteeing a visible broken streak for Shock #2 on first boot
- 14 journal entries with pre-generated sentiment and theme data
- Agent messages queued for delivery

---

## Architecture Overview

```
Journals
    ↓
Mood Analysis (Shock #1)
  analyzeJournalEntry() → sentiment + themes stored
  InsightsPage → mood trend chart, mood calendar, theme bar chart

Habit Tracking
    ↓
Auditor Agent (Shock #2)
  cron job scans all habits for broken streaks (days_missed >= 2)
    ↓
Enforcer Agent
  Gemini message with journal context + escalating tone
  INSERT agent_messages → frontend polls every 60s → notification card

Habit Completion
    ↓
Image Upload (Shock #3)
  SHA-256 anti-cheat hash check
    ↓
Vision Analysis
  Step 1: describeImage() → natural language description
  Step 2: verifyHabitProof() → { approved, reason, confidence }
  ProofUploadModal → VerificationReport shown to user

Destructive Action
    ↓
AI Interrogator (Wildcard)
  InterrogatorModal → Gemini confrontational question
  10-word justification → AI evaluates SPECIFIC vs VAGUE
  Deletion only proceeds on approval
```

### AI Call Summary

| Feature         | Function                        | Input                                | Output                             |
| --------------- | ------------------------------- | ------------------------------------ | ---------------------------------- |
| Shock #1        | `analyzeJournalEntry`           | Journal text                         | `{ sentiment, themes }`            |
| Shock #2        | `generateAccountabilityMessage` | Habit context + journal + tone level | Plain-text accountability message  |
| Shock #3 Step 1 | `describeImage`                 | Image bytes                          | One-sentence visual description    |
| Shock #3 Step 2 | `verifyHabitProof`              | Habit title + vision description     | `{ approved, reason, confidence }` |
| Wildcard (Q)    | `generateAccountabilityMessage` | Entity type + entity name            | Confrontational question string    |
| Wildcard (E)    | `generateAccountabilityMessage` | Entity name + user justification     | `{ approved, feedback }`           |

---

## License

MIT License — Copyright (c) 2026 The Build Guild. See [LICENSE](./LICENSE) for details.
