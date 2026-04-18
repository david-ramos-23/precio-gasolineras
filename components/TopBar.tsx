'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { AuthButton } from './AuthButton';
import { STOPS } from '@/lib/priceColor';
import type { FuelType } from '@/lib/types';

interface Props {
  radius: number;
  onRadiusChange: (r: number) => void;
  fuel: FuelType;
  onFuelChange: (f: FuelType) => void;
  onLocationFound: (lat: number, lng: number) => void;
  legendCount?: number;
  legendMin?: number;
  legendMax?: number;
}

const FUEL_LABELS: Record<FuelType, string> = {
  g95: 'G95', diesel: 'Gasoil', g98: 'G98', glp: 'GLP', gnc: 'GNC',
};
const FUELS: FuelType[] = ['g95', 'diesel', 'g98', 'glp', 'gnc'];

export default function TopBar({ radius, onRadiusChange, fuel, onFuelChange, onLocationFound, legendCount = 0, legendMin = 0, legendMax = 0 }: Props) {
  const [showFuel, setShowFuel] = useState(false);
  const [showRadius, setShowRadius] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const fuelRef = useRef<HTMLDivElement>(null);
  const radiusRef = useRef<HTMLDivElement>(null);
  const showLegend = legendCount > 0;

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (fuelRef.current && !fuelRef.current.contains(e.target as Node)) setShowFuel(false);
    }
    if (showFuel) document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, [showFuel]);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (radiusRef.current && !radiusRef.current.contains(e.target as Node)) setShowRadius(false);
    }
    if (showRadius) document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, [showRadius]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=es`,
        { headers: { 'Accept-Language': 'es', 'User-Agent': 'precio-gasolineras/1.0' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        onLocationFound(parseFloat(data[0].lat), parseFloat(data[0].lon));
        setQuery('');
      }
    } finally {
      setSearching(false);
    }
  }

  return (
    <div data-topbar="" className="absolute top-3 left-0 right-0 flex justify-center z-[1000] pointer-events-none px-4">
      <div className={`flex flex-col bg-[var(--panel)] border border-[var(--panel-border)] shadow-lg pointer-events-auto backdrop-blur-md w-full max-w-[360px] overflow-visible ${showLegend ? 'rounded-2xl' : 'rounded-full'}`}>

        {/* Row 1: controls */}
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Fuel dropdown */}
          <div ref={fuelRef} className="relative shrink-0">
            <button onClick={() => setShowFuel(v => !v)}
              className="flex items-center gap-1 bg-[var(--accent)] text-white text-xs font-semibold px-3 py-1 rounded-full cursor-pointer">
              {FUEL_LABELS[fuel]}
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showFuel ? 'rotate-180' : ''}`} />
            </button>
            {showFuel && (
              <div className="absolute top-9 left-0 bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl shadow-xl overflow-hidden min-w-[96px] z-10">
                {FUELS.map(f => (
                  <button key={f} onClick={() => { onFuelChange(f); setShowFuel(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium cursor-pointer transition-colors ${fuel === f ? 'bg-[var(--accent)] text-white' : 'text-[var(--foreground)]/70 hover:bg-[var(--panel-border)]'}`}>
                    {FUEL_LABELS[f]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Inline search */}
          <form onSubmit={handleSearch} className="flex-1 min-w-0 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0 text-[var(--foreground)]/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Buscar localidad..."
              className="w-full bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 outline-none" />
            {searching && <span className="text-[10px] text-[var(--foreground)]/40 shrink-0">…</span>}
          </form>

          <div className="w-px h-4 bg-[var(--panel-border)] shrink-0" />

          {/* Radius */}
          <div ref={radiusRef} className="relative shrink-0">
            <button onClick={() => setShowRadius(v => !v)}
              className="flex items-center gap-1 text-xs font-medium text-[var(--foreground)]/70 hover:text-[var(--foreground)] cursor-pointer">
              <span style={{ fontFamily: 'var(--font-fira-code)' }}>{radius}km</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showRadius && (
              <div className="absolute top-8 right-0 bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-3 shadow-xl w-48 z-10">
                <input type="range" min={1} max={50} value={radius}
                  onChange={e => onRadiusChange(Number(e.target.value))}
                  className="w-full accent-[var(--accent)]" />
                <p className="text-center text-xs mt-1" style={{ fontFamily: 'var(--font-fira-code)' }}>{radius} km</p>
              </div>
            )}
          </div>

          <AuthButton />
        </div>

        {/* Row 2: price legend — fused inside same container */}
        {showLegend && (
          <div className="flex items-center justify-between gap-2 px-3 pb-2 border-t border-[var(--panel-border)]/40">
            <span className="text-[10px] tabular-nums text-[var(--foreground)]/50">
              <span style={{ fontFamily: 'var(--font-fira-code)' }}>{legendMin.toFixed(3)}</span>
              <span className="ml-0.5">€</span>
            </span>
            <div className="flex-1 h-1.5 rounded-full"
              style={{ background: `linear-gradient(to right, ${STOPS.join(', ')})` }} />
            <span className="text-[10px] tabular-nums text-[var(--foreground)]/50">
              <span style={{ fontFamily: 'var(--font-fira-code)' }}>{legendMax.toFixed(3)}</span>
              <span className="ml-0.5">€</span>
            </span>
            <span className="text-[10px] text-[var(--foreground)]/30 tabular-nums">{legendCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}
