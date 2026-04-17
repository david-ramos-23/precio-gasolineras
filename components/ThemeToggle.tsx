"use client";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="size-9" />;
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Activar tema claro" : "Activar tema oscuro"}
      className="size-9 grid place-items-center rounded-full bg-[var(--panel)] border border-[var(--panel-border)] pointer-events-auto shadow-md hover:brightness-110"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
