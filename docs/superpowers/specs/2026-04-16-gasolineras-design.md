# Precio Gasolineras — Design Spec
*Date: 2026-04-16*

## Overview

A personal web app for finding and tracking fuel prices at Spanish petrol stations, with proactive Telegram notifications powered by AI-generated insights, and an MCP server for conversational queries from Claude Code.

**Scope:** Spain only. Personal use, publicly accessible URL (no auth required). Primary fuels: Gasolina 95 + Diesel.

---

## Architecture

```
[Spanish Gov API]
        ↓  (every 6h)
[cron-job.org] → POST /api/ingest?secret=xxx
        ↓
[Next.js API route /api/ingest]
   ├── Upsert stations → Neon Postgres
   ├── Append price_snapshots → Neon Postgres
   ├── Detect price changes vs previous snapshot
   ├── Call Claude API → generate insight message
   └── Send Telegram message (if changes or daily summary time)

[Next.js App — Vercel]
   ├── /api/stations?lat=&lng=&radius=&fuel=   (map data)
   ├── /api/stations/[id]/history?fuel=&days=  (chart data)
   ├── /api/favorites                           (CRUD)
   └── Frontend: React + Leaflet + Recharts + Tailwind

[MCP Server — local, /mcp-server in repo]
   └── Connects to Neon Postgres via DATABASE_URL
```

**Data source:** `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/` — free, no auth, maintained by the Spanish government (Ministerio para la Transición Ecológica), updated multiple times daily.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Hosting | Vercel (Hobby plan) |
| Database | Neon Postgres (Vercel Marketplace, free tier) |
| Map | Leaflet + React-Leaflet (free, no API key) |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Scheduler | cron-job.org (free, hits /api/ingest every 6h) |
| Notifications | Telegram Bot API |
| AI insights | Claude API (claude-haiku-4-5 for cost efficiency) |
| MCP server | Node.js, ships in /mcp-server |
| Geo queries | PostGIS via Neon (ST_DWithin) or Haversine fallback |

---

## Data Model

```sql
-- Static station metadata (upserted on each sync)
stations (
  id           TEXT PRIMARY KEY,   -- government IDEESS id
  name         TEXT NOT NULL,
  brand        TEXT,
  lat          FLOAT NOT NULL,
  lng          FLOAT NOT NULL,
  address      TEXT,
  province     TEXT,
  municipality TEXT,
  updated_at   TIMESTAMPTZ DEFAULT now()
)

-- Price snapshots (append-only, one row per station/fuel/sync)
price_snapshots (
  id          SERIAL PRIMARY KEY,
  station_id  TEXT NOT NULL REFERENCES stations(id),
  fuel_type   TEXT NOT NULL,  -- 'g95' | 'diesel'
  price       NUMERIC(5,3) NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
)

-- User favorites (personal list for targeted alerts)
favorites (
  station_id  TEXT PRIMARY KEY REFERENCES stations(id),
  label       TEXT   -- e.g. "La de casa", "La del trabajo"
)
```

**Index:** `price_snapshots(station_id, fuel_type, captured_at DESC)` for fast history lookups.

---

## Web App — UI

### Layout
- **Map-first** by default: full-screen Leaflet map with price-colored pins
  - Green = cheapest in view, yellow = mid, red = most expensive (relative to local average)
- **Bottom drawer** (collapsible): ranked list of nearest stations sorted by price
  - Shows: brand, name, distance, current price, delta vs yesterday (▲/▼)
- **View switcher** in top bar: map-first ↔ split (list left, map right)

### Station detail panel
Triggered by clicking a map pin or list item:
- Map zooms to and centers on the selected station
- Side panel opens with:
  - Station name, brand logo, address
  - Current price for 95 and Diesel
  - Price history chart (Recharts line chart)
  - Time range toggle: 7d / 30d / 3m
  - "Add to favorites" button

### Top bar controls
- Radius slider (1km – 50km)
- Fuel toggle: 95 / Diesel
- View switcher

---

## Data Pipeline — /api/ingest

Protected by `INGEST_SECRET` env var (header: `x-ingest-secret`).

Steps:
1. Fetch all stations from government API
2. Upsert `stations` table (update metadata if changed)
3. For each station, insert a `price_snapshots` row for g95 and diesel
4. Query previous snapshot per station/fuel to detect changes
5. Build change summary (stations where price moved > 0.5 cents)
6. If changes exist OR the request includes `?summary=1` (set on the 22:00 UTC cron-job.org schedule):
   - Call Claude API with price data → get insight text in Spanish
   - POST to Telegram Bot API → send to configured chat ID

**Insight prompt context:** current prices at favorites, 7-day trend for the user's region, whether prices are at a weekly/monthly high or low.

**Rate limiting:** the government API returns all stations in a single call — no pagination needed. Expected response: ~2MB JSON, ~11,000 stations.

---

## Telegram Notifications

Two triggers:
1. **Threshold alert:** any favorite station moves more than 2 cents up or down
2. **Daily summary:** every evening at ~22:00 (after government API updates)

Example message:
> 🟢 *Precio 95 — Bajada en tu zona*
> El precio medio del 95 en Valencia ha bajado 3 céntimos esta semana y lleva 5 días en tendencia descendente.
> **Consejo:** buen momento para llenar el depósito.
>
> Tus favoritas:
> • Repsol La de casa — 1.489€ ↓0.02
> • Cepsa El trabajo — 1.512€ ↓0.01

---

## MCP Server (/mcp-server)

Local Node.js MCP server. Added to Claude Code project config via `.mcp.json`.

**Tools:**

| Tool | Parameters | Returns |
|---|---|---|
| `find_stations` | `lat, lng, radius_km, fuel` | Stations sorted by price with distance |
| `get_station_history` | `station_id, fuel, days` | Price series for chart/analysis |
| `get_price_trend` | `province, fuel, days` | Average price trend in a region |
| `get_favorites` | — | Current prices at favorite stations |
| `get_cheapest_on_route` | `origin_lat, origin_lng, dest_lat, dest_lng, fuel` | Cheapest stations within 5km of the route |

Connects to Neon Postgres via `DATABASE_URL` env var (same DB as the web app).

---

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | Vercel + local `.env.local` | Neon Postgres connection string |
| `INGEST_SECRET` | Vercel + cron-job.org header config | Protects /api/ingest from public calls |
| `TELEGRAM_BOT_TOKEN` | Vercel | Telegram bot credentials |
| `TELEGRAM_CHAT_ID` | Vercel | Your personal Telegram chat ID |
| `ANTHROPIC_API_KEY` | Vercel | Claude API for insight generation |

---

## Out of Scope (v1)

- User authentication / multi-user support
- Mobile app (web is mobile-responsive)
- Push notifications (Telegram covers this)
- Price prediction / ML models
- Fuel types beyond 95 and Diesel (schema supports them, UI doesn't expose them yet)
- Route planning UI (MCP tool exists, web UI for it is v2)
