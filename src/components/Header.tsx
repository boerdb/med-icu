"use client";

import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="bg-blue-900 dark:bg-slate-900 shadow-lg sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 text-blue-900" fill="currentColor">
              <rect x="9" y="2" width="6" height="20" rx="1.5" />
              <rect x="2" y="9" width="20" height="6" rx="1.5" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-base sm:text-lg leading-tight truncate">
              IC Medicatie Verdeler
            </h1>
            <p className="text-blue-200 dark:text-slate-400 text-[11px] sm:text-xs truncate">
              Y-site compatibiliteit • DSATUR
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
