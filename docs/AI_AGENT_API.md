# AI Agent API — Task Tracker

REST API for an AI client (Cursor, Claude Code, custom GPT, scripts) to **read and write tasks** in The Only Task Tracker. Every agent action is logged to the activity feed and pushes a Telegram notification to Oleksii.

No database credentials on the client side — only a bearer token and HTTPS.

## Architecture

```
AI client ──HTTPS──▶ Task Tracker (Vercel / local)
                       │  Authorization: Bearer <AGENT_API_TOKEN>
                       ▼
                /api/agent/*  (this API)
                       │
                       ▼
              Turso / SQLite + Telegram alerts
```

Human review happens in the web UI (`/board`). The agent cannot mark tasks **done** directly — it proposes completion, then a human confirms or rejects.

## Setup

### 1. Generate token

```bash
npm run generate-tokens
```

Copy `AGENT_API_TOKEN=...` into `.env.local` (local) or Vercel env vars (production).

Also set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID_OWNER` if you want push alerts.

### 2. Base URL

| Environment | Base URL |
|-------------|----------|
| Production | `https://the-only-task-tracker.vercel.app` |
| Local | `http://localhost:3000` |

All examples below use `$BASE` and `$TOKEN`.

```bash
export BASE=https://the-only-task-tracker.vercel.app
export TOKEN=your_agent_api_token
```

## Authentication

Every `/api/agent/*` request except the manifest must include:

```
Authorization: Bearer <AGENT_API_TOKEN>
```

Missing or wrong token → `401`. Token not configured on server → `503`.

## Discovery

### `GET /api/agent`

No auth. Returns manifest with enums, endpoints, and workflow description.

```bash
curl -s "$BASE/api/agent" | jq
```

---

## Read

### `GET /api/agent/tasks`

List all tasks with board stats and recent activity.

| Query param | Effect |
|-------------|--------|
| `status=backlog` | Filter by status (`backlog`, `in_progress`, `review`, `done`) |

```bash
curl -s "$BASE/api/agent/tasks" \
  -H "Authorization: Bearer $TOKEN" | jq

curl -s "$BASE/api/agent/tasks?status=in_progress" \
  -H "Authorization: Bearer $TOKEN" | jq
```

Response: `{ tasks[], activity[], stats{} }`

### `GET /api/agent/tasks/:id`

Single task with comments and screenshot metadata.

```bash
curl -s "$BASE/api/agent/tasks/TASK_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

Response: `{ task, comments[], images[] }`

### `GET /api/agent/tasks/:id/comments`

Comments only (flat list, ordered oldest first). Use `parent_id` to build threads.

```bash
curl -s "$BASE/api/agent/tasks/TASK_ID/comments" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### `GET /api/agent/activity`

Activity feed.

| Query param | Effect |
|-------------|--------|
| `limit=N` | Max rows (default 50, cap 200) |
| `since=ISO8601` | Only events after timestamp |

```bash
curl -s "$BASE/api/agent/activity?limit=20" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Write

### `POST /api/agent/tasks`

Create a task. New tasks start in **backlog** unless you pass `"status": "in_progress"`.

```bash
curl -s -X POST "$BASE/api/agent/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix checkout button on mobile",
    "description": "Button overlaps footer on iOS Safari",
    "site": "store.realreality.com",
    "category": "bug",
    "urgency": "urgent",
    "importance": "red",
    "status": "in_progress"
  }' | jq
```

| Field | Required | Values |
|-------|----------|--------|
| `title` | yes | string |
| `description` | no | string |
| `site` | no | `store.realreality.com`, `fofgod.com`, `sacraments.fofgod.com`, `spiritualblueprint.com`, `other` |
| `category` | no | `bug`, `feature`, `content`, `design`, `deploy`, `other` |
| `urgency` | no | `urgent`, `not_urgent` |
| `importance` | no | `green` (low), `yellow` (medium), `red` (high) |
| `status` | no | `backlog` or `in_progress` only on create |

### `PATCH /api/agent/tasks/:id`

Update any task fields. Send only fields you want to change.

```bash
curl -s -X PATCH "$BASE/api/agent/tasks/TASK_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated repro steps...",
    "status": "in_progress",
    "urgency": "not_urgent"
  }' | jq
```

Updatable: `title`, `description`, `status`, `category`, `urgency`, `importance`, `site`.

**Note:** Prefer the workflow endpoints below instead of setting `status: "done"` or `status: "review"` manually.

### `DELETE /api/agent/tasks/:id`

Permanently delete a task and its comments/screenshots.

```bash
curl -s -X DELETE "$BASE/api/agent/tasks/TASK_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### `POST /api/agent/tasks/:id/comments`

