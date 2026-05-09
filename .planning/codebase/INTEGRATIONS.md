# External Integrations

**Analysis Date:** 2026-05-09

## APIs & External Services

**Spanish Government API:**
- Service: Ministerio de Transportes fuel price data
- Endpoint: `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/`
- SDK/Client: Native fetch (via `@neondatabase/serverless`)
- Purpose: Fetch current fuel station prices and locations for Spain
- Implementation: `lib/govApi.ts` - `fetchGovData()` and `parseGovResponse()`
- Data format: JSON with station IDEESS IDs, coordinates (WGS84), fuel prices (G95, Diesel A, G98, GLP, GNC)

**Telegram API:**
- Service: Telegram Bot API
- Endpoint: `https://api.telegram.org/bot{token}/sendMessage`
- SDK/Client: Native fetch
- Auth: `TELEGRAM_BOT_TOKEN` environment variable
- Purpose: Send price alert notifications to chat
- Implementation: `lib/telegram.ts` - `sendTelegramMessage(text)`
- Target chat: `TELEGRAM_CHAT_ID` environment variable

**Anthropic Claude API:**
- Service: Claude AI language model API
- SDK/Client: `@anthropic-ai/sdk` v0.90.0
- Auth: Managed by SDK (likely `ANTHROPIC_API_KEY` env var)
- Purpose: AI-powered features (chat, analysis, or content generation)
- Status: Dependency present but integration location not immediately apparent in explored code

## Data Storage

**Databases:**
- Provider: Neon (serverless PostgreSQL)
- Client: `@neondatabase/serverless` v1.0.2 - SQL query execution via `neon()` function
- Connection: `DATABASE_URL` environment variable
- Implementation: `lib/db.ts`

**Database Schema:**
- `stations` table: Fuel station metadata (id, name, brand, lat, lng, address, province, municipality, venta_restringida, updated_at)
- `price_snapshots` table: Historical fuel price records (station_id, fuel_type, price, captured_at)
- Queries: Bulk upserts for stations, snapshot inserts, geospatial queries with bounding box filters

**File Storage:**
- Local filesystem only (no S3 or cloud storage detected)

**Caching:**
- Next.js built-in ISR (Incremental Static Regeneration) via `revalidate: 0` on gov API fetch
- No Redis or external caching layer detected

## Authentication & Identity

**Auth Provider:**
- Service: Google OAuth 2.0
- Implementation: NextAuth v5.0.0-beta.31 (`auth.ts`)
- Configuration:
  - `GOOGLE_ID` - OAuth client ID
  - `GOOGLE_SECRET` - OAuth client secret
  - `NEXTAUTH_SECRET` - Session encryption key
  - `NEXTAUTH_URL` - Callback URL for OAuth flow
- Session Strategy: JWT (not database sessions)
- User ID Mapping: `google:{providerAccountId}` (namespaced to avoid collisions)
- Callbacks: Custom JWT and session callbacks to inject user ID

**API Security:**
- `CRON_SECRET` - Bearer token auth for `POST /api/ingest` (scheduled data fetch)
- `INGEST_SECRET` - Secondary secret for ingest endpoint
- Implementation: `app/api/ingest/route.ts` validates bearer token against environment variable

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, Rollbar, or similar service)

**Logs:**
- Standard Node.js console and error handling
- No external logging service detected

## CI/CD & Deployment

**Hosting:**
- Vercel (Next.js platform)

**CI Pipeline:**
- Build script: `npm run build` triggers `node scripts/migrate.mjs && next build`
- Database migrations run before each build (likely Neon schema setup)
- No GitHub Actions or external CI detected in explored files

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - Neon PostgreSQL connection (production critical)
- `GOOGLE_ID`, `GOOGLE_SECRET` - Google OAuth credentials
- `NEXTAUTH_SECRET` - Session encryption key
- `NEXTAUTH_URL` - OAuth callback URL
- `TELEGRAM_BOT_TOKEN` - Telegram bot API token
- `TELEGRAM_CHAT_ID` - Target Telegram chat ID
- `CRON_SECRET` - Ingest endpoint authorization
- `INGEST_SECRET` - Alternative ingest authorization
- `HOME_LAT`, `HOME_LNG`, `HOME_RADIUS_KM` - Optional app defaults

**Secrets location:**
- `.env` / `.env.local` (not committed, Git-ignored)
- Note: Vercel environment dashboard for production

## Webhooks & Callbacks

**Incoming:**
- `POST /api/ingest` - Scheduled data ingestion endpoint (triggered by external cron job)
  - Auth: Bearer token via `CRON_SECRET`
  - Purpose: Fetch latest prices from gov API and store in database
  - Implementation: `app/api/ingest/route.ts`

**Outgoing:**
- Telegram notifications sent via `lib/telegram.ts` when prices change or alerts trigger
- No webhooks to external APIs detected beyond Telegram

---

*Integration audit: 2026-05-09*
