"use client";

import { useIcuStore } from "@/store/icu-store";
import { useToastStore } from "@/store/toast-store";
import {
  isAlleenCentraal,
  isGevaarlijkBijCvdFlush,
  isInsulineMedicijn,
  isTpvMedicijn,
  vindConflictenInToewijzingen,
} from "@/lib/compatibility";
import { vindCvdLumenProblemen } from "@/lib/cvd-lumen";
import { defaultCvdLumenIndex, lumenLabel } from "@/lib/lijnen";
import { telCvcCapaciteit } from "@/lib/verdeling-diagnose";

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
  const voegCvcToe = useIcuStore((s) => s.voegCvcToe);
  const voegPerifeerToe = useIcuStore((s) => s.voegPerifeerToe);
  const verhoogEersteCvcLumens = useIcuStore((s) => s.verhoogEersteCvcLumens);
  const activeMedicijnen = useIcuStore((s) => s.activeMedicijnen);
  const aantalGebruikteLumens = useIcuStore((s) => s.aantalGebruikteLumens);
  const toon = useToastStore((s) => s.toon);

  if (verdelingMogelijk === false) {
    const centraalMedicijnen = activeMedicijnen.filter(isAlleenCentraal);
    const cvcCap = telCvcCapaciteit(lijnen);
    const eersteCvc = lijnen.find((l) => l.type === "cvc");
    const kanCvcUitbreiden =
      eersteCvc !== undefined && eersteCvc.aantalLumens < 4;
    const volgendeCvcLumens = (eersteCvc?.aantalLumens ?? 2) + 1;

    return (
      <div className="rounded-xl border-2 border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20 p-6">
        <div className="flex items-start gap-3">
          <svg className="w-8 h-8 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-red-800 dark:text-red-300 text-lg">
              Verdeling niet mogelijk
            </h3>
            <p className="text-red-700 dark:text-red-400 text-sm mt-1">
              {verdelingFout === "centraal_vereist" && (
                <>
                  Eén of meer medicijnen mogen alleen via de CVC (vasoactief,
                  vesicant of hypertonisch). Voeg een CVC toe of verwijder
                  centraal-only medicijnen.
                </>
              )}
              {verdelingFout === "cvc_lumen_tekort" && (
                <>
                  <strong>{centraalMedicijnen.length}</strong> medicijn
                  {centraalMedicijnen.length !== 1 ? "en" : ""} moet via de CVC, maar
                  er zijn niet genoeg CVC-infuuslumens (
                  <strong>{cvcCap.infuusLumens}</strong>
                  {cvcCap.cvdPoorten > 0 && (
                    <>
                      {" "}
                      — {cvcCap.cvdPoorten} gereserveerd voor CVD-meting
                    </>
                  )}
                  ). Perifeer helpt hier niet voor deze medicijnen. Verhoog het
                  aantal lumens op de CVC of verwijder een medicijn.
                </>
              )}
              {verdelingFout === "geen_lumen" && (
                <>
                  Er zijn niet genoeg lumens voor alle medicijnen (incompatibiliteit
                  of CVD-meetpoort). Prik een perifeer infuus voor niet-centrale
                  medicatie, of breid de CVC uit.
                </>
              )}
            </p>
            {verdelingFout === "cvc_lumen_tekort" && centraalMedicijnen.length > 0 && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Centraal-only: {centraalMedicijnen.join(", ")}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {verdelingFout === "centraal_vereist" && (
                <button
                  type="button"
                  onClick={() => voegCvcToe()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  CVC toevoegen
                </button>
              )}
              {verdelingFout === "cvc_lumen_tekort" && kanCvcUitbreiden && (
                <button
                  type="button"
                  onClick={() => verhoogEersteCvcLumens()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  CVC naar {volgendeCvcLumens} lumens
                </button>
              )}
              {verdelingFout === "cvc_lumen_tekort" && (
                <button
                  type="button"
                  onClick={() => voegCvcToe()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-400 dark:border-red-500 text-red-800 dark:text-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  Extra CVC
                </button>
              )}
              {verdelingFout === "geen_lumen" && (
                <>
                  {kanCvcUitbreiden && (
                    <button
                      type="button"
                      onClick={() => verhoogEersteCvcLumens()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      CVC naar {volgendeCvcLumens} lumens
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => voegPerifeerToe()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-400 dark:border-red-500 text-red-800 dark:text-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    Prik perifeer infuus
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (toewijzingen === null) {
    return (
      <div>
        <button
          type="button"
          onClick={berekenVerdeling}
          disabled={activeMedicijnen.length === 0}
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-base transition-colors shadow-md flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 7V4a1 1 0 011-1h14a1 1 0 011 1v3M4 7H3m1 0h16m-1 0h1M4 7v13a1 1 0 001 1h14a1 1 0 001-1V7"
            />
          </svg>
          Bereken optimale verdeling
        </button>
        {activeMedicijnen.length === 0 ? (
          <p className="mt-2 text-sm text-center text-slate-500 dark:text-slate-400">
            Voeg eerst medicijnen toe op het tabblad Medicijnen
          </p>
        ) : (
          <p className="mt-2 text-sm text-center text-slate-500 dark:text-slate-400">
            Configureer hierboven je lijnen, tik daarna op berekenen
          </p>
        )}
      </div>
    );
  }

  if (toewijzingen.length === 0) {
    return null;
  }

  const conflictenInVerdeling = vindConflictenInToewijzingen(toewijzingen);

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

  const cvdProblemen = vindCvdLumenProblemen(Object.values(perLijn));
  const heeftTpvMetInsuline = Object.values(perLijn).some((lijn) =>
    Object.values(lijn.lumens).some(
      (l) =>
        l.medicijnen.some(isTpvMedicijn) &&
        l.medicijnen.some(isInsulineMedicijn)
    )
  );

  const handlePrikPerifeer = () => {
    voegPerifeerToe();
    berekenVerdeling();
  };

  const genereerOverdracht = (): string => {
    const regels: string[] = ["IC Medicatie Verdeling", ""];
    for (const lijnData of Object.values(perLijn)) {
      regels.push(`${lijnData.lijnNaam}:`);
      for (const lumenData of Object.values(lijnData.lumens)) {
        const label = lumenData.label + (lumenData.isCvdLumen ? " [CVD]" : "");
        if (lumenData.medicijnen.length > 0) {
          regels.push(`  - ${label}: ${lumenData.medicijnen.join(", ")}`);
        } else if (lijnData.lijnType === "cvc" && !lumenData.isCvdLumen) {
          regels.push(`  - ${label}: NaCl 0,9% (lijn open houden)`);
        } else if (lijnData.lijnType === "perifeer") {
          regels.push(`  - ${label}: vrij`);
        }
      }
      regels.push("");
    }
    regels.push("Beslissingsondersteuning — verifieer altijd in Stabilis 4.0.");
    return regels.join("\n");
  };

  const handleKopieer = async () => {
    try {
      await navigator.clipboard.writeText(genereerOverdracht());
      toon({ bericht: "Verdeling gekopieerd naar klembord" });
    } catch {
      toon({ bericht: "Kopiëren niet gelukt" });
    }
  };

  const handleDeel = async () => {
    const tekst = genereerOverdracht();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "IC Medicatie Verdeling", text: tekst });
      } catch {
        // gebruiker annuleerde het delen — geen melding nodig
      }
    } else {
      await handleKopieer();
    }
  };

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
        <div className="flex flex-wrap gap-1.5 justify-end print:hidden">
          <button
            onClick={handleDeel}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            aria-label="Deel verdeling"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Deel
          </button>
          <button
            onClick={handleKopieer}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            aria-label="Kopieer verdeling"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Kopieer
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            aria-label="Print verdeling"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print
          </button>
          <button
            onClick={berekenVerdeling}
            className="text-xs px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          >
            Herbereken
          </button>
        </div>
      </div>

      {conflictenInVerdeling.length > 0 && (
        <div className="mb-4 rounded-lg border-2 border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">
            Incompatibele medicijnen op hetzelfde lumen
          </p>
          <ul className="mt-2 text-xs text-red-700 dark:text-red-400 space-y-1">
            {conflictenInVerdeling.map(([a, b]) => (
              <li key={`${a}-${b}`}>
                ⚠ {a} + {b} — herbereken of voeg een lumen toe
              </li>
            ))}
          </ul>
        </div>
      )}

      {heeftTpvMetInsuline && (
        <div className="mb-4 rounded-lg border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 p-3 print:hidden">
          <p className="text-xs text-teal-800 dark:text-teal-300">
            Insuline loopt bij TPV op hetzelfde CVC-lumen — gangbare IC-praktijk;
            controleer infuuspomp en compatibiliteit in Stabilis.
          </p>
        </div>
      )}

      {cvdProblemen.length > 0 && (
        <div className="mb-4 rounded-lg border-2 border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 p-4 print:hidden">
          <div className="flex items-start gap-3">
            <svg
              className="w-7 h-7 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                CVD-meetlumen overbelast
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                Het CVD-lumen is bedoeld voor drukmeting. Vasoactieve of vesicante
                medicatie hoort daar niet (alleen in uitzondering). Meerdere infusen op
                dezelfde meetpoort verstoren de CVD-meting.
              </p>
              <ul className="mt-2 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
                {cvdProblemen.map((p) => (
                  <li key={`${p.lijnNaam}-${p.lumenLabel}`}>
                    <strong>
                      {p.lijnNaam} — {p.lumenLabel} [CVD]:
                    </strong>{" "}
                    {p.medicijnen.join(", ")}
                    {p.gevaarlijkeMedicijnen.length > 0 && (
                      <span className="block text-red-700 dark:text-red-400 mt-0.5">
                        Niet geschikt op CVD-lumen:{" "}
                        {p.gevaarlijkeMedicijnen.join(", ")}
                      </span>
                    )}
                    {p.heeftMeerdereMedicijnen && (
                      <span className="block mt-0.5">
                        {p.medicijnen.length} medicijnen op één meetpoort.
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-xs font-medium text-amber-900 dark:text-amber-200 mt-3">
                Advies: prik een nieuw perifeer infuus en verplaats medicatie van het
                CVD-lumen.
              </p>
              <button
                type="button"
                onClick={handlePrikPerifeer}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Prik perifeer infuus
              </button>
            </div>
          </div>
        </div>
      )}

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
                              <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold">
                                (alleen noodgeval op CVD)
                              </span>
                            )}
                            {lumenData.isCvdLumen &&
                              lumenData.medicijnen.length >= 2 && (
                                <span className="text-[10px] text-amber-700 dark:text-amber-400">
                                  (meetpoort gedeeld)
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
