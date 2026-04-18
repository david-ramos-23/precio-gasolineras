'use client';
import { useMap } from 'react-leaflet';

export function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute bottom-40 right-3 z-[1000] flex flex-col gap-1 pointer-events-auto">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        aria-label="Acercar"
        className="size-11 grid place-items-center rounded-full bg-[var(--panel)] border border-[var(--panel-border)] shadow-lg hover:brightness-110 backdrop-blur text-lg font-light text-[var(--foreground)] cursor-pointer"
      >+</button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        aria-label="Alejar"
        className="size-11 grid place-items-center rounded-full bg-[var(--panel)] border border-[var(--panel-border)] shadow-lg hover:brightness-110 backdrop-blur text-lg font-light text-[var(--foreground)] cursor-pointer"
      >−</button>
    </div>
  );
}
