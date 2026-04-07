"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "cosmetic-ai-theme";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDark = mode === "dark" || (mode === "system" && systemDark);
  root.classList.toggle("dark", shouldUseDark);
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const nextMode = saved ?? "system";
    setMode(nextMode);
    applyTheme(nextMode);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const current = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? "system";
      if (current === "system") applyTheme("system");
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function updateMode(next: ThemeMode) {
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  return (
    <div className="inline-flex items-center rounded-lg border border-gray-300 bg-white p-1 text-xs dark:border-gray-700 dark:bg-gray-900">
      {(["light", "dark", "system"] as ThemeMode[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => updateMode(option)}
          className={`rounded-md px-2 py-1 capitalize transition-colors ${
            mode === option
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
