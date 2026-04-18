// components/MapView.tsx
'use client';
import { useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import type { LatLngBounds } from 'leaflet';
import { useTheme } from 'next-themes';
import { fixLeafletIcons } from '@/lib/leafletIcons';
import { priceColor } from '@/lib/priceColor';
import type { StationWithPrice } from '@/lib/types';
import { UserLocationMarker } from '@/components/UserLocationMarker';

function MapEventHandler({
  onCenterChange,
  onBoundsChange,
}: {
  onCenterChange: (center: [number, number]) => void;
  onBoundsChange: (bounds: LatLngBounds) => void;
}) {
  const map = useMap();

  const emit = useCallback(() => {
    const c = map.getCenter();
    onCenterChange([c.lat, c.lng]);
    onBoundsChange(map.getBounds());
  }, [map, onCenterChange, onBoundsChange]);

  useMapEvents({
    moveend: emit,
    zoomend: emit,
  });

  // Emit once on mount so page.tsx has bounds before the first pan
  useEffect(() => { emit(); }, [emit]);

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

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface Props {
  stations: StationWithPrice[];
  selectedStation: StationWithPrice | null;
  onSelectStation: (s: StationWithPrice) => void;
  userLocation: [number, number] | null;
  onCenterChange: (center: [number, number]) => void;
  onBoundsChange: (bounds: LatLngBounds) => void;
  priceRange: { min: number; max: number };
  flyToCenter?: [number, number] | null;
  favorites?: string[];
}

export default function MapView({ stations, selectedStation, onSelectStation, userLocation, onCenterChange, onBoundsChange, priceRange, flyToCenter = null, favorites = [] }: Props) {
  useEffect(() => { fixLeafletIcons(); }, []);

  const { resolvedTheme } = useTheme();
  const tileUrl = resolvedTheme === 'light'
    ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  const { min: minPrice, max: maxPrice } = priceRange;

  const center: [number, number] = userLocation ?? [40.4168, -3.7038];

  return (
    <MapContainer center={center} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }}>
      <ZoomControl position="topright" />
      <TileLayer
        key={tileUrl}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CartoDB</a>'
        url={tileUrl}
      />
      <FlyTo station={selectedStation} />
      <FlyToUser location={userLocation} />
      <MapController center={flyToCenter} />
      <MapEventHandler onCenterChange={onCenterChange} onBoundsChange={onBoundsChange} />
      <UserLocationMarker position={userLocation} />
      {stations.map(s => (
        <CircleMarker
          key={s.id}
          center={[s.lat, s.lng]}
          radius={selectedStation?.id === s.id ? 12 : 8}
          pathOptions={{
            fillColor: s.price ? priceColor(s.price, minPrice, maxPrice) : '#9ca3af',
            color: selectedStation?.id === s.id ? '#fff' : favorites.includes(s.id) ? '#f59e0b' : 'transparent',
            fillOpacity: 0.9,
            weight: selectedStation?.id === s.id || favorites.includes(s.id) ? 3 : 2,
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
