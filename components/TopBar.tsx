'use client';
import { useState } from 'react';
import { Fuel, ChevronDown, List, Map } from 'lucide-react';

interface Props {
  radius: number;
  onRadiusChange: (r: number) => void;
  fuel: 'g95' | 'diesel';
  onFuelChange: (f: 'g95' | 'diesel') => void;
  view: 'map' | 'split';
  onViewChange: (v: 'map' | 'split') => void;
}

export default function TopBar({ radius, onRadiusChange, fuel, onFuelChange, view, onViewChange }: Props) {
  const [showRadius, setShowRadius] = useState(false);

  return (
    <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center gap-2 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl px-3 py-2 shadow-2xl">
        <Fuel className="w-4 h-4 text-green-400 shrink-0" />
        <span className="text-sm font-semibold text-slate-100" style={{ fontFamily: 'var(--font-fira-code)' }}>
          Gasolineras
        </span>
      </div>

      <div className="pointer-events-auto flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl p-1 shadow-2xl">
        {(['g95', 'diesel'] as const).map(f => (
          <button
            key={f}
            onClick={() => onFuelChange(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
              fuel === f ? 'bg-green-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {f === 'g95' ? 'G95' : 'Gasoil'}
          </button>
        ))}
      </div>

      <div className="pointer-events-auto relative">
        <button
          onClick={() => setShowRadius(v => !v)}
          className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl px-3 py-2 shadow-2xl cursor-pointer hover:bg-slate-800/90 transition-colors"
        >
          <span className="text-xs font-semibold text-green-400" style={{ fontFamily: 'var(--font-fira-code)' }}>
            {radius}km
          </span>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </button>
        {showRadius && (
          <div className="absolute top-full mt-2 left-0 bg-slate-900/98 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-2xl w-52">
            <div className="flex justify-between items-center text-xs mb-3">
              <span className="text-slate-400">Radio de búsqueda</span>
              <span className="text-green-400 font-semibold" style={{ fontFamily: 'var(--font-fira-code)' }}>{radius} km</span>
            </div>
            <input type="range" min={1} max={50} value={radius}
              onChange={e => onRadiusChange(Number(e.target.value))}
              className="w-full cursor-pointer" />
            <div className="flex justify-between text-xs text-slate-600 mt-1"><span>1</span><span>50 km</span></div>
          </div>
        )}
      </div>

      <button
        onClick={() => onViewChange(view === 'map' ? 'split' : 'map')}
        className="pointer-events-auto hidden md:flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl px-3 py-2 shadow-2xl text-xs text-slate-400 hover:text-slate-100 transition-colors cursor-pointer ml-auto"
      >
        {view === 'map' ? <List className="w-4 h-4" /> : <Map className="w-4 h-4" />}
        <span>{view === 'map' ? 'Lista' : 'Mapa'}</span>
      </button>
    </div>
  );
}
