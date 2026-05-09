# Testing Patterns

**Analysis Date:** 2026-05-09

## Test Framework

**Runner:**
- Jest 30.3.0
- Config: `jest.config.ts`
- Environment: node
- Transform: ts-jest with React JSX support

**Assertion Library:**
- Jest built-in matchers: `expect()`, `toBe()`, `toEqual()`, `toBeNull()`, `toBeCloseTo()`, `toContain()`

**Run Commands:**
```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode for development
```

**Test Discovery:**
- Pattern: `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`, `**/*.spec.tsx`
- Test files colocated with source (same directory)

## Test File Organization

**Location:**
- Colocated pattern: `lib/config.ts` paired with `lib/config.test.ts`
- Same directory as source file
- No separate `__tests__` directories

**Naming:**
- Format: `{name}.test.ts`
- Example: `config.test.ts`, `geo.test.ts`, `priceColor.test.ts`

**Structure:**
```
lib/
├── config.ts
├── config.test.ts
├── geo.ts
├── geo.test.ts
├── priceColor.ts
└── priceColor.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
describe('functionName', () => {
  it('describes behavior', () => {
    expect(result).toBe(expected);
  });
});
```

**Setup/Teardown Patterns:**
- Environment variable mocking using `beforeEach` and `afterAll`
- Test isolation via cloning `process.env`
- Example from `config.test.ts`:
```typescript
const OLD_ENV = process.env;
beforeEach(() => { process.env = { ...OLD_ENV }; });
afterAll(() => { process.env = OLD_ENV; });
```

**Assertion Style:**
- Direct equality checks: `expect(...).toBe(value)`
- Object equality: `expect(...).toEqual({ lat: 40.4168, lng: -3.7038, radiusKm: 25 })`
- Null checks: `expect(...).toBeNull()`
- Range checks: `expect(...).toBeGreaterThan(500)`, `expect(...).toBeLessThan(530)`
- Numeric precision: `expect(...).toBeCloseTo(0)` for floating point comparison
- Regex matching: `expect(...).toMatch(/^#[0-9a-f]{6}$/)`

## Mocking

**Framework:** Jest built-in mocks via `jest.mock()`

**Patterns:**
```typescript
jest.mock('@/lib/db', () => ({
  bulkUpsertStations: jest.fn(),
  bulkInsertSnapshots: jest.fn(),
  getFavoritesWithCurrentPrice: jest.fn(),
  mean: jest.fn(),
  mode: jest.fn(),
}));
jest.mock('@/lib/govApi', () => ({ fetchGovData: jest.fn() }));
jest.mock('@/lib/insights', () => ({ generateInsight: jest.fn() }));
```

**What to Mock:**
- External API calls: `govApi.fetchGovData`, `insights.generateInsight`
- Database operations: `db.bulkUpsertStations`, `db.bulkInsertSnapshots`
- Infrastructure dependencies: `telegram.sendTelegramMessage`
- Configuration: `config.getHomeConfig` can be mocked to return null/specific values

**What NOT to Mock:**
- Pure utility functions with no side effects: `geo.haversineKm()`, `priceColor.interpolateHex()`, `math` functions
- These functions should be tested with real inputs for precision validation
- Example: `haversineKm` tested with known distances (Madrid-Barcelona ~500-530km)

## Fixtures and Factories

**Test Data:**
- Inline test data in test files
- Geographic coordinates (Madrid/Barcelona): `lat: 40.4168, lng: -3.7038`
- Price ranges for color testing: min=1.4, max=1.8, test values=1.4,1.6,1.8,1.0,2.5
- No centralized fixture files detected

**Location:**
- Test data defined at top of test suites or in `describe` blocks
- Example:
```typescript
it('returns ~500-530km between Madrid and Barcelona', () => {
  const d = haversineKm(40.4168, -3.7038, 41.3851, 2.1734);
  expect(d).toBeGreaterThan(500);
  expect(d).toBeLessThan(530);
});
```

## Coverage

**Requirements:** Not enforced (no coverage config detected in jest.config.ts)

**View Coverage:** No coverage command configured; add via package.json if needed

**Current Coverage:** 7 test files identified covering:
- Configuration validation: `config.test.ts` (6 tests)
- Geographic calculations: `geo.test.ts` (5 tests)
- Color mapping: `priceColor.test.ts` (6 tests)
- Database operations: `db.test.ts` (1 basic test)
- Insight generation: `insights.test.ts` (1 basic test)
- API ingestion: `app/api/ingest/route.test.ts` (3 tests)
- Government API: `lib/govApi.test.ts` (1+ tests)

## Test Types

**Unit Tests:**
- Scope: Pure utility functions with no external dependencies
- Approach: Direct input/output testing
- Examples: `geo.haversineKm()` distance calculation, `priceColor()` color mapping, `config.getHomeConfig()` validation
- No async testing required for these functions

**Integration Tests:**
- Scope: API route handlers with mocked dependencies
- Approach: Mock database, external APIs, configuration
- Examples: `app/api/ingest/route.test.ts` tests request handling with all external calls mocked
- Environment variable mocking for isolation

**E2E Tests:**
- Status: Not detected in codebase
- No end-to-end test framework configured

## Async Testing

**Pattern:** Not heavily used in current tests

**Available approach:** Jest supports async/await in test functions:
```typescript
it('async function', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});
```

**Example (not yet in codebase):**
```typescript
it('returns null for unknown station', async () => {
  const result = await getRecentSnapshot('NONEXISTENT_ID_999', 'g95');
  expect(result).toBeNull();
});
```

## Error Case Testing

**Pattern:** Validation error handling via null returns

**Example from `config.test.ts`:**
```typescript
it('returns null when HOME_LAT is not a number', () => {
  process.env.HOME_LAT = 'invalid';
  process.env.HOME_LNG = '-3.7038';
  expect(getHomeConfig()).toBeNull();
});

it('returns null when vars are absent', () => {
  delete process.env.HOME_LAT;
  delete process.env.HOME_LNG;
  expect(getHomeConfig()).toBeNull();
});
```

**Tested Scenarios:**
- Missing required environment variables
- Invalid numeric inputs (non-numeric strings)
- Edge cases: zero coordinates, negative radius values
- Boundary conditions: min/max prices, geographic bounds

## Test Coverage Gaps

**Untested Areas:**
- React components: No component tests detected (`components/*.tsx`)
- Database access beyond basic null checks: `lib/db.test.ts` has only 1 test
- Government API fetch logic: `lib/govApi.test.ts` minimal coverage
- Telegram notification delivery: Not tested
- Authentication flow: Not tested
- Route handlers beyond `ingest`: Other API routes untested

**Risk Areas:**
- Component rendering and user interaction (no React Testing Library tests)
- Database queries and snapshots (minimal test coverage)
- External API integration with real government data source (only basic mocking)
- Error recovery and retry logic not validated

**Priority Gaps (High):**
- React component rendering and event handling
- Database operations (insert, query, update)
- Error recovery in data ingestion pipeline

---

*Testing analysis: 2026-05-09*
