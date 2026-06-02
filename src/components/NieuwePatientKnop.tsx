"use client";

import { useEffect, useState } from "react";
import { useIcuStore } from "@/store/icu-store";
import { useToastStore } from "@/store/toast-store";

export function NieuwePatientKnop() {
  const resetAlles = useIcuStore((s) => s.resetAlles);
  const activeMedicijnen = useIcuStore((s) => s.activeMedicijnen);
  const toon = useToastStore((s) => s.toon);
  const [bevestig, setBevestig] = useState(false);

  // Reset de bevestig-stand automatisch na enkele seconden
  useEffect(() => {
    if (!bevestig) return;
    const t = setTimeout(() => setBevestig(false), 4000);
    return () => clearTimeout(t);
  }, [bevestig]);

  const handleClick = () => {
    if (activeMedicijnen.length === 0) {
      resetAlles();
      return;
    }
    if (!bevestig) {
      setBevestig(true);
      return;
    }
    resetAlles();
    setBevestig(false);
    toon({ bericht: "Begonnen met nieuwe patiënt" });
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
        bevestig
          ? "bg-red-600 text-white hover:bg-red-700"
          : "text-slate-200 hover:text-white hover:bg-blue-700 dark:hover:bg-slate-700"
      }`}
      aria-label="Nieuwe patiënt — wis alles"
      title="Nieuwe patiënt — wis alle medicijnen en lijnen"
    >
      {bevestig ? (
        <>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="text-xs whitespace-nowrap">Wissen?</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="hidden sm:inline text-xs whitespace-nowrap">Nieuwe patiënt</span>
        </>
      )}
    </button>
  );
}
