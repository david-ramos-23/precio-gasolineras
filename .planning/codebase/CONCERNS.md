# Codebase Concerns

**Analysis Date:** 2026-05-09

## Technical Debt

**Type-safety violations:**
- Files: `lib/govApi.ts`, `lib/leafletIcons.ts`
- Issue: Using `@typescript-eslint/no-explicit-any` and `as any` type assertions to bypass type checking
  - `parseGovResponse` accepts untyped `data: any` from government API
  - `L.Icon.Default.prototype as any` used to delete private field
- Impact: Reduces ability to catch API schema changes or leaflet API updates at compile time
- Fix approach: Create strict types for gov API response shape; use leaflet types properly or create wrapper types

**Missing error handling in client-side fetches:**
- Files: `app/page.tsx`, `components/StationDetail.tsx`
- Issue: Direct `.then(r => r.json())` chains without error handling
  - Line ~80 in `page.tsx`: `fetch('/api/favorites')...` has no `.catch()`
  - Line ~20 in `StationDetail.tsx`: `fetch('/api/stations/{id}/history')...` catches but only silently sets `loading: false`
- Impact: Silent failures; users see no error messages when API calls fail
- Fix approach: Add explicit error states and user-facing error messages; log failures for debugging

**Exposed Secrets in Environment Configuration:**
- Files: `.env.example`, `.env.local` (committed to repo)
- Issue: `.env.local` is in git history (see `.gitignore` - missing `.env.local`)
- Impact: If repo was public or credentials in `.env.local` weren't rotated, secrets could be leaked
- Fix approach: Ensure `.env.local` is in `.gitignore`; rotate all secrets in `.env.example` marked with placeholder values

## Known Bugs / Fragile Areas

**Untyped external API response parsing:**
- Files: `lib/govApi.ts` lines 14-62
- Issue: Government API response fields depend on exact JSON structure; no validation
  - Uses string keys: `item['IDEESS']`, `item['Latitud']`, `item['Longitud (WGS84)']`
  - If API adds/removes fields, code silently produces incomplete data
  - Comment notes discrepancy: "Longitud" vs "Longitud (WGS84)" (test uses 'Longitud')
- Trigger: Running ingest when gov API schema changes
- Workaround: Manual test before deployment if gov API is updated
- Fix approach: Add strict schema validation (zod/superstruct); add integration tests against real API

**Missing error recovery in ingest pipeline:**
- Files: `app/api/ingest/route.ts`
- Issue: Batch operations not transactional; partial failures not detected
  - Line 30-35: Chunks stations in 500-record batches; if one batch fails, later batches still process
  - Only catches top-level error; doesn't report which batch failed
- Impact: Data inconsistencies if chunked upserts partially fail
- Fix approach: Use database transactions; validate each batch before committing

**Client-side favorites sync issues:**
- Files: `app/page.tsx` lines 47-57
- Issue: Two favorites sources (localStorage vs database) can diverge
  - If user isn't signed in, uses localStorage
  - If user signs in, switches to database but doesn't sync localStorage → database
  - No conflict resolution strategy
- Impact: User loses local favorites when signing in
- Fix approach: On first sign-in, migrate localStorage favorites to database with merge strategy

**Silent fallback in geolocation:**
- Files: `app/page.tsx` lines 68-71
- Issue: Hard-coded fallback to Madrid (40.4168, -3.7038) if geolocation denied
- Impact: Users outside Spain see completely wrong map center; no notification
- Fix approach: Show fallback dialog; let user manually set location or use device settings dialog

## Security Considerations

**API authentication weak in ingest endpoint:**
- Files: `app/api/ingest/route.ts` lines 50-60
- Risk: Two auth methods (Bearer token or header secret); either one grants full access
  - `CRON_SECRET` and `INGEST_SECRET` are plaintext env vars
  - No rate limiting on ingest endpoint
- Current mitigation: Endpoint not publicly exposed (requires secrets); Vercel deployments don't expose internal routes without auth
- Recommendations:
  - Add request signing (HMAC-SHA256) instead of plaintext secrets
  - Implement rate limiting per secret/IP
  - Log all ingest requests with timestamp and source
  - Consider moving ingest to private internal endpoint not exposed via API

**Third-party API credential exposure:**
- Files: `lib/insights.ts`, `lib/telegram.ts`, `lib/govApi.ts`
- Risk: OpenRouter, Telegram, Neon credentials used in server code
  - If `.env` is leaked, all external services compromised
- Current mitigation: Environment variables only accessible server-side; not logged
- Recommendations:
  - Implement secret rotation schedule (quarterly minimum)
  - Add audit logging for all external API calls
  - Use least-privilege API keys (scope to IP/domain where possible)
  - Monitor for unusual request patterns (spike in tokens used)

**Local storage of user IDs:**
- Files: `app/page.tsx` lines 15-20
- Risk: localStorage stores plaintext favorite IDs; XSS could steal them
- Current mitigation: Next.js escapes inputs; no direct DOM manipulation
- Recommendations:
  - Use secure flags on session storage (sameSite, httpOnly for cookies)
  - Implement CSP headers to prevent inline script injection
  - Consider encrypting favorites in localStorage (low priority - just station IDs)

## Performance Bottlenecks

**Large component re-renders:**
- Files: `app/page.tsx` (369 lines), `components/StationList.tsx` (164 lines)
- Problem: Page component re-renders on every state change; no memoization of child components
  - `MapView` is dynamically imported but props not memoized
  - `StationList` re-renders full list on every fuel/radius change
