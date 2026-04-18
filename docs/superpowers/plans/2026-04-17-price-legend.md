# Plan B — Viewport price legend, smooth color gradient & sort toggle

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Color map markers by price relative to the current viewport (green=cheapest, red=most expensive), display a floating legend with the min/max price range and station count in view, and add a sort toggle (price / distance) to the station list.

**Architecture:** MapView emits `L.LatLngBounds` on every `moveend`/`zoomend` + once on mount. `page.tsx` tracks those bounds, derives `visibleStations` and `priceRange` from them, then passes `priceRange` back to MapView (for marker colors) and `count/min/max` to a new `PriceLegend` component. The color function is extracted to `lib/priceColor.ts` with a smooth 5-stop hex interpolation (replaces the current 3-tier discrete version). The sort toggle lives entirely inside `StationList` as local state — `distanceKm` is already in `StationWithPrice`, no API changes needed.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, React-Leaflet 5 (`useMapEvents`, `L.LatLngBounds`), Tailwind v4 CSS-first (CSS vars), Jest + ts-jest.

---

## Repo & branch context

Work from `D:\dev\precio-gasolineras\` (master, all source at repo root after merge). Create a feature branch:

```bash
cd D:/dev/precio-gasolineras
git checkout -b feat/price-legend
```

---

## File Structure

**Created:**
- `lib/priceColor.ts` — exported `priceColor(price, min, max)` with 5-stop interpolation + `interpolateHex` helper
- `lib/priceColor.test.ts` — unit tests for both functions
- `components/PriceLegend.tsx` — floating pill: "X gasolineras en vista" + CSS gradient bar + min€/max€

**Modified:**
- `components/MapView.tsx` — extend `MapEventHandler` to emit bounds on move/zoom/mount; add `onBoundsChange` + `priceRange` props; remove inline `priceColor`; use imported `priceColor` with `priceRange`
- `app/page.tsx` — add `bounds` state, derive `visibleStations` + `priceRange`, pass to MapView and PriceLegend; import `LatLngBounds` type
- `components/StationList.tsx` — add `sortBy` state + sort computation + two-button toggle in header

---

## Task 1: Extract `priceColor` to `lib/priceColor.ts` with smooth gradient

**Files:**
- Create: `lib/priceColor.ts`
- Create: `lib/priceColor.test.ts`

- [ ] **Step 1:** Write tests first in `lib/priceColor.test.ts`:

```ts
import { priceColor, interpolateHex } from './priceColor';

describe('interpolateHex', () => {
  it('returns start color at t=0', () => {
    expect(interpolateHex('#000000', '#ffffff', 0)).toBe('#000000');
  });
  it('returns end color at t=1', () => {
    expect(interpolateHex('#000000', '#ffffff', 1)).toBe('#ffffff');
  });
  it('returns midpoint at t=0.5', () => {
    // 0x00 + 0.5*(0xff-0x00) = 127 = 0x7f
    expect(interpolateHex('#000000', '#ffffff', 0.5)).toBe('#7f7f7f');
  });
});

describe('priceColor', () => {
  it('returns amber when min === max (no spread)', () => {
    expect(priceColor(1.5, 1.5, 1.5)).toBe('#eab308');
  });
  it('returns green for the cheapest station (t=0)', () => {
    expect(priceColor(1.4, 1.4, 1.8)).toBe('#22c55e');
  });
  it('returns red for the most expensive station (t=1)', () => {
    expect(priceColor(1.8, 1.4, 1.8)).toBe('#ef4444');
  });
  it('returns a value between green and red for a midpoint price', () => {
    const mid = priceColor(1.6, 1.4, 1.8);
    expect(mid).not.toBe('#22c55e');
    expect(mid).not.toBe('#ef4444');
    expect(mid).toMatch(/^#[0-9a-f]{6}$/);
  });
  it('clamps below min to green', () => {
    expect(priceColor(1.0, 1.4, 1.8)).toBe('#22c55e');
  });
  it('clamps above max to red', () => {
    expect(priceColor(2.5, 1.4, 1.8)).toBe('#ef4444');
  });
});
```

- [ ] **Step 2:** Run tests — confirm they fail:

```bash
cd D:/dev/precio-gasolineras && npm test -- --testPathPattern=priceColor
```

Expected: `Cannot find module './priceColor'`

- [ ] **Step 3:** Create `lib/priceColor.ts`:

```ts
// 5-stop gradient: green → lime → yellow → orange → red
const STOPS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'] as const;

export function interpolateHex(a: string, b: string, t: number): string {
  const parse = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ] as const;
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bv = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bv.toString(16).padStart(2, '0')}`;
}

export function priceColor(price: number, min: number, max: number): string {
  if (max === min) return '#eab308'; // amber when no spread
  const t = Math.max(0, Math.min(1, (price - min) / (max - min)));
  const scaled = t * (STOPS.length - 1);
  const i = Math.floor(scaled);
  if (i >= STOPS.length - 1) return STOPS[STOPS.length - 1];
  return interpolateHex(STOPS[i], STOPS[i + 1], scaled - i);
}
```

