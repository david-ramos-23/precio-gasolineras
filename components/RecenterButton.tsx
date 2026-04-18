"use client";
import { LocateFixed } from "lucide-react";

export function RecenterButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Centrar en mi ubicación"
      className="absolute bottom-24 right-3 z-[1000] size-11 grid place-items-center rounded-full bg-[var(--panel)] border border-[var(--panel-border)] shadow-lg hover:brightness-110 pointer-events-auto backdrop-blur"
    >
      <LocateFixed size={18} />
    </button>
  );
}
