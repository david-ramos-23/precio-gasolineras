'use client';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';

export function AuthButton() {
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    if (showMenu) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [showMenu]);

  if (status === 'loading') return null;

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {/* Desktop: avatar + Salir inline */}
        <div className="hidden sm:flex items-center gap-2">
          {session.user.image && (
            <Image
              src={session.user.image}
              alt={session.user.name ?? 'User'}
              width={24}
              height={24}
              className="rounded-full"
            />
          )}
          <ThemeToggle />
          <button
            onClick={() => signOut()}
            className="text-xs text-[var(--foreground)]/50 hover:text-[var(--foreground)] cursor-pointer transition-colors"
            title="Cerrar sesión"
          >
            Salir
          </button>
        </div>

        {/* Mobile: avatar only, dropdown on click */}
        <div ref={menuRef} className="relative sm:hidden">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="flex items-center cursor-pointer"
            title="Menú de usuario"
          >
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? 'User'}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[var(--foreground)]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            )}
          </button>
          {showMenu && (
            <div className="absolute top-9 right-0 bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl shadow-xl overflow-hidden z-10 min-w-[120px]">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--panel-border)]">
                <span className="text-xs text-[var(--foreground)]/60">Tema</span>
                <ThemeToggle />
              </div>
              <button
                onClick={() => { setShowMenu(false); signOut(); }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-[var(--foreground)]/70 hover:bg-[var(--panel-border)] hover:text-[var(--foreground)] cursor-pointer transition-colors"
              >
                Salir
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent)]/80 cursor-pointer transition-colors"
      title="Iniciar sesión para guardar favoritos"
    >
      Entrar
    </button>
  );
}
