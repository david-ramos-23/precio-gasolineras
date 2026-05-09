# Architecture

**Analysis Date:** 2026-05-09

## Pattern Overview

**Overall:** Next.js App Router with client-side map visualization, server-side data aggregation, and user authentication via NextAuth

**Key Characteristics:**
- Full-stack TypeScript with strict type safety
- Client-side React 19 with Leaflet for interactive mapping
- Server-side geolocation computation and price data queries
- RESTful API routes with query parameter filtering
- Authentication via JWT sessions (Google OAuth)
- Serverless deployment (Vercel) with Neon PostgreSQL

## Layers

**Presentation (Client):**
- Purpose: Interactive UI for fuel price visualization and browsing
- Location: `components/`
- Contains: React components for map, UI controls, station details, lists
- Depends on: Data from API routes, geolocation context, auth state
- Used by: `app/page.tsx` (main page)

**API & Data Gateway (Server):**
- Purpose: Serve real-time and historical fuel price data with geospatial filtering
- Location: `app/api/`
- Contains: Next.js route handlers for stations, favorites, ingest, auth
- Depends on: Database (`lib/db.ts`), utilities (`lib/geo.ts`, `lib/priceColor.ts`)
- Used by: Client components via fetch

**Domain Logic (Shared):**
- Purpose: Type definitions, utilities, and business rules
- Location: `lib/`
- Contains: Types, database adapters, color/price logic, geospatial math
- Depends on: Database client library (@neondatabase/serverless), Anthropic SDK
- Used by: All other layers

**Authentication:**
- Purpose: Manage user identity and session state
- Location: `auth.ts` (root level)
- Contains: NextAuth configuration with Google provider
- Depends on: NextAuth library
- Used by: `app/api/favorites` for user context, auth checks

**Database:**
- Purpose: Persist stations, prices, user favorites
- Location: `lib/db.ts`
- Contains: Query functions for stations, price snapshots, favorites
- Depends on: Neon serverless PostgreSQL client
- Used by: API routes and ingest job

## Data Flow

**Real-Time Station Browsing:**

1. User opens map at location (geolocation or manual search)
2. `MapView.tsx` calls `/api/stations?lat=X&lng=Y&radius=10&fuel=g95`
3. `app/api/stations/route.ts` queries database with bounding box
4. Database returns stations with current/previous prices
5. Server calculates distance (Haversine), filters radius, sorts by price
6. Client renders markers, legend updates with min/max prices
7. User clicks station → `StationDetail.tsx` displays history and details

**Price History View:**

1. User clicks station marker
2. `StationDetail.tsx` calls `/api/stations/[id]/history?fuel=g95&days=7`
3. Server fetches price snapshots ordered by timestamp
4. `PriceChart.tsx` (Recharts) visualizes trend
5. Color coding: green (cheap) → red (expensive) via `lib/priceColor.ts`

**Favorites Management:**

1. Authenticated user adds station to favorites
2. `StationDetail.tsx` POST to `/api/favorites` with stationId
3. Server validates session, inserts into database
4. Client updates UI to reflect favorite status
5. GET `/api/favorites` retrieves user's saved stations

**Data Ingestion (Server Job):**

1. Scheduled job posts to `/api/ingest`
2. Handler calls `runIngest()` from `lib/db.ts`
3. Fetches prices from Spanish government API (`lib/govApi.ts`)
4. Inserts new snapshots, updates current prices
5. Cron trigger: environment-configured schedule

**State Management:**

- Map view state (center, zoom): client-side via Leaflet
- User authentication: JWT token in NextAuth session
- Favorites: server-side via database, fetched on mount
- Price snapshots: immutable time-series in database

## Key Abstractions

**Station & Price Types:**
- `Station`: Base station record (id, name, location, brand)
- `StationWithPrice`: Enriched with current price, distance, delta
- `PriceSnapshot`: Historical price record (stationId, fuelType, price, timestamp)
- Location: `lib/types.ts`
- Pattern: Discriminated unions and strict typing

**Geospatial Utilities:**
- `haversineKm()`: Calculate distance between two coordinates
- `boundingBox()`: Compute lat/lng bounds for radius search
- Location: `lib/geo.ts`
- Pattern: Pure math functions, no side effects

**Price Coloring:**
- `priceColor()`: Map price to 5-stop gradient (green→lime→yellow→orange→red)
- `interpolateHex()`: Smooth color interpolation between stops
- Location: `lib/priceColor.ts`
- Pattern: Deterministic color generation based on min/max range

**Database Adapter:**
- `getStationsInBounds()`: Query stations within bounding box with prices
- `getFavorites()`: Fetch user's favorite stations
- `addFavorite()`, `removeFavorite()`: Manage user's saved list
- Location: `lib/db.ts`
- Pattern: Query isolation, connection pooling via Neon serverless

## Entry Points

**Web Application:**
- Location: `app/page.tsx`
- Triggers: HTTP GET / (user visits app)
- Responsibilities: Root client component, mounts MapView and all UI layers

**Layout & Providers:**
- Location: `app/layout.tsx`
- Triggers: Server-side rendering
- Responsibilities: Wrap app with ThemeProvider, SessionProvider, load fonts/styles

**API: Stations:**
- Location: `app/api/stations/route.ts`
- Triggers: GET /api/stations?lat=&lng=&radius=&fuel=
- Responsibilities: Query database, calculate distances, filter radius, sort by price

**API: Favorites:**
- Location: `app/api/favorites/route.ts`
- Triggers: GET/POST/DELETE /api/favorites (authenticated)
- Responsibilities: CRUD operations on user's saved stations

**API: Data Ingestion:**
- Location: `app/api/ingest/route.ts`
- Triggers: External cron job (POST)
- Responsibilities: Fetch fresh prices from government API, insert snapshots

**API: Authentication:**
- Location: `app/api/auth/[...nextauth]/route.ts`
- Triggers: NextAuth sign-in/sign-out flow (Google OAuth)
- Responsibilities: Handle OAuth callback, issue JWT tokens

## Error Handling

**Strategy:** Client-side graceful degradation, server-side HTTP status codes

**Patterns:**
- Invalid geolocation parameters → 400 Bad Request
- Missing authentication → 401 Unauthorized
- Database query failures → 500 Internal Server Error (with logging)
- Component rendering errors → error boundary (if implemented)
- Network failures → client shows fallback UI or retry button

## Cross-Cutting Concerns

**Logging:** Console output in development, structured logs via @anthropic-ai/sdk in production insights

**Validation:** Type-driven via TypeScript strict mode, runtime checks on API parameters (lat/lng/radius)

**Authentication:** JWT tokens via NextAuth, session strategy with Google provider callback

**Caching:** Browser cache for API responses (implicit via HTTP headers), database connection pooling via Neon

---

*Architecture analysis: 2026-05-09*
