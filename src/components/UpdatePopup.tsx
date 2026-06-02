"use client";

import { useServiceWorker } from "@/hooks/useServiceWorker";

export function UpdatePopup() {
  const { updateBeschikbaar, pasUpdateToe } = useServiceWorker();

  if (!updateBeschikbaar) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
            Update beschikbaar
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Er is een nieuwe versie van de app beschikbaar.
          </p>
          <button
            onClick={pasUpdateToe}
            className="mt-2 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Nu bijwerken
          </button>
        </div>
      </div>
    </div>
  );
}
