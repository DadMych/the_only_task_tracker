# The Only Task Tracker

Task tracker with personal-link access and Telegram notifications.

**Production:** https://the-only-task-tracker.vercel.app

## Database: Turso

On Vercel, file-based SQLite does not work — we use **[Turso](https://turso.tech)** (libSQL, SQLite-compatible cloud DB).

- Free tier is enough for two users
- Works natively in serverless
- Locally uses `file:data/tracker.db` when Turso env vars are empty

### Turso setup for Vercel

```bash
brew install tursodatabase/tap/turso
turso auth login
npm run setup-turso
```

Add to Vercel → Settings → Environment Variables:
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

## Quick start (local)

```bash
npm install
npm run generate-tokens   # access tokens → .env.local
cp .env.example .env.local
# fill TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID_OWNER
npm run dev
```

Local dev: http://localhost:3000

## Access

Production links (replace tokens with yours from `.env.local`):

| Role | URL |
|------|-----|
| Oleksii | `https://the-only-task-tracker.vercel.app/access/<ACCESS_TOKEN_OWNER>` |
| William | `https://the-only-task-tracker.vercel.app/access/<ACCESS_TOKEN_BOSS>` |

Personal links are stored locally in `access-links.txt` (gitignored).

## Task fields

- **Site:** store.realreality.com, fofgod.com, sacraments.fofgod.com, spiritualblueprint.com, other
- **Category:** bug, feature, content, design, deploy, other
- **Urgency:** urgent / not urgent
- **Importance:** green (low) / yellow (medium) / red (high)
- **Status:** backlog → in progress → in review → done

## Telegram

Notifications go to Oleksii only (`TELEGRAM_CHAT_ID_OWNER`) on task create/update/delete and on comments/replies.

## Screenshots

Task screenshots upload to **Vercel Blob** in production. Add `BLOB_READ_WRITE_TOKEN` in Vercel → Storage → Blob → Create Store → connect to project.

Locally, files are stored in `data/uploads/` without a blob token.

## Deploy on Vercel

Live at [the-only-task-tracker.vercel.app](https://the-only-task-tracker.vercel.app)

1. Push to [GitHub](https://github.com/DadMych/the_only_task_tracker)
2. Import project in Vercel
3. Add env variables (see `.env.example`)
4. Deploy

## Environment variables

See `.env.example` — secrets only in Vercel / local `.env.local`, never in git.
