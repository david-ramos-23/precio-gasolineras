# Codebase Structure

**Analysis Date:** 2026-05-09

## Directory Layout

```
precio-gasolineras/
├── app/                    # Next.js app router pages & API routes
│   ├── api/                # API route handlers
│   │   ├── auth/           # NextAuth OAuth flow
│   │   ├── stations/       # Geospatial station queries
│   │   ├── favorites/      # User favorites CRUD
│   │   └── ingest/         # Data ingestion (price updates)
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Main app page (client component)
├── components/             # React UI components
│   ├── MapView.tsx         # Leaflet map viewport
│   ├── TopBar.tsx          # Header with legend & controls
│   ├── StationList.tsx     # Sortable list of nearby stations
│   ├── StationDetail.tsx   # Station info & price history
│   ├── PriceChart.tsx      # Recharts price trend visualization
│   ├── ZoomControls.tsx    # Map zoom buttons
│   ├── RecenterButton.tsx  # Recenter on user location
│   ├── FloatingSearch.tsx  # Location search bar
│   ├── PriceLegend.tsx     # Color gradient legend
│   ├── UserLocationMarker.tsx # User location indicator
│   ├── AuthButton.tsx      # Sign in/out button
│   └── ThemeToggle.tsx     # Dark/light mode toggle
├── lib/                    # Shared utilities & domain logic
│   ├── types.ts            # TypeScript type definitions
│   ├── db.ts               # Database adapter (queries)
│   ├── geo.ts              # Geospatial math (Haversine, bounding box)
│   ├── priceColor.ts       # Price → color mapping
│   ├── config.ts           # Environment configuration loader
│   ├── govApi.ts           # Spanish government API client
│   ├── insights.ts         # AI price insights via Anthropic
│   ├── telegram.ts         # Telegram bot integration
│   ├── leafletIcons.ts     # Leaflet icon configurations
│   ├── math.ts             # Utility math functions
│   ├── *.test.ts           # Unit tests for lib modules
├── db/                     # Database
│   └── migrations/         # SQL migration files
├── auth.ts                 # NextAuth configuration (root level)
├── public/                 # Static assets
├── scripts/                # Build & deployment scripts
│   └── migrate.mjs         # Database migration runner
├── types/                  # Additional type definitions
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript configuration
├── next.config.js          # Next.js build configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── jest.config.js          # Jest testing configuration
├── .eslintrc.json          # ESLint configuration
├── .env.example            # Environment variables template
├── .env.local              # Local environment (gitignored)
└── README.md               # Project documentation
```

## Directory Purposes

**app/ (Next.js App Router):**
- Purpose: Server-side rendering and API routes
- Contains: Page components and route handlers
- Key files: `page.tsx` (entry point), `layout.tsx` (root wrapper)

**app/api/ (API Routes):**
- Purpose: RESTful endpoints for data operations
- Contains: Server-side handler functions
- Key files: `stations/route.ts`, `favorites/route.ts`, `ingest/route.ts`, `auth/[...nextauth]/route.ts`

**components/ (UI Components):**
- Purpose: Client-side React components for presentation
- Contains: Functional components with 'use client' directives
- Key files: `MapView.tsx` (core map), `TopBar.tsx` (header), `StationDetail.tsx` (details panel)

**lib/ (Domain Logic):**
- Purpose: Shared utilities, types, and business logic
- Contains: Pure functions, database adapters, type definitions
- Key files: `types.ts` (type definitions), `db.ts` (database), `geo.ts` (math), `priceColor.ts` (coloring)

**db/ (Database):**
- Purpose: Schema and migration files
- Contains: SQL migration scripts
- Key files: Migration files in `migrations/` subdirectory

**public/ (Static Assets):**
- Purpose: Serve static files without processing
- Contains: Images, fonts, favicons
- Committed: Yes

**scripts/ (Build Utilities):**
- Purpose: Build-time and deployment helpers
- Contains: Node.js scripts for migrations, data processing
- Key files: `migrate.mjs` (runs SQL migrations)

## Key File Locations