- Current capacity: Tested with ~5000 stations; perceptible lag on list scroll
- Improvement path:
  - Wrap components with `React.memo()` to prevent unnecessary re-renders
  - Use `useDeferredValue()` for search/filter operations
  - Virtualize `StationList` for large datasets (react-window)

**Synchronous geolocation blocking:**
- Files: `app/page.tsx` lines 68-71
- Problem: `navigator.geolocation.getCurrentPosition()` can take 3-10 seconds; blocks initial render
- Impact: First load shows loading state; poor UX on slow networks
- Fix approach: Move to useEffect with timeout; show map with default center while geolocation pending

**Unoptimized Leaflet tile requests:**
- Files: `components/MapView.tsx`
- Problem: TileLayer requests all visible tiles at once; no caching strategy configured
- Impact: Slow initial map load; unnecessary requests on pan
- Fix approach: Configure tile caching headers; use lower-resolution tiles for initial load

## Fragile Areas

**Database query assumptions:**
- Files: `lib/db.ts` lines 6-15 (`getRecentSnapshot`)
- Why fragile: Assumes `price` column always castable to float; no null handling
  - If malformed data inserted, cast fails silently (Neon returns null)
- Safe modification: Add explicit null checks; validate type before casting
- Test coverage: Only 1 test (`getRecentSnapshot` returns null for missing station); no edge case tests

**Government API field name brittle:**
- Files: `lib/govApi.ts` lines 25-28
- Why fragile: String keys used directly; typo silently produces invalid data
  - `item['Longitud (WGS84)']` - if gov API changes field name (e.g., to "Longitude"), parsing fails silently
- Safe modification: Use strict schema validation before accessing fields
- Test coverage: Test mock uses hard-coded response; real API never tested in CI

**Bottom sheet animation state management:**
- Files: `app/page.tsx` lines ~120-200 (bottom sheet state)
- Why fragile: Multiple state variables control sheet behavior (`detailExpanded`, `openedFromList`, `sheetRef`, `dragZoneRef`)
  - GSAP animations reference `--panel-bottom` CSS var; if animation completes but state doesn't sync, flickers
  - Recent commits show history of flicker fixes (commits fa647e9, 52dbe81, 8a7459b)
- Safe modification: Use state machine (xstate) instead of scattered booleans; test all animation transitions
- Test coverage: No automated tests; manual QA only

**User location geolocation permission handling:**
- Files: `app/page.tsx` lines 68-71
- Why fragile: Fallback to Madrid coordinates without user knowledge
  - If user denies permission on second visit, geolocation can hang
- Safe modification: Explicit error handling with user notification; persistent permission state tracking
- Test coverage: No tests for denied permission scenario

## Missing Critical Features / Gaps

**No offline support:**
- Problem: App fetches stations on every load; no caching strategy
- Blocks: Users can't view previously loaded stations without network
- Impact: Medium - useful for commuters with poor signal in tunnels

**No error boundary / fallback UI:**
- Problem: Single error in child component crashes entire page
- Blocks: Users left with blank screen on component errors
- Impact: High - reduces reliability perception

**Missing input validation on API routes:**
- Files: `app/api/stations/route.ts` lines 6-11
- Problem: `parseFloat()` on lat/lng returns NaN silently; only checked with `isNaN()`
  - No validation of fuel enum values
  - No validation of radius bounds (could request radius=999999)
- Impact: Medium - potential DoS if malicious requests bypass bounds checking

**No monitoring/alerting on ingest failures:**
- Files: `app/api/ingest/route.ts` lines 66-70
- Problem: Errors logged to console but no notification to operator
  - If ingest fails twice, no alert sent
- Blocks: Operator unaware that price data is stale
- Impact: High - users see outdated prices

**No rate limiting on public APIs:**
- Files: `app/api/stations/route.ts`, `app/api/favorites/route.ts`
- Problem: No request throttling; malicious user could hammer API
- Impact: Medium - could cause database overload or high query costs

## Test Coverage Gaps

**Integration tests missing:**
- Files: `app/api/ingest/route.test.ts`
- What's not tested: Actual data flow from gov API → database → client
  - Only `verifyIngestSecret` tested (3 cases)
  - No tests for chunked upsert logic
  - No tests for snapshot insertion
  - No tests for telegram notification flow
- Risk: Schema changes in gov API or db undetected until production
- Priority: High

**Client-side state management untested:**
- Files: `app/page.tsx` (369 lines)
- What's not tested: Favorites sync, geolocation flow, sheet animations
  - No tests for localStorage → database migration on sign-in
  - No tests for race conditions (fast radius change while request pending)
- Risk: Silent failures in critical user flows
- Priority: High

**API error handling untested:**
- Files: `app/api/stations/route.ts`, all route handlers
- What's not tested: Behavior when upstream APIs fail (gov API, Neon, Telegram, OpenRouter)
  - No tests for malformed input (invalid lat/lng/radius)
  - No tests for rate limiting scenarios
- Risk: Users see raw error messages instead of friendly fallbacks
- Priority: Medium

**Database query edge cases untested:**
- Files: `lib/db.ts` (208 lines)
- What's not tested: Null handling, type casting, transaction rollback
  - `db.test.ts` has only 1 real test
  - No tests for concurrent upserts
  - No tests for constraint violations
- Risk: Data corruption undetected
- Priority: Medium

---

*Concerns audit: 2026-05-09*
