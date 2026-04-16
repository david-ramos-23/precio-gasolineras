// components/StationList.tsx
'use client';
import type { StationWithPrice } from '@/lib/types';

interface Props {
  stations: StationWithPrice[];
  selectedId: string | null;
  onSelect: (s: StationWithPrice) => void;
  fuel: 'g95' | 'diesel';
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const cents = (delta * 100).toFixed(1);
  const isUp = delta > 0;
  return (
    <span className={`text-xs font-medium ${isUp ? 'text-red-400' : 'text-green-400'}`}>
      {isUp ? '▲' : '▼'}{Math.abs(Number(cents))}¢
    </span>
  );
}

export default function StationList({ stations, selectedId, onSelect, fuel }: Props) {
  return (
    <div className="flex flex-col gap-1 overflow-y-auto max-h-full">
      {stations.length === 0 && (
        <p className="text-sm text-gray-400 p-4 text-center">No hay gasolineras en esta zona con precio disponible.</p>
      )}
      {stations.map((s, i) => (
        <button
          key={s.id}
          onClick={() => onSelect(s)}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
            ${selectedId === s.id ? 'bg-blue-900' : 'bg-gray-800 hover:bg-gray-700'}`}
        >
          <span className={`text-xs font-bold w-5 text-center rounded
            ${i === 0 ? 'text-green-400' : i === 1 ? 'text-yellow-400' : 'text-gray-400'}`}>
            #{i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{s.name}</p>
            <p className="text-xs text-gray-400">{s.distanceKm.toFixed(1)} km · {s.municipality}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-white">{s.price?.toFixed(3)}€</p>
            <DeltaBadge delta={s.priceDelta} />
          </div>
        </button>
      ))}
    </div>
  );
}
