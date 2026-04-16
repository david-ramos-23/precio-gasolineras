// components/StationDetail.tsx
'use client';
import { useState, useEffect } from 'react';
import PriceChart from './PriceChart';
import type { StationWithPrice } from '@/lib/types';

interface Props {
  station: StationWithPrice;
  activeFuel: 'g95' | 'diesel';
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function StationDetail({ station, activeFuel, onClose, isFavorite, onToggleFavorite }: Props) {
  const [history, setHistory] = useState<Array<{ price: number; capturedAt: string }>>([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setHistory([]);
    fetch(`/api/stations/${station.id}/history?fuel=${activeFuel}&days=${days}`)
      .then(r => r.json())
      .then(setHistory)
      .catch(console.error);
  }, [station.id, activeFuel, days]);

  return (
    <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-3 h-full overflow-y-auto">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-white font-semibold text-base">{station.name}</h2>
          <p className="text-gray-400 text-xs mt-0.5">{station.address}</p>
          <p className="text-gray-500 text-xs">{station.municipality}, {station.province}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onToggleFavorite} className="text-lg" title="Favorita">
            {isFavorite ? '⭐' : '☆'}
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Gasolina 95</p>
          <p className="text-xl font-bold text-green-400">{station.price?.toFixed(3) ?? '—'}€</p>
        </div>
        <div className="flex-1 bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Gasóleo A</p>
          <p className="text-xl font-bold text-yellow-400">—</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Histórico</p>
          <div className="flex gap-1">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`text-xs px-2 py-0.5 rounded ${days === d ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <PriceChart data={history} fuel={activeFuel} />
      </div>

      <p className="text-xs text-gray-500">{station.distanceKm.toFixed(1)} km de distancia</p>
    </div>
  );
}
