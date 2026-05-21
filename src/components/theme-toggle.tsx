"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("kongsi-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 w-9 h-9 rounded-lg border border-border bg-card hover:bg-muted transition-colors flex items-center justify-center"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
    </button>
  );
}
