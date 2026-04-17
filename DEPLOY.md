# Deployment Guide

## Environment Variables

### Database
- **DATABASE_URL** — PostgreSQL connection string with SSL mode. Format: `postgresql://user:password@host/dbname?sslmode=require`

### AI (OpenRouter)
- **OPENROUTER_API_KEY** — API key for OpenRouter (not Anthropic API directly). Format: `sk-or-v1-...`

### Telegram
- **TELEGRAM_BOT_TOKEN** — Bot token from Telegram BotFather. Format: `123456789:ABCDEF...`
- **TELEGRAM_CHAT_ID** — Telegram chat ID where notifications are sent. Format: `-100...` for groups/channels

### Cron Security
- **INGEST_SECRET** — Token from cron-job.org POST requests to `/api/ingest`. Validate this in the ingest endpoint.
- **CRON_SECRET** — Bearer token that validates GET requests to `/api/ingest?summary=1`. Checked in the `Authorization` header.

### Home Location Filtering
These variables control notification filtering by proximity to user's home:
- **HOME_LAT** — Latitude of the user's home area (e.g., `40.4168`)
- **HOME_LNG** — Longitude of the user's home area (e.g., `-3.7038`)
- **HOME_RADIUS_KM** — Radius in kilometers around home for filtering notifications (default: `30`)

## Deployment

### Auto-Deploy
Push to `feat/core-app` or `master` triggers Vercel auto-deploy via GitHub integration. No manual deployment step required.

### Vercel Configuration
- External cron-job.org fires `/api/ingest` every 6 hours
- Do NOT use Vercel's `vercel.json` cron block (duplicate runs would occur)
- All other Vercel config (headers, rewrites, serverless functions) is defined in `vercel.json`

### Secrets Management
1. Add all sensitive env vars to Vercel project settings (not in code or git)
2. Never commit `.env.local` files
3. Use `.env.example` as a template for contributors