Add a comment or reply.

```bash
curl -s -X POST "$BASE/api/agent/tasks/TASK_ID/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body": "Investigating — looks like a CSS flex issue"}' | jq

# Reply to a comment
curl -s -X POST "$BASE/api/agent/tasks/TASK_ID/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body": "Fixed in commit abc123", "parent_id": "COMMENT_ID"}' | jq
```

---

## Workflow (agent ↔ human)

Kanban columns: **Backlog → In Progress → In Review → Done**

The agent owns work up to **In Review**. A human confirms or rejects in the web UI.

```
  backlog ──▶ in_progress ──▶ review ──▶ done
                  ▲              │
                  └── reject ────┘
                  └── reopen (from review or done)
```

### Agent: propose complete

When you believe the task is finished, call this instead of PATCHing status.

**`POST /api/agent/tasks/:id/propose-complete`**

- Requires task status: `in_progress`
- Sets status → `review`
- Adds a comment prefixed `[Proposed complete]`
- Telegram alert to Oleksii

```bash
curl -s -X POST "$BASE/api/agent/tasks/TASK_ID/propose-complete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Fixed flex layout on .checkout-btn, tested iOS Safari 17. PR merged."
  }' | jq
```

| Field | Required |
|-------|----------|
| `summary` | yes — what was done, links, test notes |

Wrong state → `409` with message.

### Human: confirm or reject (web UI)

These use session cookies (magic link login), **not** the agent token. Documented here so the AI understands the full lifecycle.

| Action | Who | Effect |
|--------|-----|--------|
| **Confirm done** | Human in UI | `review` → `done` |
| **Reject** | Human in UI | `review` → `in_progress` + feedback comment |
| **Reopen** | Human in UI | `done` → `in_progress` + summary comment |

After rejection, read the feedback comment and continue work on the task.

### Agent: reopen with updates

When a task was closed prematurely, or you need to resume work after review/done:

**`POST /api/agent/tasks/:id/reopen`**

- Requires task status: `review` or `done`
- Sets status → `in_progress`
- Adds a comment prefixed `[Reopened]`
- Optional field updates in the same request

```bash
curl -s -X POST "$BASE/api/agent/tasks/TASK_ID/reopen" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Client reported regression on Android — reopening to fix",
    "description": "New repro: checkout fails on Chrome Android 124",
    "urgency": "urgent"
  }' | jq
```

| Field | Required |
|-------|----------|
| `summary` | yes |
| `title`, `description`, `category`, `urgency`, `importance`, `site` | no |

---

## Typical AI workflow

1. **Poll** `GET /api/agent/tasks?status=in_progress` for active work.
2. **Create** new tasks when bugs/features are reported.
3. **Patch** description/status as you work (`in_progress`).
4. **Comment** progress updates on the task.
5. **Propose complete** when finished — do not set `done` yourself.
6. If rejected, **read comments** for feedback, fix, comment, propose again.
7. Use **reopen** if a done task needs more work.

---

## Error codes

| HTTP | Meaning |
|------|---------|
| `400` | Missing required field |
| `401` | Bad or missing bearer token |
| `404` | Task not found |
| `409` | Invalid workflow state (e.g. propose-complete while not in_progress) |
| `503` | `AGENT_API_TOKEN` not set on server |

---

## Quick test checklist

```bash
# manifest (no auth)
curl -s "$BASE/api/agent" | jq .name

# auth required
curl -i -s "$BASE/api/agent/tasks"   # expect 401

# create → propose → read
TASK=$(curl -s -X POST "$BASE/api/agent/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"API smoke test","status":"in_progress"}' | jq -r .task.id)

curl -s -X POST "$BASE/api/agent/tasks/$TASK/propose-complete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"summary":"Smoke test complete"}' | jq .task.status
# expect "review"
```

---

## Hooking up Cursor / Claude

Call these REST endpoints directly from your agent. Options:

1. **Shell/curl** — Claude Code or Cursor can run curl commands with the token from env.
2. **Custom GPT / Claude tool** — paste the manifest from `GET /api/agent` as the tool spec.
3. **Env var** — store `AGENT_API_TOKEN` and `TFP_TRACKER_URL` in the agent environment; never commit the token.

There is no MCP wrapper and no DB proxy — the AI talks to this API only.