**Entry Points:**
- `app/page.tsx`: Main application page (client component, 'use client')
- `app/layout.tsx`: Root HTML wrapper with providers (ThemeProvider, SessionProvider)
- `app/api/stations/route.ts`: Primary API endpoint for station queries
- `auth.ts`: NextAuth configuration and session handlers

**Configuration:**
- `.env.local`: Runtime environment variables (HOME_LAT, HOME_LNG, DATABASE_URL, GOOGLE_*, etc.)
- `tsconfig.json`: TypeScript compiler options with path aliases (@/*)
- `next.config.js`: Next.js build and runtime configuration
- `tailwind.config.js`: Tailwind CSS customization
- `jest.config.js`: Test runner configuration

**Core Logic:**
- `lib/db.ts`: All database queries (stations, prices, favorites)
- `lib/geo.ts`: Geospatial calculations (Haversine distance, bounding boxes)
- `lib/priceColor.ts`: Price-to-color mapping algorithm
- `lib/types.ts`: Central type definitions (Station, PriceSnapshot, FuelType)
- `app/api/stations/route.ts`: Main data retrieval endpoint

**Testing:**
- `lib/*.test.ts`: Unit tests (jest + React Testing Library)
- `jest.config.js`: Jest configuration
- `app/api/ingest/route.test.ts`: API route tests

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `MapView.tsx`, `StationDetail.tsx`)
- Utilities: camelCase (e.g., `priceColor.ts`, `govApi.ts`)
- API routes: lowercase or bracket notation (e.g., `route.ts`, `[id]`)
- Tests: `*.test.ts` or `*.spec.ts` suffix

**Directories:**
- Components: singular or feature name (e.g., `components/`)
- Utilities: domain name (e.g., `lib/`, `db/`)
- API routes: kebab-case matching HTTP path (e.g., `app/api/stations/[id]/history/`)

**Functions:**
- Exports from `lib/`: camelCase (e.g., `haversineKm()`, `priceColor()`, `getStationsInBounds()`)
- React hooks: `use*` prefix (if any; currently none in lib)
- Type predicates: `is*` or `assert*` prefix (if any)

**Variables:**
- API query parameters: camelCase (lat, lng, radius, fuel)
- CSS classes: kebab-case (color-legend, panel-expanded, etc.)
- TypeScript types: PascalCase (Station, PriceSnapshot, FuelType)

## Where to Add New Code

**New Feature (e.g., Filter by Brand):**
- Primary code: `lib/` (new filter utility) + `components/` (new UI control)
- API changes: `app/api/stations/route.ts` (extend query parameters)
- Types: `lib/types.ts` (add to Station or create new filter type)
- Tests: co-locate with implementation (e.g., `lib/brand-filter.test.ts`)

**New Component/Module:**
- Implementation: `components/*.tsx` (UI) or `lib/*.ts` (logic)
- Exports: Default export for pages, named exports for utilities
- 'use client': Add only to client components (MapView, StationDetail, etc.)

**New API Endpoint:**
- Location: `app/api/[resource]/route.ts` (create new directory if needed)
- Pattern: Export async GET, POST, DELETE handlers
- Auth: Import `auth()` from `@/auth` for session checks
- Response: Return NextResponse.json()

**Utilities & Helpers:**
- Shared helpers: `lib/` (geo.ts, math.ts, config.ts, etc.)
- Domain logic: co-locate with feature (e.g., `lib/insights.ts` for AI features)
- Constants: Top of file or `lib/config.ts` for env-dependent values

## Special Directories

**app/api/auth/[...nextauth]/:**
- Purpose: NextAuth OAuth callback handler
- Generated: No (manually configured)
- Committed: Yes

**.next/:**
- Purpose: Next.js build output
- Generated: Yes (built by `npm run build`)
- Committed: No (in .gitignore)

**db/migrations/:**
- Purpose: SQL migration files for schema changes
- Generated: No (manually written)
- Committed: Yes

**.env.local:**
- Purpose: Local environment variables (not committed)
- Contains: DATABASE_URL, GOOGLE_ID, GOOGLE_SECRET, HOME_LAT, HOME_LNG, etc.
- Committed: No (in .gitignore)

**node_modules/:**
- Purpose: Installed npm dependencies
- Generated: Yes (via `npm install`)
- Committed: No

---

*Structure analysis: 2026-05-09*
