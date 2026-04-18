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
              background: `linear-gradient(to right, ${STOPS.join(', ')})`,
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
