"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Évite le mismatch hydration : on attend que le client soit monté
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        aria-label="Changer le thème"
        className="size-9 grid place-items-center rounded-full hover:bg-muted"
      >
        <Sun className="size-4" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      className="size-9 grid place-items-center rounded-full hover:bg-muted transition-colors"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
