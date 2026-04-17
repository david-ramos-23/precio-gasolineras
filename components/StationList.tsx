'use client';
import type { StationWithPrice } from '@/lib/types';

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
  fuel: 'g95' | 'diesel';
}

export default function StationList({ stations, selectedId, onSelect, fuel }: Props) {
  if (stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2">
        <p className="text-sm text-slate-500">Sin gasolineras en esta zona</p>
        <p className="text-xs text-slate-600">Aumenta el radio o mueve el mapa</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-800/60 shrink-0">
        <p className="text-xs text-slate-500" style={{ fontFamily: 'var(--font-fira-code)' }}>
          {stations.length} estaciones · {fuel === 'g95' ? 'Gasolina 95' : 'Gasóleo A'}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {stations.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                selectedId === s.id
                  ? 'bg-green-500/10 border border-green-500/25'
                  : 'hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <span className="text-xs text-slate-600 w-5 text-right shrink-0 tabular-nums"
                style={{ fontFamily: 'var(--font-fira-code)' }}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">{s.name}</p>
                {s.distanceKm != null && (
                  <p className="text-xs text-slate-600 tabular-nums" style={{ fontFamily: 'var(--font-fira-code)' }}>
                    {s.distanceKm.toFixed(1)} km
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {s.price != null ? (
                  <span className={`text-sm font-bold tabular-nums ${i === 0 ? 'text-green-400' : i <= 2 ? 'text-yellow-400' : 'text-slate-200'}`}
                    style={{ fontFamily: 'var(--font-fira-code)' }}>
                    {s.price.toFixed(3)}€
                  </span>
                ) : <span className="text-slate-500 text-sm">—</span>}
                <DeltaBadge delta={s.priceDelta ?? null} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
