# The Only Task Tracker

Private kanban task tracker for a two-person team. Link-only access, threaded comments, screenshot attachments, and Telegram alerts.

**Live app:** [the-only-task-tracker.vercel.app](https://the-only-task-tracker.vercel.app)

---

## Features

- **Kanban board** — Backlog → In Progress → In Review → Done
- **Rich task fields** — site, category, urgency, importance
- **Two-user access** — personal magic links, no passwords
- **Threaded comments** — separate columns for Oleksii and William, with replies
- **Screenshots** — drag-and-drop image uploads per task
- **Activity feed** — full audit log of changes
- **Telegram notifications** — task updates, comments, and replies (owner only)

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Database | [Turso](https://turso.tech) (libSQL) |
| File storage | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) |
| Hosting | [Vercel](https://vercel.com) |
| Notifications | Telegram Bot API |

---

## Project structure

```
app/
  board/              # Main kanban page
  access/[token]/     # Magic-link login
  api/tasks/          # Task CRUD
  api/tasks/[id]/     # Comments & screenshots
components/           # UI (kanban, modal, comments, screenshots)
lib/
  db.ts               # Turso queries & schema
  auth.ts             # Token-based sessions
  telegram.ts         # Push notifications
  storage.ts          # Image upload (Blob / local fallback)
scripts/
  generate-tokens.js  # Create access tokens
  setup-turso.js      # Provision Turso database
```

---

## Getting started

### Prerequisites

- Node.js 18+
- [Turso CLI](https://docs.turso.tech/cli) (for production DB setup)

### Local development

```bash
git clone https://github.com/DadMych/the_only_task_tracker.git
cd the_only_task_tracker
npm install
cp .env.example .env.local
npm run generate-tokens   # writes tokens into terminal — paste into .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in via your `/access/<token>` link.

Locally, the app uses a SQLite file at `data/tracker.db` and stores uploads in `data/uploads/` — no Turso or Blob tokens required for dev.

---

## Environment variables

Copy `.env.example` to `.env.local` (local) or add them in **Vercel → Settings → Environment Variables** (production).

| Variable | Required | Description |
|----------|----------|-------------|
| `ACCESS_TOKEN_OWNER` | Yes | Secret token for Oleksii's access link |
| `ACCESS_TOKEN_BOSS` | Yes | Secret token for William's access link |
| `APP_URL` | No | Base URL (default: `https://the-only-task-tracker.vercel.app`) |
| `TURSO_DATABASE_URL` | Prod | Turso database URL (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Prod | Turso auth token |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot token for notifications |
| `TELEGRAM_CHAT_ID_OWNER` | No | Telegram chat ID to receive alerts |
| `AGENT_API_TOKEN` | No | Bearer token for `/api/agent/*` (AI client access) |
| `BLOB_READ_WRITE_TOKEN` | Prod | Vercel Blob token for screenshot storage |

Generate access tokens:

```bash
npm run generate-tokens
```

Provision Turso (after `turso auth login`):

```bash
npm run setup-turso
```

> **Never commit `.env.local` or secrets.** Personal access links belong in `access-links.txt` (gitignored).

---

## Access model

Two roles, two permanent magic links:

| Role | Env variable | Sign-in URL |
|------|--------------|-------------|
| Oleksii | `ACCESS_TOKEN_OWNER` | `{APP_URL}/access/{token}` |
| William | `ACCESS_TOKEN_BOSS` | `{APP_URL}/access/{token}` |

Sessions last 90 days (HTTP-only cookie). Pages are excluded from search engine indexing.

---

## Task fields

| Field | Values |
|-------|--------|
| **Site** | Real Reality Store, FoFGod, Sacraments, Spiritual Blueprint, Other |
| **Category** | Bug, Feature, Content, Design, Deploy, Other |
| **Urgency** | Urgent / Not urgent |
| **Importance** | Low (green) / Medium (yellow) / High (red) |
| **Status** | Backlog → In Progress → In Review → Done |

---

## Deploy to Vercel

1. Fork or clone this repo
2. Import the project in [Vercel](https://vercel.com/new)
3. Add all environment variables from the table above
4. Create a **Blob store** in Vercel → Storage and connect `BLOB_READ_WRITE_TOKEN`
5. Run `npm run setup-turso` locally to create the Turso DB, then add `TURSO_*` vars to Vercel
6. Deploy

---

## Telegram notifications

When configured, the bot sends messages to Oleksii on:

- Task created / updated / deleted
- New comments and replies
- AI agent actions (create, update, propose complete, reopen)
- Review workflow (confirmed, rejected, reopened)
- Includes task title, description, site, priority fields

---

## AI Agent API

An AI client (Cursor, Claude Code, scripts) can manage tasks via REST — full read/write, bearer token auth, Telegram logging on every action.

See **[docs/AI_AGENT_API.md](docs/AI_AGENT_API.md)** for the complete instruction set (endpoints, workflow, curl examples).

```bash
npm run generate-tokens   # also outputs AGENT_API_TOKEN
```

Workflow: agent **proposes complete** → human **confirms or rejects** in the board UI → agent can **reopen** with updates.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run generate-tokens` | Generate `ACCESS_TOKEN_*` values |
| `npm run setup-turso` | Create Turso DB and write credentials to `.env.local` |

---

## License

Private project — all rights reserved.
