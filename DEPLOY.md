# Deployment Guide

## Stack

- **Frontend + API**: Next.js 15 App Router → Vercel (Hobby)
- **DB**: Neon PostgreSQL (serverless)
- **Auth**: NextAuth v5 (Google OAuth)
- **Notificaciones**: Telegram Bot API
- **LLM insights**: OpenRouter (claude-haiku-4-5)

## Variables de entorno (Vercel)

Configura estas variables en Vercel → Settings → Environment Variables:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Neon connection string (pooled) |
| `INGEST_SECRET` | Secret para proteger `/api/ingest` |
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram |
| `TELEGRAM_CHAT_ID` | Chat ID del canal/usuario destino |
| `OPENROUTER_API_KEY` | API key de OpenRouter |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret |
| `AUTH_SECRET` | Secret aleatorio para NextAuth (≥32 chars) |
| `HOME_LAT` | (Opcional) Latitud del área de interés para insights |
| `HOME_LNG` | (Opcional) Longitud del área de interés para insights |
| `HOME_RADIUS_KM` | (Opcional) Radio en km para filtrar estaciones en insights |

## Migración de base de datos

Ejecutar **una sola vez** contra el Neon DB tras el primer deploy (o usar el endpoint de migración si se añade):

```sql
-- db/schema.sql — ejecutar en orden
CREATE TABLE IF NOT EXISTS stations ( ... );
CREATE TABLE IF NOT EXISTS price_snapshots ( ... );
CREATE INDEX IF NOT EXISTS idx_snapshots_station_fuel_time ON price_snapshots (station_id, fuel_type, captured_at DESC);
CREATE TABLE IF NOT EXISTS favorites ( ... );
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Ver el archivo completo en `db/schema.sql`.

## Estrategia de crons (doble capa)

### Capa 1 — Vercel native crons (backup, 2x/día)

Definidos en `vercel.json`. Solo disponibles en Hobby = 2 ejecuciones/día:

| Schedule | Endpoint | Descripción |
|---|---|---|
| `0 8 * * *` | `/api/ingest` | Ingest matutino |
| `0 16 * * *` | `/api/ingest?summary=1` | Ingest vespertino con resumen |

Vercel envía `Authorization: Bearer <CRON_SECRET>` automáticamente.

### Capa 2 — cron-job.org (principal, cada 30 min)

Configurar en https://console.cron-job.org/:

| Campo | Valor |
|---|---|
| URL | `https://precio-gasolineras-murex.vercel.app/api/ingest` |
| Método | `POST` |
| Header | `x-ingest-secret: <INGEST_SECRET>` |
| Schedule | Cada 30 minutos (`*/30 * * * *`) |

**Por qué es seguro ejecutar cada 30 min**: el endpoint compara el campo `Fecha` de la API del Ministerio contra el valor guardado en `app_settings`. Si no hay datos nuevos, devuelve `{ok:true, skipped:true}` en <200ms sin writes a la DB.

Usar `?force=1` para forzar el ingest ignorando la deduplicación.

### Autenticación del endpoint

- **GET** (Vercel crons): `Authorization: Bearer <CRON_SECRET>`
- **POST** (cron-job.org): `x-ingest-secret: <INGEST_SECRET>`

## Google OAuth — URIs autorizados

En Google Cloud Console → APIs → OAuth 2.0:

- **Authorized JavaScript origins**: `https://precio-gasolineras-murex.vercel.app`
- **Authorized redirect URIs**: `https://precio-gasolineras-murex.vercel.app/api/auth/callback/google`

## Deploy

```bash
git push origin master  # Vercel auto-deploys on push to master
```

Para forzar un ingest manual tras deploy:

```bash
curl -X POST https://precio-gasolineras-murex.vercel.app/api/ingest \
  -H "x-ingest-secret: <INGEST_SECRET>"
```
