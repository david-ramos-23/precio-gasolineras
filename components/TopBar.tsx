'use client';

interface Props {
  radius: number;
  onRadiusChange: (r: number) => void;
  fuel: 'g95' | 'diesel';
  onFuelChange: (f: 'g95' | 'diesel') => void;
  view: 'map' | 'split';
  onViewChange: (v: 'map' | 'split') => void;
}

export default function TopBar({ radius, onRadiusChange, fuel, onFuelChange, view, onViewChange }: Props) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-900 border-b border-gray-800 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Radio</span>
        <input
          type="range" min={1} max={50} value={radius}
          onChange={e => onRadiusChange(Number(e.target.value))}
          className="w-24 accent-blue-500"
        />
        <span className="text-xs text-white w-8">{radius} km</span>
      </div>

      <div className="flex rounded-lg overflow-hidden border border-gray-700">
        {(['g95', 'diesel'] as const).map(f => (
          <button
            key={f}
            onClick={() => onFuelChange(f)}
            className={`px-3 py-1 text-xs font-medium transition-colors
              ${fuel === f ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {f === 'g95' ? 'G95' : 'Diésel'}
          </button>
        ))}
      </div>

      <div className="flex rounded-lg overflow-hidden border border-gray-700 ml-auto">
        {(['map', 'split'] as const).map(v => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={`px-3 py-1 text-xs font-medium transition-colors
              ${view === v ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {v === 'map' ? '🗺 Mapa' : '⚡ Split'}
          </button>
        ))}
      </div>
    </div>
  );
}
