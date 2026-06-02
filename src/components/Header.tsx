"use client";

import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="bg-blue-900 dark:bg-slate-900 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Kruis-icoon */}
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-900" fill="currentColor">
              <rect x="9" y="2" width="6" height="20" rx="1.5" />
              <rect x="2" y="9" width="20" height="6" rx="1.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">
              IC Medicatie Verdeler
            </h1>
            <p className="text-blue-200 dark:text-slate-400 text-xs">
              Y-site compatibiliteit • DSATUR
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
