'use client';
import { STOPS } from '@/lib/priceColor';

interface Props {
  count: number;
  minPrice: number;
  maxPrice: number;
}

export function PriceLegend({ count, minPrice, maxPrice }: Props) {
  if (count === 0) return null;

  return (
    <div className="absolute top-[58px] left-0 right-0 flex justify-center z-[999] pointer-events-none">
      <div className="flex items-center gap-2 bg-[var(--panel)] border border-t-0 border-[var(--panel-border)] backdrop-blur-md rounded-b-2xl px-4 py-1 shadow-md">
        <span
          className="text-[10px] tabular-nums text-[var(--foreground)]/50"
          style={{ fontFamily: 'var(--font-fira-code)' }}
        >
          {minPrice.toFixed(3)}€
        </span>
        <div className="relative flex items-center gap-1.5">
          <div
            className="w-16 h-1.5 rounded-full"
            style={{ background: `linear-gradient(to right, ${STOPS.join(', ')})` }}
          />
          <span className="text-[10px] text-[var(--foreground)]/40" style={{ fontFamily: 'var(--font-fira-code)' }}>
            {count}
          </span>
        </div>
        <span
          className="text-[10px] tabular-nums text-[var(--foreground)]/50"
          style={{ fontFamily: 'var(--font-fira-code)' }}
        >
          {maxPrice.toFixed(3)}€
        </span>
      </div>
    </div>
  );
}
