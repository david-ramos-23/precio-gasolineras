'use client';
import { useState } from 'react';
import { Fuel, ChevronDown } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  radius: number;
  onRadiusChange: (r: number) => void;
  fuel: 'g95' | 'diesel';
  onFuelChange: (f: 'g95' | 'diesel') => void;
}

export default function TopBar({ radius, onRadiusChange, fuel, onFuelChange }: Props) {
  const [showRadius, setShowRadius] = useState(false);

  return (
    <div className="absolute top-3 left-0 right-0 flex justify-center z-[1000] pointer-events-none px-4">
      <div className="flex items-center gap-2 rounded-full bg-[var(--panel)] border border-[var(--panel-border)] px-3 py-2 shadow-lg pointer-events-auto backdrop-blur-md">
        {/* Brand icon */}
        <Fuel className="w-4 h-4 text-green-400 shrink-0" />

        {/* Fuel toggle */}
        <div className="flex items-center bg-black/10 rounded-full p-0.5">
          {(['g95', 'diesel'] as const).map(f => (
            <button
              key={f}
              onClick={() => onFuelChange(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                fuel === f
                  ? 'bg-green-500 text-slate-950'
                  : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)]'
              }`}
            >
              {f === 'g95' ? 'G95' : 'Gasoil'}
            </button>
          ))}
        </div>

        {/* Radius dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRadius(v => !v)}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-green-400 hover:bg-black/10 transition-colors cursor-pointer"
            style={{ fontFamily: 'var(--font-fira-code)' }}
          >
            {radius}km
            <ChevronDown className="w-3 h-3 text-[var(--foreground)]/40" />
          </button>
          {showRadius && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[var(--panel)] backdrop-blur-md border border-[var(--panel-border)] rounded-2xl p-4 shadow-2xl w-52 z-10">
              <div className="flex justify-between items-center text-xs mb-3">
                <span className="text-[var(--foreground)]/50">Radio de búsqueda</span>
                <span className="text-green-400 font-semibold" style={{ fontFamily: 'var(--font-fira-code)' }}>{radius} km</span>
              </div>
              <input
                type="range" min={1} max={50} value={radius}
                onChange={e => onRadiusChange(Number(e.target.value))}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-xs text-[var(--foreground)]/30 mt-1">
                <span>1</span><span>50 km</span>
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <ThemeToggle />
      </div>
    </div>
  );
}
