// components/MapView.tsx
'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { fixLeafletIcons } from '@/lib/leafletIcons';
import type { StationWithPrice } from '@/lib/types';

function priceColor(price: number, min: number, max: number): string {
  if (max === min) return '#f59e0b';
  const ratio = (price - min) / (max - min);
  if (ratio < 0.33) return '#22c55e';
  if (ratio < 0.67) return '#f59e0b';
  return '#ef4444';
}

function MapEventHandler({ onCenterChange }: { onCenterChange: (center: [number, number]) => void }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter();
      onCenterChange([c.lat, c.lng]);
    },
  });
  return null;
}

function FlyTo({ station }: { station: StationWithPrice | null }) {
  const map = useMap();
  useEffect(() => {
    if (station) map.flyTo([station.lat, station.lng], 15, { duration: 0.8 });
  }, [station, map]);
  return null;
}

function FlyToUser({ location }: { location: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (location) map.flyTo(location, 13, { duration: 1 });
  }, [location, map]);
  return null;
}

interface Props {
  stations: StationWithPrice[];
  selectedStation: StationWithPrice | null;
  onSelectStation: (s: StationWithPrice) => void;
  userLocation: [number, number] | null;
  onCenterChange: (center: [number, number]) => void;
}

export default function MapView({ stations, selectedStation, onSelectStation, userLocation, onCenterChange }: Props) {
  useEffect(() => { fixLeafletIcons(); }, []);

  const prices = stations.map(s => s.price).filter((p): p is number => p !== null);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const center: [number, number] = userLocation ?? [40.4168, -3.7038];

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/">OSM</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <FlyTo station={selectedStation} />
      <FlyToUser location={userLocation} />
      <MapEventHandler onCenterChange={onCenterChange} />
      {stations.map(s => (
        <CircleMarker
          key={s.id}
          center={[s.lat, s.lng]}
          radius={selectedStation?.id === s.id ? 12 : 8}
          pathOptions={{
            fillColor: s.price ? priceColor(s.price, minPrice, maxPrice) : '#9ca3af',
            color: selectedStation?.id === s.id ? '#fff' : 'transparent',
            fillOpacity: 0.9,
            weight: 2,
          }}
          eventHandlers={{ click: () => onSelectStation(s) }}
        >
          <Popup>
            <strong>{s.name}</strong><br />
            {s.price?.toFixed(3)}€
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
