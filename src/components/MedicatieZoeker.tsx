"use client";

import { useState, useRef, useEffect } from "react";
import { getAlleMedicijnen, isAlleenCentraal, isGevaarlijkBijCvdFlush } from "@/lib/compatibility";
import { useIcuStore } from "@/store/icu-store";

export function MedicatieZoeker() {
  const [zoekterm, setZoekterm] = useState("");
  const [open, setOpen] = useState(false);
  const [geselecteerd, setGeselecteerd] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const lijstRef = useRef<HTMLUListElement>(null);

  const voegMedicijnToe = useIcuStore((s) => s.voegMedicijnToe);
  const activeMedicijnen = useIcuStore((s) => s.activeMedicijnen);

  const alleMedicijnen = getAlleMedicijnen();

  const gefilterd = zoekterm.trim().length > 0
    ? alleMedicijnen.filter(
        (m) =>
          m.toLowerCase().includes(zoekterm.toLowerCase()) &&
          !activeMedicijnen.includes(m)
      )
    : [];

  const voegToe = (naam: string) => {
    voegMedicijnToe(naam);
    setZoekterm("");
    setOpen(false);
    setGeselecteerd(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || gefilterd.length === 0) {
      if (e.key === "Enter" && zoekterm.trim()) {
        // Voeg vrij ingevoerd medicijn toe (niet in lijst)
        if (gefilterd.length === 0 && zoekterm.trim().length >= 2) {
          voegToe(zoekterm.trim());
        }
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setGeselecteerd((i) => Math.min(i + 1, gefilterd.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setGeselecteerd((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (geselecteerd >= 0) {
        voegToe(gefilterd[geselecteerd]);
      } else if (gefilterd.length > 0) {
        voegToe(gefilterd[0]);
      } else if (zoekterm.trim().length >= 2) {
        voegToe(zoekterm.trim());
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    setOpen(gefilterd.length > 0);
    setGeselecteerd(-1);
  }, [zoekterm]);

  // Sluit dropdown bij klik buiten
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        lijstRef.current &&
        !lijstRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
        Medicijn toevoegen
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={zoekterm}
            onChange={(e) => setZoekterm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Zoek op naam (bv. Morfine, Furosemide...)"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            autoComplete="off"
          />
          {open && gefilterd.length > 0 && (
            <ul
              ref={lijstRef}
              className="absolute z-50 left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg"
            >
              {gefilterd.slice(0, 12).map((m, i) => (
                <li key={m}>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); voegToe(m); }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between gap-2 ${
                      i === geselecteerd
                        ? "bg-blue-100 dark:bg-slate-700 font-medium"
                        : ""
                    } text-slate-800 dark:text-slate-200`}
                  >
                    <span>{m}</span>
                    {isAlleenCentraal(m) && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400 flex-shrink-0">
                        Alleen CVC
                      </span>
                    )}
                    {isGevaarlijkBijCvdFlush(m) && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400 flex-shrink-0"
                        title="Niet op CVD-meetlumen"
                      >
                        CVD✗
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={() => {
            if (zoekterm.trim().length >= 2) {
              if (gefilterd.length > 0) voegToe(gefilterd[0]);
              else voegToe(zoekterm.trim());
            }
          }}
          className="px-4 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors flex items-center gap-1"
          aria-label="Voeg medicijn toe"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Toevoegen</span>
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Niet in de lijst? Typ de naam volledig en druk Enter om toch toe te voegen.
      </p>
    </div>
  );
}
