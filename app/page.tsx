'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import TopBar from '@/components/TopBar';
import StationList from '@/components/StationList';
import StationDetail from '@/components/StationDetail';
import { RecenterButton } from '@/components/RecenterButton';
import type { StationWithPrice } from '@/lib/types';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function Home() {
  const [radius, setRadius] = useState(10);
  const [fuel, setFuel] = useState<'g95' | 'diesel'>('g95');
  const [stations, setStations] = useState<StationWithPrice[]>([]);
  const [selected, setSelected] = useState<StationWithPrice | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [flyToCenter, setFlyToCenter] = useState<[number, number] | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => setUserLocation([40.4168, -3.7038])
    );
  }, []);

  useEffect(() => {
    fetch('/api/favorites').then(r => r.json()).then((data: Array<{ stationId: string }>) =>
      setFavorites(data.map(f => f.stationId))
    );
  }, []);

  const fetchStations = useCallback(async () => {
    const loc = mapCenter ?? userLocation;
    if (!loc) return;
    const [lat, lng] = loc;
    const res = await fetch(`/api/stations?lat=${lat}&lng=${lng}&radius=${radius}&fuel=${fuel}`);
    const data = await res.json();
    setStations(data);
  }, [mapCenter, userLocation, radius, fuel]);

  useEffect(() => { fetchStations(); }, [fetchStations]);

  const handleRecenter = () => {
    if (userLocation) setFlyToCenter([...userLocation]);
  };

  const toggleFavorite = async (stationId: string) => {
    if (favorites.includes(stationId)) {
      await fetch('/api/favorites', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stationId }) });
      setFavorites(f => f.filter(id => id !== stationId));
    } else {
      const name = stations.find(s => s.id === stationId)?.name ?? '';
      await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stationId, label: name }) });
      setFavorites(f => [...f, stationId]);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <MapView
          stations={stations}
          selectedStation={selected}
          onSelectStation={s => { setSelected(s); setShowList(false); }}
          userLocation={userLocation}
          onCenterChange={setMapCenter}
          flyToCenter={flyToCenter}
        />
      </div>

      <RecenterButton onClick={handleRecenter} />

      {/* TopBar — centered pill at top */}
      <TopBar radius={radius} onRadiusChange={setRadius} fuel={fuel} onFuelChange={setFuel} />

      {/* StationList — floating card bottom-left (desktop only) */}
      {stations.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[1000] hidden md:block">
          <StationList stations={stations} selectedId={selected?.id ?? null} onSelect={s => setSelected(s)} fuel={fuel} />
        </div>
      )}

      {/* StationDetail — floating card bottom-right (desktop only) */}
      {selected && (
        <div className="absolute bottom-4 right-16 z-[1000] w-80 max-h-[65vh] hidden md:flex flex-col rounded-2xl bg-[var(--panel)] border border-[var(--panel-border)] shadow-xl backdrop-blur-md overflow-y-auto">
          <StationDetail
            station={selected}
            activeFuel={fuel}
            onClose={() => setSelected(null)}
            isFavorite={favorites.includes(selected.id)}
            onToggleFavorite={() => toggleFavorite(selected.id)}
          />
        </div>
      )}

      {/* Mobile bottom sheet */}
      {showList && (
        <div className="md:hidden absolute bottom-0 left-0 right-0 z-[900] bg-slate-950/98 backdrop-blur-lg rounded-t-2xl border-t border-slate-800/60 shadow-2xl"
          style={{ height: selected ? '100%' : '65%' }}>
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-8 h-1 bg-slate-700 rounded-full" />
          </div>
          {selected ? (
            <StationDetail
              station={selected}
              activeFuel={fuel}
              onClose={() => { setSelected(null); }}
              isFavorite={favorites.includes(selected.id)}
              onToggleFavorite={() => toggleFavorite(selected.id)}
            />
          ) : (
            <div className="flex flex-col h-full pb-20">
              <StationList stations={stations} selectedId={null} onSelect={s => { setSelected(s); }} fuel={fuel} />
            </div>
          )}
        </div>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => setShowList(v => !v)}
        className="md:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/60 text-slate-100 text-sm font-medium px-5 py-2.5 rounded-full shadow-2xl cursor-pointer hover:bg-slate-800 transition-colors"
      >
        {showList
          ? <><ChevronDown className="w-4 h-4 text-slate-400" /> Cerrar</>
          : <><ChevronUp className="w-4 h-4 text-green-400" /> {stations.length} gasolineras</>
        }
      </button>
    </div>
  );
}
