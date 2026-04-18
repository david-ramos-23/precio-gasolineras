'use client';
import { useState, useRef, useEffect } from 'react';
import { Fuel, ChevronDown } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { AuthButton } from './AuthButton';
import type { FuelType } from '@/lib/types';

interface Props {
  radius: number;
  onRadiusChange: (r: number) => void;
  fuel: FuelType;
  onFuelChange: (f: FuelType) => void;
  onLocationFound: (lat: number, lng: number) => void;
}

const FUEL_LABELS: Record<FuelType, string> = {
  g95: 'G95',
  diesel: 'Gasoil',
  g98: 'G98',
  glp: 'GLP',
  gnc: 'GNC',
};

const FUELS: FuelType[] = ['g95', 'diesel', 'g98', 'glp', 'gnc'];

export default function TopBar({ radius, onRadiusChange, fuel, onFuelChange, onLocationFound }: Props) {
  const [showFuel, setShowFuel] = useState(false);
  const [showRadius, setShowRadius] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const fuelRef = useRef<HTMLDivElement>(null);
  const radiusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (fuelRef.current && !fuelRef.current.contains(e.target as Node)) setShowFuel(false);
    }
    if (showFuel) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [showFuel]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (radiusRef.current && !radiusRef.current.contains(e.target as Node)) setShowRadius(false);
    }
    if (showRadius) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [showRadius]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=es`,
        { headers: { 'Accept-Language': 'es', 'User-Agent': 'precio-gasolineras/1.0' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        onLocationFound(parseFloat(data[0].lat), parseFloat(data[0].lon));
        setSearchOpen(false);
        setSearchQuery('');
      }
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="absolute top-3 left-0 right-0 flex justify-center z-[1000] pointer-events-none px-4">
      <div className="flex items-center gap-2 rounded-full bg-[var(--panel)] border border-[var(--panel-border)] px-3 py-2 shadow-lg pointer-events-auto backdrop-blur-md">
        {/* Brand icon */}
        <Fuel className="w-4 h-4 text-green-400 shrink-0" />

        {/* Fuel dropdown */}
        <div ref={fuelRef} className="relative shrink-0">
          <button
            onClick={() => setShowFuel(v => !v)}
            className="flex items-center gap-1 bg-[var(--accent)] text-white text-xs font-semibold px-3 py-1 rounded-full cursor-pointer"
          >
            {FUEL_LABELS[fuel]}
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showFuel ? 'rotate-180' : ''}`} />
          </button>
          {showFuel && (
            <div className="absolute top-9 left-0 bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl shadow-xl overflow-hidden min-w-[96px] z-10">
              {FUELS.map(f => (
                <button
                  key={f}
                  onClick={() => { onFuelChange(f); setShowFuel(false); }}
                  className={`w-full text-left px-4 py-2 text-xs font-medium cursor-pointer transition-colors ${
                    fuel === f
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--foreground)]/70 hover:bg-[var(--panel-border)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {FUEL_LABELS[f]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Radius selector */}
        <div ref={radiusRef} className="relative">
          <button
            onClick={() => setShowRadius(v => !v)}
            className="flex items-center gap-1 text-xs font-medium text-[var(--foreground)]/70 hover:text-[var(--foreground)] cursor-pointer"
          >
            <span style={{ fontFamily: 'var(--font-fira-code)' }}>{radius}km</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showRadius && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-3 shadow-xl w-48">
              <input
                type="range" min={1} max={50} value={radius}
                onChange={e => onRadiusChange(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
              <p className="text-center text-xs mt-1" style={{ fontFamily: 'var(--font-fira-code)' }}>
                {radius} km
              </p>
            </div>
          )}
        </div>

        {/* Search button + inline input */}
        {searchOpen ? (
          <form onSubmit={handleSearch} className="flex items-center gap-1">
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar localidad..."
              className="text-xs bg-transparent border-b border-[var(--panel-border)] outline-none w-20 text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 pb-0.5"
            />
            <button
              type="submit"
              disabled={searching}
              className="text-xs text-[var(--accent)] font-medium cursor-pointer disabled:opacity-50"
            >
              {searching ? '…' : 'Ir'}
            </button>
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
              className="text-xs text-[var(--foreground)]/40 hover:text-[var(--foreground)] cursor-pointer"
            >
              ✕
            </button>
          </form>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="text-[var(--foreground)]/50 hover:text-[var(--foreground)] cursor-pointer"
            title="Buscar localidad"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        )}

        <ThemeToggle />
        <AuthButton />
      </div>
    </div>
  );
}
