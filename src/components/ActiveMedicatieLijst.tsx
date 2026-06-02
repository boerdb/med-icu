"use client";

import { useIcuStore } from "@/store/icu-store";
import { getIncompatibeleParenVoor, isAlleenCentraal, isGevaarlijkBijCvdFlush } from "@/lib/compatibility";

export function ActiveMedicatieLijst() {
  const activeMedicijnen = useIcuStore((s) => s.activeMedicijnen);
  const verwijderMedicijn = useIcuStore((s) => s.verwijderMedicijn);

  const incompatibelen = getIncompatibeleParenVoor(activeMedicijnen);

  // Welke medicijnen hebben tenminste één incompatibel partner?
  const metConflict = new Set(incompatibelen.flat());

  if (activeMedicijnen.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center">
        <svg className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-slate-400 dark:text-slate-500 text-sm">
          Geen medicijnen toegevoegd
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Actieve medicijnen ({activeMedicijnen.length})
        </span>
        {incompatibelen.length > 0 && (
          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
            {incompatibelen.length} incompatibiliteit{incompatibelen.length !== 1 ? "en" : ""}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {activeMedicijnen.map((med) => {
          const heeftConflict = metConflict.has(med);
          const centraal = isAlleenCentraal(med);
          const cvdGevaarlijk = isGevaarlijkBijCvdFlush(med);
          return (
            <div
              key={med}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                heeftConflict
                  ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700"
                  : centraal
                    ? "bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 border border-violet-300 dark:border-violet-700"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700"
              }`}
            >
              {heeftConflict && (
                <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <span>{med}</span>
              {centraal && (
                <span className="text-[10px] font-bold uppercase tracking-wide opacity-75">
                  CVC
                </span>
              )}
              {cvdGevaarlijk && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wide opacity-75"
                  title="Niet op CVD-meetlumen — risico bij per ongeluk flushen"
                >
                  CVD✗
                </span>
              )}
              <button
                onClick={() => verwijderMedicijn(med)}
                className="ml-0.5 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                aria-label={`Verwijder ${med}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
      {incompatibelen.length > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">
            Incompatibele combinaties:
          </p>
          <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-0.5">
            {incompatibelen.map(([a, b]) => (
              <li key={`${a}-${b}`}>
                ⚠ {a} + {b}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
