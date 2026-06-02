"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDonker, setIsDonker] = useState(false);

  useEffect(() => {
    setIsDonker(document.documentElement.classList.contains("dark"));
  }, []);

  const wissel = () => {
    const nieuwDonker = !isDonker;
    setIsDonker(nieuwDonker);
    if (nieuwDonker) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("thema", "donker");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("thema", "licht");
    }
  };

  return (
    <button
      onClick={wissel}
      aria-label={isDonker ? "Schakel naar licht thema" : "Schakel naar donker thema"}
      className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-blue-700 transition-colors"
      title={isDonker ? "Licht thema" : "Donker thema"}
    >
      {isDonker ? (
        // Zon
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
          />
        </svg>
      ) : (
        // Maan
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
          />
        </svg>
      )}
    </button>
  );
}
