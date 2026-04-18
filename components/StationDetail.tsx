'use client';
import { useState, useEffect } from 'react';
import { X, Star, MapPin, Navigation } from 'lucide-react';
import PriceChart from './PriceChart';
import type { StationWithPrice, FuelType } from '@/lib/types';

interface Props {
  station: StationWithPrice;
  activeFuel: FuelType;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function StationDetail({ station, activeFuel, onClose, isFavorite, onToggleFavorite }: Props) {
  const [history, setHistory] = useState<Array<{ price: number; capturedAt: string }>>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setHistory([]);
    fetch(`/api/stations/${station.id}/history?fuel=${activeFuel}&days=${days}`)
      .then(r => r.json())
      .then(data => { setHistory(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [station.id, activeFuel, days]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[var(--panel-border)] shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-[var(--foreground)] truncate">{station.name}</h2>
            {station.ventaRestringida && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-orange-400">
                <span>🔒</span>
                <span>Venta restringida (solo socios/cooperativa)</span>
              </div>
            )}
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-[var(--foreground)]/50 shrink-0" />
              <p className="text-xs text-[var(--foreground)]/50 truncate">{station.address}</p>
            </div>
            <p className="text-xs text-[var(--foreground)]/40 mt-0.5">{station.municipality}, {station.province}</p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}&travelmode=driving`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] text-white text-xs px-3 py-1.5 hover:brightness-110 transition-all font-medium mt-2"
            >
              <Navigation size={13} />
              Cómo llegar
            </a>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggleFavorite}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isFavorite ? 'text-yellow-400' : 'text-[var(--foreground)]/40 hover:text-[var(--foreground)]/80'}`}
              title="Favorita"
            >
              <Star className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--foreground)]/40 hover:text-[var(--foreground)] transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Price card */}
      <div className="px-4 py-4 border-b border-[var(--panel-border)] shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--foreground)]/50 mb-1">
              {{ g95: 'Gasolina 95 E5', diesel: 'Gasóleo A', g98: 'Gasolina 98 E5', glp: 'GLP', gnc: 'GNC' }[activeFuel]}
            </p>
            <span className="text-3xl font-bold text-[var(--accent)] tabular-nums" style={{ fontFamily: 'var(--font-fira-code)' }}>
              {station.price?.toFixed(3) ?? '—'}
            </span>
            <span className="text-lg text-[var(--accent)]/70 ml-1">€</span>
          </div>
          {station.distanceKm != null && (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-[var(--foreground)]/60">
                <Navigation className="w-3.5 h-3.5" />
                <span className="text-sm tabular-nums" style={{ fontFamily: 'var(--font-fira-code)' }}>
                  {station.distanceKm.toFixed(1)} km
                </span>
              </div>
            </div>
          )}
        </div>
        {station.updatedAt && (
          <p className="text-xs text-[var(--foreground)]/50 mt-2">
            Actualizado: {new Date(station.updatedAt).toLocaleString("es-ES", {
              dateStyle: "short",
              timeStyle: "short",
              timeZone: "Europe/Madrid",
            })}
          </p>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-[var(--foreground)]/60 uppercase tracking-widest">Historial</p>
          <div className="flex gap-1">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all duration-150 cursor-pointer ${
                  days === d ? 'bg-[var(--accent)]/20 text-[var(--accent)] font-medium' : 'text-[var(--foreground)]/50 hover:text-[var(--foreground)]'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="h-24 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
        ) : (
          <PriceChart data={history} fuel={activeFuel} />
        )}
      </div>
    </div>
  );
}
