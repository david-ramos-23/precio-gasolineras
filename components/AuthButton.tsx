'use client';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') return null;

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image && (
          <Image
            src={session.user.image}
            alt={session.user.name ?? 'User'}
            width={24}
            height={24}
            className="rounded-full"
          />
        )}
        <button
          onClick={() => signOut()}
          className="text-xs text-[var(--foreground)]/50 hover:text-[var(--foreground)] cursor-pointer transition-colors"
          title="Cerrar sesión"
        >
          Salir
        </button>
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
