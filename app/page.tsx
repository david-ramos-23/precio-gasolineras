'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/TopBar';
import StationList from '@/components/StationList';
import StationDetail from '@/components/StationDetail';
import type { StationWithPrice } from '@/lib/types';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function Home() {
  const [radius, setRadius] = useState(10);
  const [fuel, setFuel] = useState<'g95' | 'diesel'>('g95');
  const [view, setView] = useState<'map' | 'split'>('map');
  const [stations, setStations] = useState<StationWithPrice[]>([]);
  const [selected, setSelected] = useState<StationWithPrice | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
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
    if (!userLocation) return;
    const [lat, lng] = userLocation;
    const res = await fetch(`/api/stations?lat=${lat}&lng=${lng}&radius=${radius}&fuel=${fuel}`);
    const data = await res.json();
    setStations(data);
  }, [userLocation, radius, fuel]);

  useEffect(() => { fetchStations(); }, [fetchStations]);

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
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      <TopBar radius={radius} onRadiusChange={setRadius} fuel={fuel} onFuelChange={setFuel} view={view} onViewChange={setView} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Map */}
        <div className={`${view === 'split' ? 'w-1/2' : 'flex-1'} relative`}>
          <MapView
            stations={stations}
            selectedStation={selected}
            onSelectStation={s => { setSelected(s); setShowList(false); }}
            userLocation={userLocation}
          />
          <button
            onClick={() => setShowList(v => !v)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-full shadow-lg z-[1000] md:hidden"
          >
            {showList ? 'Ver mapa' : `Ver lista (${stations.length})`}
          </button>
        </div>

        {/* List panel */}
        {(view === 'split' || showList) && (
          <div className={`${view === 'split' ? 'w-1/2' : 'absolute inset-x-0 bottom-0 top-16 z-[999]'} bg-gray-950 p-3 overflow-y-auto`}>
            <StationList stations={stations} selectedId={selected?.id ?? null} onSelect={s => { setSelected(s); setShowList(false); }} fuel={fuel} />
          </div>
        )}

        {/* Detail panel */}
        {selected && (
          <div className={`${view === 'split' ? 'hidden' : 'absolute right-0 top-0 bottom-0 w-80 z-[1000]'} bg-gray-900 shadow-2xl`}>
            <StationDetail
              station={selected}
              activeFuel={fuel}
              onClose={() => setSelected(null)}
              isFavorite={favorites.includes(selected.id)}
              onToggleFavorite={() => toggleFavorite(selected.id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
