# Coding Conventions

**Analysis Date:** 2026-05-09

## Language & Style

**TypeScript Configuration:**
- Target: ES2017
- JSX: react-jsx
- Strict mode enabled
- Module resolution: bundler
- Path alias: `@/*` maps to project root

**File Extensions:**
- `.ts` for utilities and library code
- `.tsx` for React components
- `.mjs` for configuration (e.g., `eslint.config.mjs`)

## Naming Conventions

**Files:**
- camelCase for source files: `config.ts`, `priceColor.ts`, `govApi.ts`
- Append `.test.ts` or `.spec.ts` for test files, colocated with source
- Example: `lib/geo.ts` with corresponding `lib/geo.test.ts`

**Functions & Variables:**
- camelCase for all function names: `getHomeConfig()`, `haversineKm()`, `priceColor()`, `boundingBox()`
- camelCase for variable names: `rawLat`, `dLat`, `radiusKm`, `lngDelta`
- Lowercase abbreviated constants acceptable: `R` (Earth radius), `a`, `t`, `i` in algorithmic functions
- Exported constants in UPPER_SNAKE_CASE when appropriate: `STOPS` array for color gradient

**Types & Interfaces:**
- PascalCase for types: `InsightInput`, `Config`
- Descriptive names with clear domain meaning: `haversineKm` (distance formula), `boundingBox` (geographic bounds)

**React Components:**
- PascalCase filenames: `AuthButton.tsx`, `FloatingSearch.tsx`, `MapView.tsx`
- 'use client' directive at top of client components

## Code Style

**Formatting:**
- ESLint config uses flat config format (`eslint.config.mjs`)
- Next.js core-web-vitals and TypeScript rules enabled
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

**Linting:**
- ESLint 9+ with Next.js presets
- Rules: Next.js core web vitals + TypeScript strict rules
- No Prettier config detected; formatting handled by ESLint

**Comments:**
- Minimal comments in pure utility functions (code is self-documenting)
- Domain-specific explanations in algorithm implementations
- Example: Comment in `priceColor.ts`: `// 5-stop gradient: green → lime → yellow → orange → red`

## Import Organization

**Order:**
1. Node.js/Runtime imports
2. Third-party dependencies (`react`, `next`, `@testing-library`)
3. Relative imports using path alias: `@/lib/*`, `@/components/*`
4. Mock imports in tests: `jest.mock('@/lib/...')`

**Path Aliases:**
- `@/*` resolves to project root
- Used consistently across all imports: `@/lib/config`, `@/lib/db`, `@/components/*`

**Module Exports:**
- Named exports for functions: `export function getHomeConfig()`, `export function priceColor()`
- Exported constants: `export const STOPS = [...]`
- Type exports: `export interface InsightInput`

## Error Handling

**Strategy:** Null/false return values for validation failures

**Patterns:**
- Functions return `null` when input validation fails: `getHomeConfig()` returns `null` for invalid env vars
- Type guards with `Number.isFinite()` for numeric validation
- No thrown errors in pure utility functions; return null for error state
- Environment variable validation happens at config load time

**Example from `config.ts`:**
```typescript
if (!rawLat || !rawLng) return null;
const lat = Number(rawLat);
if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
```

## Function Design

**Size:** Short, focused functions (5-15 lines typical)

**Parameters:**
- Use inline parameters rather than object destructuring in pure functions
- Example: `haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number`
- Preserve positional meaning for geographic coordinates (lat1, lng1, lat2, lng2)

**Return Values:**
- Explicit type annotations on all functions
- Return object shapes documented via TypeScript interfaces
- Null return for error cases in validation functions
- Example: `getHomeConfig(): { lat: number; lng: number; radiusKm: number } | null`

## Module Design

**Exports:**
- Each utility module exports focused, single-responsibility functions
- No default exports; use named exports for clarity
- Example modules: `lib/geo.ts` (geographic math), `lib/priceColor.ts` (color mapping), `lib/config.ts` (configuration)

**Library Modules:**
- `lib/` contains pure utility functions, configuration, and database access
- No side effects in utility modules
- Database access encapsulated in `lib/db.ts` with async functions
- Environment configuration in `lib/config.ts` with validation

**Component Modules:**
- `components/` contains React components marked with `'use client'` where needed
- `app/` contains Next.js route handlers and page components
- Layout and styling handled via Tailwind CSS

---

*Convention analysis: 2026-05-09*
