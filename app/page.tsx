'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ChevronUp } from 'lucide-react';
import TopBar from '@/components/TopBar';
import StationList from '@/components/StationList';
import StationDetail from '@/components/StationDetail';
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
  const [openedFromList, setOpenedFromList] = useState(false);
  const [stations, setStations] = useState<StationWithPrice[]>([]);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragZoneRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => { setDetailExpanded(false); }, [selected?.id]);

  // Set initial height synchronously before browser paint (prevents flash)
  useLayoutEffect(() => {
    if (showList && sheetRef.current) {
      const initPct = selected ? 58 : 65; // eslint-disable-line react-hooks/exhaustive-deps
      sheetRef.current.style.height = `${initPct}%`;
      sheetRef.current.style.transition = 'none';
      setPanelBottom(initPct);
    }
  }, [showList]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showList && sheetRef.current) {
      gsap.from(sheetRef.current, { y: '100%', duration: 0.35, ease: 'power3.out' });
    }
  }, [showList]);

  // Drive height via DOM when selected/detailExpanded changes (avoids React re-render conflicts)
  useLayoutEffect(() => {
    if (!showList || !sheetRef.current || dragging.current) return;
    const pct = selected ? (detailExpanded ? getMaxPct() : 58) : 65;
    sheetRef.current.style.transition = 'height 0.3s cubic-bezier(0.4,0,0.2,1)';
    sheetRef.current.style.height = `${pct}%`;
    setPanelBottom(pct);
    if (detailExpanded) rootRef.current?.classList.add('panel-expanded');
    else rootRef.current?.classList.remove('panel-expanded');
  }, [selected?.id, detailExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Touch drag state (refs = no re-renders during drag)
  const dragStartY = useRef(0);
  const dragBaseH = useRef(0);
  const dragging = useRef(false);
  const dragMoved = useRef(false);

  // Attach passive touchmove on drag zone only
  useEffect(() => {
    if (!showList) return;
    const el = dragZoneRef.current;
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
      const pct = Math.max(15, Math.min(100, dragBaseH.current + (delta / window.innerHeight) * 100));
      sheetRef.current.style.height = `${pct}%`;
      setPanelBottom(pct);
    };
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, [showList]);

  function onDragStart(e: React.TouchEvent) {
    dragging.current = true;
    dragMoved.current = false;
    dragStartY.current = e.touches[0].clientY;
    const h = sheetRef.current ? parseFloat(sheetRef.current.style.height) : NaN;
    dragBaseH.current = isNaN(h) ? (selected ? (detailExpanded ? getMaxPct() : 58) : 65) : h;
    rootRef.current?.style.setProperty('--zoom-td', '0s');
  }

  // Max height: sheet top aligns with TopBar top (top-3 = 12px)
  function getMaxPct() {
    if (typeof window === 'undefined') return 98;
    return ((window.innerHeight - 12) / window.innerHeight) * 100;
  }

  function setPanelBottom(pct: number | null) {
    if (!rootRef.current) return;
    if (pct === null) rootRef.current.style.removeProperty('--panel-bottom');
    else rootRef.current.style.setProperty('--panel-bottom', `calc(${pct}% + 12px)`);
  }

  function closeSheet() {
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
      gsap.to(sheetRef.current, {
        height: '0%', duration: 0.3, ease: 'power3.in',
        onUpdate: () => {
          if (sheetRef.current) setPanelBottom((sheetRef.current.offsetHeight / window.innerHeight) * 100);
        },
        onComplete: () => {
          if (sheetRef.current) sheetRef.current.style.height = '';
          setPanelBottom(null);
          rootRef.current?.classList.remove('panel-expanded');
          setShowList(false); setSelected(null); setOpenedFromList(false);
        }
      });
    } else { setShowList(false); setSelected(null); setOpenedFromList(false); }
  }

  function goBackToList() {
    if (sheetRef.current) {
      gsap.to(sheetRef.current, { opacity: 0, duration: 0.1, ease: 'power2.in', onComplete: () => {
        setSelected(null);
        gsap.to(sheetRef.current, { opacity: 1, duration: 0.15, ease: 'power2.out' });
      }});
    } else { setSelected(null); }
  }

  function onDragEnd() {
    if (!dragging.current) return;
    dragging.current = false;
    rootRef.current?.style.removeProperty('--zoom-td');
    if (!dragMoved.current || !sheetRef.current) return;
    // Check h BEFORE setting transition — prevents CSS transition race with closeSheet GSAP
    const h = parseFloat(sheetRef.current.style.height);
    if (h < 30) {
      closeSheet();
    } else {
      // Any release above 30% → snap to max (aligned with TopBar top)
      const maxPct = getMaxPct();
      sheetRef.current.style.transition = 'height 0.3s cubic-bezier(0.4,0,0.2,1)';
      setDetailExpanded(true);
      sheetRef.current.style.height = `${maxPct}%`;
      setPanelBottom(maxPct);
      rootRef.current?.classList.add('panel-expanded');
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
    <div ref={rootRef} className="relative h-dvh w-dvw overflow-hidden bg-slate-950">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <MapView
          favorites={favorites}
          stations={stations}
          selectedStation={selected}
          onSelectStation={s => { setSelected(s); setShowList(true); setOpenedFromList(false); }}
          userLocation={userLocation}
          onCenterChange={setMapCenter}
          onBoundsChange={setBounds}
          priceRange={priceRange}
          flyToCenter={flyToCenter}
          sheetFraction={selected ? 0.58 : 0}
          onRecenter={handleRecenter}
        />
      </div>

      {/* TopBar — centered pill at top, legend fused inside */}
      <TopBar
        radius={radius} onRadiusChange={setRadius}
        fuel={fuel} onFuelChange={f => { setFuel(f); localStorage.setItem('fuel', f); }}
        onLocationFound={handleLocationFound}
        legendCount={visibleStations.length}
        legendMin={priceRange.min}
        legendMax={priceRange.max}
      />

      {/* Price legend — hide on mobile when detail is full-screen */}
      {visiblePrices.length > 0 && (
        <div className="hidden md:block">
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
          className="md:hidden absolute bottom-0 left-0 right-0 z-[900] bg-[var(--panel)] backdrop-blur-lg border-t border-[var(--panel-border)] shadow-2xl rounded-t-2xl flex flex-col"
          style={{}}
        >
          {/* Drag zone — header only, touch events here */}
          <div
            ref={dragZoneRef}
            className="flex justify-center py-3 shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
            onTouchStart={onDragStart}
            onTouchEnd={onDragEnd}
          >
            <div className="w-10 h-1 bg-[var(--foreground)]/20 rounded-full" />
          </div>
          {selected ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              <StationDetail
                station={selected}
                activeFuel={fuel}
                onClose={() => openedFromList ? goBackToList() : closeSheet()}
                isFavorite={favorites.includes(selected.id)}
                onToggleFavorite={() => toggleFavorite(selected.id)}
              />
            </div>
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden">
              <StationList
                stations={stations}
                selectedId={null}
                onSelect={s => { setSelected(s); setOpenedFromList(true); }}
                fuel={fuel}
                favorites={favorites}
                mobile={true}
                onClose={closeSheet}
              />
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
