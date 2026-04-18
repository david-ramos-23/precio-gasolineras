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
  const r = Math.floor(ar + (br - ar) * t);
  const g = Math.floor(ag + (bg - ag) * t);
  const bv = Math.floor(ab + (bb - ab) * t);
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
