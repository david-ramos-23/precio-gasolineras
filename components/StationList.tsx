'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { StationWithPrice, FuelType } from '@/lib/types';

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null || Math.abs(delta) < 0.0005) return null;
  const up = delta > 0;
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${up ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'}`}
      style={{ fontFamily: 'var(--font-fira-code)' }}>
      {up ? '▲' : '▼'} {Math.abs(delta * 100).toFixed(1)}¢
    </span>
  );
}

interface Props {
  stations: StationWithPrice[];
  selectedId: string | null;
  onSelect: (s: StationWithPrice) => void;
  fuel: FuelType;
  favorites?: string[];
}

export default function StationList({ stations, selectedId, onSelect, fuel, favorites = [] }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'distance'>('price');
  const [onlyFavs, setOnlyFavs] = useState(false);

  const displayed = onlyFavs ? stations.filter(s => favorites.includes(s.id)) : stations;
  const sorted = [...displayed].sort((a, b) => {
    if (sortBy === 'price') {
      if (a.price === null && b.price === null) return 0;
      if (a.price === null) return 1;
      if (b.price === null) return -1;
      return a.price - b.price;
    }
    return a.distanceKm - b.distanceKm;
  });

  return (
    <div className="w-72 flex flex-col rounded-2xl bg-[var(--panel)] border border-[var(--panel-border)] shadow-xl backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-[var(--panel-border)] cursor-pointer select-none"
        onClick={() => setCollapsed(c => !c)}
      >
        <span className="text-sm font-semibold text-[var(--foreground)]">Gasolineras cercanas</span>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5"
            onClick={e => e.stopPropagation()}
          >
            {favorites.length > 0 && (
              <button
                type="button"
                onClick={() => setOnlyFavs(v => !v)}
                className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${
                  onlyFavs ? 'bg-amber-400/20 text-amber-400' : 'text-[var(--foreground)]/40 hover:text-[var(--foreground)]'
                }`}
                title="Solo favoritos"
              >★</button>
            )}
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
          <ChevronDown
            size={16}
            className={`text-[var(--foreground)]/50 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Scrollable list body */}
      {!collapsed && (
        <div className="overflow-y-auto max-h-[55vh]">
          {stations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 px-4">
              <p className="text-sm text-[var(--foreground)]/40 text-center">Sin gasolineras en esta zona</p>
              <p className="text-xs text-[var(--foreground)]/25 text-center">Aumenta el radio o mueve el mapa</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {sorted.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => onSelect(s)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                    selectedId === s.id
                      ? 'bg-green-500/10 border border-green-500/25'
                      : 'hover:bg-[var(--foreground)]/5 border border-transparent'
                  }`}
                >
                  <span className="text-xs text-[var(--foreground)]/30 w-5 text-right shrink-0 tabular-nums"
                    style={{ fontFamily: 'var(--font-fira-code)' }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate flex items-center gap-1">
                      <span className="truncate">{s.name}</span>
                      {favorites.includes(s.id) && (
                        <span className="shrink-0 text-amber-400 text-[10px]" title="Favorita">★</span>
                      )}
                      {s.ventaRestringida && (
                        <span
                          className="shrink-0 text-[9px] font-bold px-1 py-0.5 rounded bg-orange-500/20 text-orange-400 leading-none"
                          title="Venta restringida — solo socios"
                        >
                          VR
                        </span>
                      )}
                    </p>
                    {s.distanceKm != null && (
                      <p className="text-xs text-[var(--foreground)]/40 tabular-nums" style={{ fontFamily: 'var(--font-fira-code)' }}>
                        {s.distanceKm.toFixed(1)} km
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {s.price != null ? (
                      <span className={`text-sm font-bold tabular-nums ${i === 0 ? 'text-green-400' : i <= 2 ? 'text-yellow-400' : 'text-[var(--foreground)]'}`}
                        style={{ fontFamily: 'var(--font-fira-code)' }}>
                        {s.price.toFixed(3)}€
                      </span>
                    ) : <span className="text-[var(--foreground)]/30 text-sm">—</span>}
                    <DeltaBadge delta={s.priceDelta ?? null} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
