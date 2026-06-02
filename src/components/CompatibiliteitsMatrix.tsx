"use client";

import { useState } from "react";
import { useIcuStore } from "@/store/icu-store";
import { getStatus, type CompatibiliteitStatus } from "@/lib/compatibility";

const statusOmschrijving: Record<CompatibiliteitStatus, string> = {
  compatibel: "Compatibel (Y-site)",
  incompatibel: "Incompatibel (Y-site)",
  onbekend: "Onbekend — verifieer in Stabilis",
};

function StatusCel({
  status,
  rij,
  kolom,
  onSelect,
}: {
  status: CompatibiliteitStatus | "zelf";
  rij: string;
  kolom: string;
  onSelect: (paar: { a: string; b: string; status: CompatibiliteitStatus }) => void;
}) {
  if (status === "zelf") return <td className="w-10 h-10 bg-slate-200 dark:bg-slate-700" />;

  const cls =
    status === "compatibel"
      ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
      : status === "incompatibel"
      ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
      : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500";

  const label =
    status === "compatibel" ? "✓" : status === "incompatibel" ? "✗" : "?";

  return (
    <td className="p-0">
      <button
        type="button"
        onClick={() => onSelect({ a: rij, b: kolom, status })}
        className={`w-10 h-10 text-center text-sm font-bold cursor-pointer hover:ring-2 hover:ring-inset hover:ring-blue-500 ${cls}`}
        title={`${rij} + ${kolom}: ${statusOmschrijving[status]}`}
        aria-label={`${rij} met ${kolom}: ${statusOmschrijving[status]}`}
      >
        {label}
      </button>
    </td>
  );
}

export function CompatibiliteitsMatrix() {
  const activeMedicijnen = useIcuStore((s) => s.activeMedicijnen);
  const [geselecteerd, setGeselecteerd] = useState<{
    a: string;
    b: string;
    status: CompatibiliteitStatus;
  } | null>(null);

  if (activeMedicijnen.length < 2) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center">
        <p className="text-slate-400 dark:text-slate-500 text-sm">
          Voeg minimaal 2 medicijnen toe om de matrix te tonen
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <span className="w-4 h-4 rounded bg-green-200 dark:bg-green-900/40 inline-block border border-green-400" />
          Compatibel
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <span className="w-4 h-4 rounded bg-red-200 dark:bg-red-900/40 inline-block border border-red-400" />
          Incompatibel
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <span className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 inline-block border border-slate-300 dark:border-slate-600" />
          Onbekend
        </span>
      </div>

      {geselecteerd && (
        <div
          className={`mb-3 flex items-start gap-2 rounded-lg border p-3 text-sm ${
            geselecteerd.status === "compatibel"
              ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300"
              : geselecteerd.status === "incompatibel"
                ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300"
                : "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
          }`}
          role="status"
        >
          <span className="flex-1">
            <strong>{geselecteerd.a}</strong> + <strong>{geselecteerd.b}</strong>:{" "}
            {statusOmschrijving[geselecteerd.status]}
          </span>
          <button
            onClick={() => setGeselecteerd(null)}
            aria-label="Sluiten"
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="border-collapse text-xs min-w-full">
          <thead>
            <tr>
              {/* Lege hoek */}
              <th className="bg-slate-100 dark:bg-slate-800 p-2 border-b border-r border-slate-200 dark:border-slate-700 min-w-[120px]" />
              {activeMedicijnen.map((med) => (
                <th
                  key={med}
                  className="bg-slate-100 dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-700 p-1"
                >
                  <div
                    className="writing-mode-vertical text-slate-700 dark:text-slate-300 font-medium"
                    style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", maxHeight: 120 }}
                    title={med}
                  >
                    <span className="block truncate max-w-[100px]">{med}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeMedicijnen.map((rij) => (
              <tr key={rij} className="border-b border-slate-200 dark:border-slate-700">
                <td className="bg-slate-50 dark:bg-slate-800/50 px-3 py-1 font-medium text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                  {rij}
                </td>
                {activeMedicijnen.map((kolom) => (
                  <StatusCel
                    key={kolom}
                    rij={rij}
                    kolom={kolom}
                    status={rij === kolom ? "zelf" : getStatus(rij, kolom)}
                    onSelect={setGeselecteerd}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        Bron: Stabilis 4.0 subset • Onbekend (?) = geen gepubliceerde Y-site data in dataset —{" "}
        <a
          href="https://www.stabilis.org"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-600 dark:hover:text-blue-400"
        >
          verifieer op stabilis.org
        </a>
      </p>
    </div>
  );
}
