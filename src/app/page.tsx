"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { MedicatieZoeker } from "@/components/MedicatieZoeker";
import { ActiveMedicatieLijst } from "@/components/ActiveMedicatieLijst";
import { LijnConfigurator } from "@/components/LijnConfigurator";
import { VerdelingsResultaat } from "@/components/VerdelingsResultaat";
import { CompatibiliteitsMatrix } from "@/components/CompatibiliteitsMatrix";
import { getBron } from "@/lib/compatibility";

type Tab = "medicijnen" | "lijnen" | "matrix";

const tabs: {
  id: Tab;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "medicijnen",
    label: "Medicijnen",
    shortLabel: "Meds",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
  {
    id: "lijnen",
    label: "Lijnen & Verdeling",
    shortLabel: "Lijnen",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
        />
      </svg>
    ),
  },
  {
    id: "matrix",
    label: "Compatibiliteit",
    shortLabel: "Matrix",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 6h16M4 10h16M4 14h16M4 18h16"
        />
      </svg>
    ),
  },
];

function TabButton({
  tab,
  active,
  onClick,
  variant,
}: {
  tab: (typeof tabs)[number];
  active: boolean;
  onClick: () => void;
  variant: "top" | "bottom";
}) {
  if (variant === "bottom") {
    return (
      <button
        role="tab"
        aria-selected={active}
        aria-label={tab.label}
        onClick={onClick}
        className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors ${
          active
            ? "text-blue-600 dark:text-blue-400"
            : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {tab.icon}
        <span className="text-[10px] font-semibold leading-none">{tab.shortLabel}</span>
      </button>
    );
  }

  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors min-h-[44px] ${
        active
          ? "border-blue-600 text-blue-700 dark:text-blue-400 dark:border-blue-400"
          : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
      }`}
    >
      {tab.icon}
      {tab.label}
    </button>
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("medicijnen");

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header />

      {/* Disclaimer — korter op mobiel */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-start gap-2">
          <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Beslissingsondersteuning</strong> — verifieer in Stabilis 4.0.
            <span className="hidden sm:inline">
              {" "}Bron: {getBron()}.
            </span>
          </p>
        </div>
      </div>

      {/* Tab navigatie — desktop/tablet */}
      <div className="hidden md:block sticky top-[calc(3.25rem+env(safe-area-inset-top))] z-30 bg-[var(--background)] border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1" role="tablist">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant="top"
              />
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6 space-y-4 sm:space-y-6">
        {activeTab === "medicijnen" && (
          <>
            <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 sm:p-5 shadow-sm space-y-4 sm:space-y-5">
              <MedicatieZoeker />
              <div className="border-t border-[var(--card-border)] pt-4">
                <ActiveMedicatieLijst />
              </div>
            </section>

            <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 sm:p-5 shadow-sm">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Werkinstructie
              </h2>
              <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                {[
                  "Zoek en voeg alle actieve medicijnen toe via de zoekbalk",
                  <>Ga naar <strong>Lijnen</strong> en configureer CVC en perifeer infuus</>,
                  <>Tik <strong>Bereken optimale verdeling</strong> — DSATUR verdeelt de medicijnen</>,
                  "Controleer de matrix en verifieer in Stabilis 4.0",
                ].map((text, i) => (
                  <li key={i} className="flex gap-2.5 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <span className="min-w-0 pt-0.5 leading-snug">{text}</span>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}

        {activeTab === "lijnen" && (
          <>
            <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 sm:p-5 shadow-sm">
              <LijnConfigurator />
            </section>
            <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 sm:p-5 shadow-sm">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 text-sm sm:text-base">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"
                  />
                </svg>
                Verdeling
              </h2>
              <VerdelingsResultaat />
            </section>
          </>
        )}

        {activeTab === "matrix" && (
          <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 sm:p-5 shadow-sm overflow-x-auto">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 text-sm sm:text-base">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              Y-site compatibiliteitsmatrix
            </h2>
            <CompatibiliteitsMatrix />
          </section>
        )}
      </main>

      {/* Bottom nav — mobiel */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--card)] border-t border-[var(--card-border)] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]"
        role="tablist"
        aria-label="Hoofdnavigatie"
      >
        <div className="flex max-w-lg mx-auto">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant="bottom"
            />
          ))}
        </div>
      </nav>
    </div>
  );
}
