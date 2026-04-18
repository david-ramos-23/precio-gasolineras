'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ChevronUp } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { FloatingSearch } from '@/components/FloatingSearch';
import StationList from '@/components/StationList';
import StationDetail from '@/components/StationDetail';
import { RecenterButton } from '@/components/RecenterButton';
import { PriceLegend } from '@/components/PriceLegend';
import type { StationWithPrice, FuelType } from '@/lib/types';
import { useSession, signIn } from 'next-auth/react';

const LOCAL_FAV_KEY = 'gasolineras_favorites';
function loadLocalFavs(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LOCAL_FAV_KEY) ?? '[]'); } catch { return []; }
}
function saveLocalFavs(ids: string[]) {
  localStorage.setItem(LOCAL_FAV_KEY, JSON.stringify(ids));
}
import type { LatLngBounds } from 'leaflet';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function Home() {
  const [radius, setRadius] = useState(10);
  const [fuel, setFuel] = useState<FuelType>(() => {
    if (typeof window === 'undefined') return 'g95';
    return (localStorage.getItem('fuel') as FuelType) ?? 'g95';
  });
  const [detailExpanded, setDetailExpanded] = useState(false);
  const [stations, setStations] = useState<StationWithPrice[]>([]);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<StationWithPrice | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [flyToCenter, setFlyToCenter] = useState<[number, number] | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showList, setShowList] = useState(false);
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const visibleStations = useMemo(
    () => bounds ? stations.filter(s => bounds.contains({ lat: s.lat, lng: s.lng })) : stations,
    [bounds, stations]
  );

  const visiblePrices = useMemo(
    () => visibleStations.map(s => s.price).filter((p): p is number => p !== null),
    [visibleStations]
  );

  const priceRange = useMemo(
    () => visiblePrices.length > 0
      ? { min: Math.min(...visiblePrices), max: Math.max(...visiblePrices) }
      : { min: 0, max: 0 },
    [visiblePrices]
  );

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => setUserLocation([40.4168, -3.7038])
    );
  }, []);

  useEffect(() => {
    if (!userId) {
      setFavorites(loadLocalFavs());
      return;
    }
    fetch('/api/favorites').then(r => r.json()).then((data: Array<{ stationId: string }>) =>
      setFavorites(data.map(f => f.stationId))
    );
  }, [userId]);

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

  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => { setDetailExpanded(false); }, [selected?.id]);

  useEffect(() => {
    if (showList && sheetRef.current) {
      gsap.from(sheetRef.current, { y: '100%', duration: 0.35, ease: 'power3.out' });
    }
  }, [showList]);

  // Touch drag state (refs = no re-renders during drag)
  const dragStartY = useRef(0);
  const dragBaseH = useRef(0);
  const dragging = useRef(false);
  const dragMoved = useRef(false);

  // Re-attach passive touchmove listener whenever sheet mounts (showList=true)
  useEffect(() => {
    if (!showList) return;
    const el = sheetRef.current;
    if (!el) return;
    const onMove = (e: TouchEvent) => {
      if (!dragging.current || !sheetRef.current) return;
      const delta = dragStartY.current - e.touches[0].clientY;
      if (!dragMoved.current && Math.abs(delta) < 8) return;
      if (!dragMoved.current) {
        dragMoved.current = true;
        sheetRef.current.style.transition = 'none';
      }
      e.preventDefault();
      const pct = Math.max(15, Math.min(95, dragBaseH.current + (delta / window.innerHeight) * 100));
      sheetRef.current.style.height = `${pct}%`;
    };
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, [showList]);

  function onDragStart(e: React.TouchEvent) {
    // Skip drag if touching an interactive element
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea')) return;
    dragging.current = true;
    dragMoved.current = false;
    dragStartY.current = e.touches[0].clientY;
    dragBaseH.current = selected ? (detailExpanded ? 92 : 58) : 65;
  }

  function closeSheet() {
    if (sheetRef.current) {
      gsap.to(sheetRef.current, {
        y: '100%', duration: 0.3, ease: 'power3.in',
        onComplete: () => {
          if (sheetRef.current) { sheetRef.current.style.transform = ''; sheetRef.current.style.height = ''; }
          setShowList(false); setSelected(null);
        }
      });
    } else { setShowList(false); setSelected(null); }
  }

  function onDragEnd() {
    if (!dragging.current) return;
    dragging.current = false;
    if (!dragMoved.current || !sheetRef.current) return; // was a tap, not a drag
    sheetRef.current.style.transition = 'height 0.3s cubic-bezier(0.4,0,0.2,1)';
    const h = parseFloat(sheetRef.current.style.height);
    if (h < 30) {
      closeSheet();
    } else if (h > 75) {
      setDetailExpanded(true);
      sheetRef.current.style.height = '92%';
    } else {
      setDetailExpanded(false);
      sheetRef.current.style.height = selected ? '58%' : '65%';
    }
  }

  const handleLocationFound = useCallback((lat: number, lng: number) => {
    setFlyToCenter([lat, lng]);
    setMapCenter([lat, lng]);
  }, []);

  const toggleFavorite = async (stationId: string) => {
    if (!userId) {
      const current = loadLocalFavs();
      const updated = current.includes(stationId)
        ? current.filter(id => id !== stationId)
        : [...current, stationId];
      saveLocalFavs(updated);
      setFavorites(updated);
      return;
    }
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
    <div className="relative h-dvh w-dvw overflow-hidden bg-slate-950">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <MapView
          favorites={favorites}
          stations={stations}
          selectedStation={selected}
          onSelectStation={s => { setSelected(s); setShowList(true); }}
          userLocation={userLocation}
          onCenterChange={setMapCenter}
          onBoundsChange={setBounds}
          priceRange={priceRange}
          flyToCenter={flyToCenter}
          sheetFraction={selected ? 0.58 : 0}
        />
      </div>

      {!showList && <RecenterButton onClick={handleRecenter} />}

      {/* TopBar — centered pill at top */}
      <TopBar radius={radius} onRadiusChange={setRadius} fuel={fuel} onFuelChange={f => { setFuel(f); localStorage.setItem('fuel', f); }} onSearchOpen={() => setSearchOpen(true)} />
      {searchOpen && (
        <FloatingSearch
          onClose={() => setSearchOpen(false)}
          onLocationFound={(lat, lng) => { handleLocationFound(lat, lng); setSearchOpen(false); }}
        />
      )}

      {/* Price legend — hide on mobile when detail is full-screen */}
      {visiblePrices.length > 0 && (
        <div className={selected ? 'hidden md:block' : ''}>
          <PriceLegend
            count={visibleStations.length}
            minPrice={priceRange.min}
            maxPrice={priceRange.max}
          />
        </div>
      )}

      {/* Banner — local favorites warning */}
      {!userId && favorites.length > 0 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1001] bg-amber-500/90 text-slate-950 text-xs font-medium px-4 py-1.5 rounded-full shadow-lg backdrop-blur-sm whitespace-nowrap">
          ★ Favoritos temporales —{' '}
          <button onClick={() => signIn('google')} className="underline cursor-pointer font-bold">inicia sesión</button>
          {' '}para guardarlos
        </div>
      )}

      {/* StationList — floating card bottom-left (desktop only) */}
      {stations.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[1000] hidden md:block">
          <StationList stations={stations} selectedId={selected?.id ?? null} onSelect={s => setSelected(s)} fuel={fuel} favorites={favorites} />
        </div>
      )}

      {/* StationDetail — floating card bottom-right (desktop only) */}
      {selected && (
        <div className="absolute bottom-4 right-16 z-[1000] w-80 max-h-[65vh] hidden md:flex flex-col rounded-2xl bg-[var(--panel)] border border-[var(--panel-border)] shadow-xl backdrop-blur-md overflow-hidden">
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
        <div
          ref={sheetRef}
          className="md:hidden absolute bottom-0 left-0 right-0 z-[900] bg-[var(--panel)] backdrop-blur-lg border-t border-[var(--panel-border)] shadow-2xl rounded-t-2xl"
          style={{ height: selected ? (detailExpanded ? '92%' : '58%') : '65%', transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1)' }}
          onTouchStart={onDragStart}
          onTouchEnd={onDragEnd}
        >
          {/* Visual drag handle */}
          <div className="flex justify-center py-3 shrink-0 pointer-events-none select-none">
            <div className="w-10 h-1 bg-[var(--foreground)]/20 rounded-full" />
          </div>
          {selected ? (
            <div className="flex flex-col h-full overflow-hidden">
              <StationDetail
                station={selected}
                activeFuel={fuel}
                onClose={() => { setSelected(null); }}
                isFavorite={favorites.includes(selected.id)}
                onToggleFavorite={() => toggleFavorite(selected.id)}
              />
            </div>
          ) : (
            <div className="flex flex-col h-full pb-16">
              <StationList stations={stations} selectedId={null} onSelect={s => { setSelected(s); }} fuel={fuel} favorites={favorites} mobile={true} />
            </div>
          )}
        </div>
      )}

      {/* Mobile FAB — only visible when panel is closed */}
      {!showList && (
        <button
          onClick={() => setShowList(true)}
          className="md:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-[var(--panel)] backdrop-blur-md border border-[var(--panel-border)] text-[var(--foreground)] text-sm font-medium px-5 py-2.5 rounded-full shadow-2xl cursor-pointer transition-colors"
        >
          <ChevronUp className="w-4 h-4 text-green-400" />
          {stations.length} gasolineras
        </button>
      )}
    </div>
  );
}
