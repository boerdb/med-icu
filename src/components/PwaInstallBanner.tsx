"use client";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export function PwaInstallBanner() {
  const { toonAndroidBanner, toonIosBanner, installeerApp, sluitBanner } =
    useInstallPrompt();

  if (!toonAndroidBanner && !toonIosBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="bg-blue-900 dark:bg-slate-900 border-t border-blue-700 dark:border-slate-700 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-900" fill="currentColor">
                <rect x="9" y="2" width="6" height="20" rx="1.5" />
                <rect x="2" y="9" width="20" height="6" rx="1.5" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold leading-tight">
                Installeer IC Medicatie
              </p>
              {toonIosBanner ? (
                <p className="text-blue-200 dark:text-slate-400 text-xs truncate">
                  Tik op <strong>Deel ↑</strong> → <strong>Zet op beginscherm</strong>
                </p>
              ) : (
                <p className="text-blue-200 dark:text-slate-400 text-xs">
                  Werkt offline • Direct toegankelijk
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {toonAndroidBanner && (
              <button
                onClick={installeerApp}
                className="px-4 py-2 bg-white text-blue-900 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors"
              >
                Installeren
              </button>
            )}
            <button
              onClick={sluitBanner}
              className="p-1.5 text-blue-300 hover:text-white transition-colors"
              aria-label="Sluit installatiebanner"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