- [ ] **Step 4:** Run tests — confirm they pass:

```bash
npm test -- --testPathPattern=priceColor
```

Expected: `PASS lib/priceColor.test.ts` — 9 tests green.

- [ ] **Step 5:** Commit:

```bash
git add lib/priceColor.ts lib/priceColor.test.ts
git commit -m "feat: extract priceColor with smooth 5-stop hex gradient"
```

---

## Task 2: Emit viewport bounds from MapView, derive visibleStations in page.tsx

**Files:**
- Modify: `components/MapView.tsx`
- Modify: `app/page.tsx`

This task has two parts: (A) MapView emits bounds, (B) page.tsx receives them and computes derived state.

### Part A — MapView changes

- [ ] **Step 1:** Open `components/MapView.tsx`. At the top, add the `priceColor` import and `LatLngBounds` type import, and remove the old `interpolateHex`/`priceColor` inline functions (currently lines 10–16):

```tsx
// components/MapView.tsx
'use client';
import { useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import type { LatLngBounds } from 'leaflet';
import { useTheme } from 'next-themes';
import { fixLeafletIcons } from '@/lib/leafletIcons';
import { priceColor } from '@/lib/priceColor';
import type { StationWithPrice } from '@/lib/types';
import { UserLocationMarker } from '@/components/UserLocationMarker';
```

(The 7-line `priceColor` function block that follows the imports in the current file must be deleted — it is replaced by the import above.)

- [ ] **Step 2:** Replace the `MapEventHandler` function with this version that also emits bounds and fires once on mount:

```tsx
function MapEventHandler({
  onCenterChange,
  onBoundsChange,
}: {
  onCenterChange: (center: [number, number]) => void;
  onBoundsChange: (bounds: LatLngBounds) => void;
}) {
  const map = useMap();

  const emit = useCallback(() => {
    const c = map.getCenter();
    onCenterChange([c.lat, c.lng]);
    onBoundsChange(map.getBounds());
  }, [map, onCenterChange, onBoundsChange]);

  useMapEvents({
    moveend: emit,
    zoomend: emit,
  });

  // Emit once on mount so page.tsx has bounds before the first pan
  useEffect(() => { emit(); }, [emit]);

  return null;
}
```

- [ ] **Step 3:** Update the `Props` interface and component signature. Replace the current Props block:

```tsx
interface Props {
  stations: StationWithPrice[];
  selectedStation: StationWithPrice | null;
  onSelectStation: (s: StationWithPrice) => void;
  userLocation: [number, number] | null;
  onCenterChange: (center: [number, number]) => void;
  onBoundsChange: (bounds: LatLngBounds) => void;
  priceRange: { min: number; max: number };
  flyToCenter?: [number, number] | null;
}

export default function MapView({
  stations, selectedStation, onSelectStation,
  userLocation, onCenterChange, onBoundsChange,
  priceRange, flyToCenter = null,
}: Props) {
```

- [ ] **Step 4:** Inside the component body, replace the current price range computation (lines that compute `prices`, `minPrice`, `maxPrice`) with a destructure of the new prop:

```tsx
  const { min: minPrice, max: maxPrice } = priceRange;
```

- [ ] **Step 5:** Pass `onBoundsChange` to `MapEventHandler` in the JSX:

```tsx
<MapEventHandler onCenterChange={onCenterChange} onBoundsChange={onBoundsChange} />
```

### Part B — page.tsx changes

- [ ] **Step 6:** Open `app/page.tsx`. Add `LatLngBounds` type import (type-only, erased at compile time):

```tsx
import type { LatLngBounds } from 'leaflet';
```

- [ ] **Step 7:** Add `bounds` state inside `Home()`, after the existing state declarations:

