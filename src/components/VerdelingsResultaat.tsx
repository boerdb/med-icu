"use client";

import { useIcuStore } from "@/store/icu-store";
import { isGevaarlijkBijCvdFlush } from "@/lib/compatibility";
import { defaultCvdLumenIndex, lumenLabel } from "@/lib/lijnen";

// Kleuren per lumen-index (voor visueel onderscheid)
const lumenKleuren = [
  "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700",
  "bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700",
  "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-700",
  "bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700",
];

const lumenKopKleuren = [
  "bg-blue-600 dark:bg-blue-700 text-white",
  "bg-teal-600 dark:bg-teal-700 text-white",
  "bg-violet-600 dark:bg-violet-700 text-white",
  "bg-orange-600 dark:bg-orange-700 text-white",
];

export function VerdelingsResultaat() {
  const toewijzingen = useIcuStore((s) => s.toewijzingen);
  const verdelingMogelijk = useIcuStore((s) => s.verdelingMogelijk);
  const verdelingFout = useIcuStore((s) => s.verdelingFout);
  const lijnen = useIcuStore((s) => s.lijnen);
  const berekenVerdeling = useIcuStore((s) => s.berekenVerdeling);
  const activeMedicijnen = useIcuStore((s) => s.activeMedicijnen);
  const aantalGebruikteLumens = useIcuStore((s) => s.aantalGebruikteLumens);

  if (verdelingMogelijk === false) {
    return (
      <div className="rounded-xl border-2 border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20 p-6">
        <div className="flex items-start gap-3">
          <svg className="w-8 h-8 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="font-bold text-red-800 dark:text-red-300 text-lg">
              Verdeling niet mogelijk
            </h3>
            <p className="text-red-700 dark:text-red-400 text-sm mt-1">
              {verdelingFout === "centraal_vereist" ? (
                <>
                  Eén of meer medicijnen mogen alleen via de CVC (vasoactief,
                  vesicant of hypertonisch). Voeg een CVC toe of verwijder
                  centraal-only medicijnen.
                </>
              ) : (
                <>
                  Er zijn te veel incompatibele medicijnen voor het huidige
                  aantal lumens. Voeg een perifeer infuus toe of verwijder een
                  medicijn.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (toewijzingen === null) {
    return (
      <div className="text-center">
        <button
          onClick={berekenVerdeling}
          disabled={activeMedicijnen.length === 0}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-base transition-colors shadow-md"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 7V4a1 1 0 011-1h14a1 1 0 011 1v3M4 7H3m1 0h16m-1 0h1M4 7v13a1 1 0 001 1h14a1 1 0 001-1V7"
              />
            </svg>
            Bereken optimale verdeling
          </span>
        </button>
        {activeMedicijnen.length === 0 && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Voeg eerst medicijnen toe
          </p>
        )}
      </div>
    );
  }

  if (toewijzingen.length === 0) {
    return null;
  }

  // Groepeer toewijzingen per lijn en lumen
  const perLijn: Record<
    number,
    {
      lijnType: "cvc" | "perifeer";
      cvdLumenIndex: number | null;
      lijnNaam: string;
      lumens: Record<
        number,
        { label: string; isCvdLumen: boolean; medicijnen: string[] }
      >;
    }
  > = {};

  for (const lijn of lijnen) {
    const lijnIndex = lijnen.indexOf(lijn);
    const cvdIndex =
      lijn.type === "cvc"
        ? (lijn.cvdLumenIndex ?? defaultCvdLumenIndex(lijn.aantalLumens))
        : null;
    perLijn[lijnIndex] = {
      lijnType: lijn.type,
      cvdLumenIndex: cvdIndex,
      lijnNaam: lijn.naam,
      lumens: {},
    };
    for (let i = 0; i < lijn.aantalLumens; i++) {
      perLijn[lijnIndex].lumens[i] = {
        label: lumenLabel(lijn.type, i),
        isCvdLumen: lijn.type === "cvc" && cvdIndex === i,
        medicijnen: [],
      };
    }
  }

  for (const tw of toewijzingen) {
    if (perLijn[tw.lijnIndex]) {
      perLijn[tw.lijnIndex].lumens[tw.lumenIndex]?.medicijnen.push(tw.medicijn);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Verdeling gevonden
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {activeMedicijnen.length} medicijnen over {aantalGebruikteLumens} lumen{aantalGebruikteLumens !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={berekenVerdeling}
          className="text-xs px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
        >
          Herbereken
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(perLijn).map(([lijnIndexStr, lijnData]) => (
          <div
            key={lijnIndexStr}
            className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            {/* Lijn header */}
            <div className="bg-slate-800 dark:bg-slate-900 px-4 py-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
                />
              </svg>
              <span className="font-semibold text-white">{lijnData.lijnNaam}</span>
            </div>

            {/* Lumens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-700">
              {Object.entries(lijnData.lumens).map(([lumenIndexStr, lumenData]) => {
                const lumenIndex = parseInt(lumenIndexStr);
                const heeftMeds = lumenData.medicijnen.length > 0;
                const isCvc = lijnData.lijnType === "cvc";
                return (
                  <div
                    key={lumenIndexStr}
                    className={`p-3 border ${lumenKleuren[lumenIndex % lumenKleuren.length]}`}
                  >
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <div
                        className={`text-xs font-bold px-2 py-1 rounded-md inline-block ${lumenKopKleuren[lumenIndex % lumenKopKleuren.length]}`}
                      >
                        {lumenData.label}
                      </div>
                      {lumenData.isCvdLumen && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                          CVD
                        </span>
                      )}
                    </div>
                    {lumenData.isCvdLumen && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                        CVD-meting
                      </p>
                    )}
                    {heeftMeds ? (
                      <ul className="space-y-1">
                        {lumenData.medicijnen.map((med) => (
                          <li
                            key={med}
                            className="text-sm font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />
                            {med}
                            {lumenData.isCvdLumen && isGevaarlijkBijCvdFlush(med) && (
                              <span className="text-[10px] text-red-600 dark:text-red-400">
                                (niet op CVD-lumen)
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : isCvc && !lumenData.isCvdLumen ? (
                      <p className="text-xs text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                        NaCl 0,9% (lijn open houden)
                      </p>
                    ) : !isCvc ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                        Vrij
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center">
        Lege CVC-lumens: NaCl 0,9% • CVD-lumen: geen vasoactieve/vesicante medicatie
        <br />
        ⚠ Verifieer altijd in Stabilis 4.0 • Dit is een beslissingsondersteunend hulpmiddel
      </p>
    </div>
  );
}
