# Deployment Guide

## 1. Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/precio-gasolineras.git
git push -u origin feat/core-app
```

## 2. Create Neon Postgres Database

1. Go to [console.neon.tech](https://console.neon.tech) → New Project
2. Copy the `DATABASE_URL` connection string
3. Apply the schema:

```bash
node -e "
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
sql(fs.readFileSync('db/schema.sql', 'utf8')).then(() => { console.log('Schema applied'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
"
```

## 3. Import to Vercel

1. Go to [vercel.com](https://vercel.com) → Add New Project → import GitHub repo
2. Framework: Next.js (auto-detected)
3. Add environment variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | From Neon dashboard |
| `INGEST_SECRET` | Run `openssl rand -hex 16` to generate |
| `TELEGRAM_BOT_TOKEN` | From [@BotFather](https://t.me/BotFather) on Telegram |
| `TELEGRAM_CHAT_ID` | Message your bot, then GET `https://api.telegram.org/bot<TOKEN>/getUpdates` — look for `chat.id` |
| `ANTHROPIC_API_KEY` | From [console.anthropic.com](https://console.anthropic.com) |

4. Deploy

## 4. Run Initial Ingest

```bash
curl -X POST "https://YOUR-APP.vercel.app/api/ingest" \
  -H "x-ingest-secret: YOUR_INGEST_SECRET"
```

Expected: `{"ok":true,"stationsProcessed":~11000,...}` (takes ~20-30s first run)

## 5. Configure cron-job.org

Sign up at [cron-job.org](https://cron-job.org) (free) and create two jobs:

**Job 1 — Regular sync (every 6h):**
- URL: `https://YOUR-APP.vercel.app/api/ingest`
- Method: POST
- Headers: `x-ingest-secret: YOUR_INGEST_SECRET`
- Schedule: `0 */6 * * *`

**Job 2 — Daily summary with Telegram notification (21:00 UTC):**
- URL: `https://YOUR-APP.vercel.app/api/ingest?summary=1`
- Method: POST
- Headers: `x-ingest-secret: YOUR_INGEST_SECRET`
- Schedule: `0 21 * * *`

## 6. Local Development

```bash
cp .env.local.example .env.local
# Fill in DATABASE_URL and other vars
npm run dev
```

App runs at http://localhost:3000