```tsx
const [bounds, setBounds] = useState<LatLngBounds | null>(null);
```

- [ ] **Step 8:** Add computed values after state declarations (before the `useEffect` blocks):

```tsx
const visibleStations = bounds
  ? stations.filter(s => bounds.contains({ lat: s.lat, lng: s.lng }))
  : stations;

const visiblePrices = visibleStations
  .map(s => s.price)
  .filter((p): p is number => p !== null);

const priceRange = visiblePrices.length > 0
  ? { min: Math.min(...visiblePrices), max: Math.max(...visiblePrices) }
  : { min: 0, max: 0 };
```

- [ ] **Step 9:** Update the `<MapView />` JSX to pass the two new props:

```tsx
<MapView
  stations={stations}
  selectedStation={selected}
  onSelectStation={s => { setSelected(s); setShowList(true); }}
  userLocation={userLocation}
  onCenterChange={setMapCenter}
  onBoundsChange={setBounds}
  priceRange={priceRange}
  flyToCenter={flyToCenter}
/>
```

- [ ] **Step 10:** Run TypeScript check:

```bash
cd D:/dev/precio-gasolineras && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 11:** Start dev server and verify viewport-aware colors:

```bash
npm run dev
```

Open `http://localhost:3000`. Zoom into a dense urban area. Confirm:
- The cheapest visible station is green, the most expensive is red.
- Pan to a different area — colors recalculate. Zoom in on an expensive cluster — the cheapest within that cluster becomes green.

- [ ] **Step 12:** Commit:

```bash
git add components/MapView.tsx app/page.tsx
git commit -m "feat: viewport-aware price gradient for map markers"
```

---

## Task 3: PriceLegend component

**Files:**
- Create: `components/PriceLegend.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1:** Create `components/PriceLegend.tsx`. The gradient colors in the CSS string must match the 5 stops in `lib/priceColor.ts` exactly:

```tsx
'use client';

interface Props {
  count: number;
  minPrice: number;
  maxPrice: number;
}

