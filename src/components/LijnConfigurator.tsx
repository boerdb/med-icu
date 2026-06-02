"use client";

import { useIcuStore } from "@/store/icu-store";
import { useToastStore } from "@/store/toast-store";
import { lumenLabel, defaultCvdLumenIndex, type LijnType } from "@/lib/lijnen";

export function LijnConfigurator() {
  const lijnen = useIcuStore((s) => s.lijnen);
  const voegPerifeerToe = useIcuStore((s) => s.voegPerifeerToe);
  const voegCvcToe = useIcuStore((s) => s.voegCvcToe);
  const verwijderLijn = useIcuStore((s) => s.verwijderLijn);
  const herstelLijn = useIcuStore((s) => s.herstelLijn);
  const updateLijn = useIcuStore((s) => s.updateLijn);
  const toon = useToastStore((s) => s.toon);

  const totaleLumens = lijnen.reduce((s, l) => s + l.aantalLumens, 0);
  const aantalPerifeer = lijnen.filter((l) => l.type === "perifeer").length;
  const aantalCvc = lijnen.filter((l) => l.type === "cvc").length;

  const handleVerwijderLijn = (id: string) => {
    const index = lijnen.findIndex((l) => l.id === id);
    const lijn = lijnen[index];
    if (!lijn) return;
    verwijderLijn(id);
    toon({
      bericht: `${lijn.naam} verwijderd`,
      actieLabel: "Ongedaan maken",
      onActie: () => herstelLijn(lijn, index),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">
            Infuuslijnen
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {aantalCvc} CVC • {aantalPerifeer} perifeer • {totaleLumens}{" "}
            lumen{totaleLumens !== 1 ? "s" : ""} totaal
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={voegCvcToe}
            className="flex items-center gap-1.5 px-3 py-2 border border-blue-700 dark:border-blue-500 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            CVC
          </button>
          <button
            onClick={voegPerifeerToe}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Perifeer
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {lijnen.map((lijn) => (
          <div
            key={lijn.id}
            className={`p-3 rounded-lg border bg-white dark:bg-slate-800 ${
              lijn.type === "cvc"
                ? "border-blue-200 dark:border-blue-800"
                : "border-emerald-200 dark:border-emerald-800"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {/* Type */}
              <select
                value={lijn.type}
                onChange={(e) =>
                  updateLijn(lijn.id, { type: e.target.value as LijnType })
                }
                aria-label={`Type lijn voor ${lijn.naam}`}
                title="Type lijn"
                className="px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cvc">CVC</option>
                <option value="perifeer">Perifeer</option>
              </select>

              {/* Naam */}
              <input
                type="text"
                value={lijn.naam}
                onChange={(e) => updateLijn(lijn.id, { naam: e.target.value })}
                className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={lijn.type === "cvc" ? "CVC" : "Perifeer infuus"}
              />

              {/* Aantal lumens (alleen CVC) */}
              {lijn.type === "cvc" && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Lumens:
                  </span>
                  <select
                    value={lijn.aantalLumens}
                    onChange={(e) =>
                      updateLijn(lijn.id, {
                        aantalLumens: parseInt(e.target.value),
                      })
                    }
                    aria-label={`Aantal lumens voor ${lijn.naam}`}
                    title="Aantal lumens"
                    className="px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Verwijder */}
              {lijnen.length > 1 && (
                <button
                  onClick={() => handleVerwijderLijn(lijn.id)}
                  className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  aria-label={`Verwijder ${lijn.naam}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Lumen preview */}
            <div className="flex gap-1.5 mt-2">
              {Array.from({ length: lijn.aantalLumens }).map((_, i) => {
                const isCvd =
                  lijn.type === "cvc" &&
                  (lijn.cvdLumenIndex ?? defaultCvdLumenIndex(lijn.aantalLumens)) ===
                    i;
                return (
                  <span
                    key={i}
                    className={`flex-1 text-center text-xs py-1 rounded ${
                      lijn.type === "cvc"
                        ? isCvd
                          ? "bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700"
                          : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    }`}
                  >
                    {lumenLabel(lijn.type, i)}
                    {isCvd && (
                      <span className="block text-[10px] font-semibold opacity-80">
                        CVD
                      </span>
                    )}
                  </span>
                );
              })}
            </div>

            {lijn.type === "cvc" && (
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                  CVD-meting op lumen:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: lijn.aantalLumens }).map((_, i) => (
                    <label
                      key={i}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`cvd-${lijn.id}`}
                        checked={
                          (lijn.cvdLumenIndex ??
                            defaultCvdLumenIndex(lijn.aantalLumens)) === i
                        }
                        onChange={() => updateLijn(lijn.id, { cvdLumenIndex: i })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      {lumenLabel("cvc", i)}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
