'use client';
import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

interface Props {
  onClose: () => void;
  onLocationFound: (lat: number, lng: number) => void;
}

export function FloatingSearch({ onClose, onLocationFound }: Props) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    gsap.from(backdropRef.current, { opacity: 0, duration: 0.2, ease: 'power2.out' });
    gsap.from(cardRef.current, { y: 24, opacity: 0, duration: 0.25, ease: 'power3.out' });
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=es`,
        { headers: { 'Accept-Language': 'es', 'User-Agent': 'precio-gasolineras/1.0' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        onLocationFound(parseFloat(data[0].lat), parseFloat(data[0].lon));
        onClose();
      }
    } finally {
      setSearching(false);
    }
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[2000] flex items-start justify-center pt-[25vh] bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={cardRef}
        className="w-full max-w-sm mx-4 bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSearch} className="flex items-center gap-3 px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[var(--foreground)]/40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar localidad..."
            className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="text-[var(--foreground)]/40 hover:text-[var(--foreground)] cursor-pointer">✕</button>
          )}
        </form>
        <div className="px-4 pb-3 flex justify-between items-center">
          <span className="text-xs text-[var(--foreground)]/40">Pulsa Enter para buscar · Toca fuera para cerrar</span>
          <button
            type="submit"
            form="search-form"
            onClick={handleSearch as any}
            disabled={searching || !query.trim()}
            className="text-xs font-medium text-[var(--accent)] disabled:opacity-40 cursor-pointer"
          >
            {searching ? '...' : 'Ir'}
          </button>
        </div>
      </div>
    </div>
  );
}