export function PriceLegend({ count, minPrice, maxPrice }: Props) {
  if (count === 0) return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
      <div className="flex flex-col items-center gap-1.5 bg-[var(--panel)] border border-[var(--panel-border)] backdrop-blur-md rounded-xl px-3 py-2 shadow-md">
        <p
          className="text-[10px] font-medium tracking-wide uppercase text-[var(--foreground)]/50"
          style={{ fontFamily: 'var(--font-fira-code)' }}
        >
          {count} gasolineras en vista
        </p>
        <div className="flex items-center gap-2">
          <span
            className="text-xs tabular-nums text-[var(--foreground)]/70"
            style={{ fontFamily: 'var(--font-fira-code)' }}
          >
            {minPrice.toFixed(3)}€
          </span>
          <div
            className="w-20 h-2 rounded-full"
            style={{
              background:
                'linear-gradient(to right, #22c55e, #84cc16, #eab308, #f97316, #ef4444)',
            }}
          />
          <span
            className="text-xs tabular-nums text-[var(--foreground)]/70"
            style={{ fontFamily: 'var(--font-fira-code)' }}
          >
            {maxPrice.toFixed(3)}€
          </span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2:** Add `PriceLegend` to `app/page.tsx`.

Add the import:
```tsx
import { PriceLegend } from '@/components/PriceLegend';
```

Add the component after the `{/* Full-screen map */}` closing `</div>` and before `<RecenterButton>`:

```tsx
{/* Price legend — centered below TopBar, above map content */}
{visiblePrices.length > 0 && (
  <PriceLegend
    count={visibleStations.length}
    minPrice={priceRange.min}
    maxPrice={priceRange.max}
  />
)}
```

- [ ] **Step 3:** Verify visually at `http://localhost:3000`:
- Legend pill appears centered below the TopBar pill.
- Shows e.g. "28 gasolineras en vista" with "1.403€ [green→red gradient] 1.869€".
- Values update as you pan/zoom.
- On mobile (DevTools 375px): legend is visible, doesn't overlap the mobile FAB at the bottom.

- [ ] **Step 4:** Commit:

```bash
git add components/PriceLegend.tsx app/page.tsx
git commit -m "feat: floating price legend with viewport range and station count"
```

---

## Task 4: Sort toggle in StationList

**Files:**
- Modify: `components/StationList.tsx`

- [ ] **Step 1:** Open `components/StationList.tsx`. After the existing `const [collapsed, setCollapsed] = useState(false);`, add:

```tsx
const [sortBy, setSortBy] = useState<'price' | 'distance'>('price');

const sorted = [...stations].sort((a, b) => {
  if (sortBy === 'price') {
    if (a.price === null && b.price === null) return 0;
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return a.price - b.price;
  }
  return a.distanceKm - b.distanceKm;
});
```

- [ ] **Step 2:** In the JSX, replace `stations.map(...)` with `sorted.map(...)` (currently line 56). The rank color logic (`i === 0`, `i <= 2`) already keys on sorted index, so no change needed there.

- [ ] **Step 3:** Replace the header's stats `<span>` with the sort toggle. Current header content to replace:

```tsx
{/* replace this span: */}
<span className="text-xs text-[var(--foreground)]/40" style={{ fontFamily: 'var(--font-fira-code)' }}>
  {stations.length} · {fuel === 'g95' ? 'G95' : 'Gasoil'}
</span>
```

Replace with:

```tsx
<div
  className="flex items-center gap-1.5"
  onClick={e => e.stopPropagation()}
>
  <div className="flex rounded-lg overflow-hidden border border-[var(--panel-border)] text-[10px] font-medium">
    <button
      type="button"
      onClick={() => setSortBy('price')}
      className={`px-2 py-1 transition-colors ${
        sortBy === 'price'
          ? 'bg-[var(--accent)] text-white'
          : 'text-[var(--foreground)]/50 hover:text-[var(--foreground)]'
      }`}
    >
      Precio
    </button>
    <button
      type="button"
      onClick={() => setSortBy('distance')}
      className={`px-2 py-1 transition-colors ${
        sortBy === 'distance'
          ? 'bg-[var(--accent)] text-white'
          : 'text-[var(--foreground)]/50 hover:text-[var(--foreground)]'
      }`}
    >
      Distancia
    </button>
  </div>
</div>
```

(The wrapping `onClick={e => e.stopPropagation()}` prevents the sort button clicks from triggering the header's collapse toggle.)

- [ ] **Step 4:** Verify visually at `http://localhost:3000` (desktop, md breakpoint):
- "Precio" button is active (green background) by default; list is sorted cheapest first.
- Click "Distancia" — list re-sorts nearest first; rank colors follow new order (nearest = green #1).
- Clicking the header (not the sort buttons) still collapses/expands the list.

- [ ] **Step 5:** Commit:

```bash
git add components/StationList.tsx
git commit -m "feat: sort by price/distance toggle in station list"
```

---

## Task 5: Full suite, typecheck, push & deploy

- [ ] **Step 1:** Run full test suite:

```bash
cd D:/dev/precio-gasolineras && npm test
```

Expected: all tests pass including the new `priceColor.test.ts`. Output ends with `Test Suites: N passed`.

- [ ] **Step 2:** Run typecheck and lint:

```bash
npx tsc --noEmit && npm run lint
```

Expected: no errors, no warnings.

- [ ] **Step 3:** Push the feature branch:

```bash
git push -u origin feat/price-legend
```

Expected: branch pushed. Vercel creates a preview deployment and comments the URL on the GitHub PR if one is opened.

- [ ] **Step 4:** Merge to master for production deploy:

```bash
git checkout master
git merge --no-ff feat/price-legend -m "merge: viewport price legend, smooth gradient and sort toggle"
git push origin master
```

Expected: Vercel triggers production deployment automatically. Live at `https://precio-gasolineras-murex.vercel.app`.

---

## Verification (end-to-end)

1. **Color gradient:** Markers range from vivid green (cheapest in view) to red (most expensive). Zoom into a uniform-price cluster — colors spread across the gradient within that local range.

2. **Legend pill:** Appears centered below the TopBar showing e.g. `28 gasolineras en vista` and `1.403€ ——[green→red]—— 1.869€`. Updates on every pan/zoom.

3. **Sort toggle in list:** "Precio" active by default (cheapest first, #1 in green). "Distancia" re-sorts nearest first.

4. **No regressions:** Marker click → StationDetail opens. Theme toggle swaps tiles + CSS vars. Mobile bottom sheet intact. Favorites still toggle. Telegram cron unaffected.

---

## Out of scope (Plan C — planificar aparte)

- Búsqueda por texto/localidad con Nominatim geocoding
- Indicador "venta restringida" (campo en API Ministerio)
- Más tipos de combustible: G98, GLP, GNC
