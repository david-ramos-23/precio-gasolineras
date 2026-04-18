'use client';
import { useMap } from 'react-leaflet';

export function ZoomControls({ panelFraction = 0 }: { panelFraction?: number }) {
  const map = useMap();
  const bottom = panelFraction > 0
    ? `calc(${panelFraction * 100}% + 12px)`
    : '5.5rem';

  return (
    <div
      className="absolute right-3 z-[1000] flex flex-col gap-1 pointer-events-auto"
      style={{ bottom, transition: 'bottom 0.3s cubic-bezier(0.4,0,0.2,1)' }}
    >
      <button type="button" onClick={() => map.zoomIn()} aria-label="Acercar"
        className="size-11 grid place-items-center rounded-full bg-[var(--panel)] border border-[var(--panel-border)] shadow-lg hover:brightness-110 backdrop-blur text-lg font-light text-[var(--foreground)] cursor-pointer">
        +
      </button>
      <button type="button" onClick={() => map.zoomOut()} aria-label="Alejar"
        className="size-11 grid place-items-center rounded-full bg-[var(--panel)] border border-[var(--panel-border)] shadow-lg hover:brightness-110 backdrop-blur text-lg font-light text-[var(--foreground)] cursor-pointer">
        −
      </button>
    </div>
  );
}
