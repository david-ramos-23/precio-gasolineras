'use client';
import { useMap } from 'react-leaflet';
import { LocateFixed, BellRing } from 'lucide-react';

const BTN = "size-11 grid place-items-center rounded-full bg-[var(--panel)] border border-[var(--panel-border)] shadow-lg hover:brightness-110 backdrop-blur text-[var(--foreground)] cursor-pointer";

export function ZoomControls({ onRecenter, onSaveLocation }: { onRecenter?: () => void; onSaveLocation?: () => void }) {
  const map = useMap();

  return (
    <div className="absolute right-3 z-[1000] flex flex-col gap-1 pointer-events-auto"
      style={{ bottom: 'min(var(--panel-bottom, 1.5rem), calc(100% - 80px))', transition: `bottom var(--zoom-td, 0.3s) cubic-bezier(0.4,0,0.2,1)` }}>
      {onSaveLocation && (
        <button type="button" onClick={onSaveLocation} aria-label="Guardar ubicación para alertas" className={`${BTN} text-orange-400`} title="Guardar mi ubicación para alertas">
          <BellRing size={16} />
        </button>
      )}
      {onRecenter && (
        <button type="button" onClick={onRecenter} aria-label="Mi ubicación" className={BTN}>
          <LocateFixed size={16} />
        </button>
      )}
      <button type="button" onClick={() => map.zoomIn()} aria-label="Acercar" className={`${BTN} text-lg font-light`}>+</button>
      <button type="button" onClick={() => map.zoomOut()} aria-label="Alejar" className={`${BTN} text-lg font-light`}>−</button>
    </div>
  );
}
