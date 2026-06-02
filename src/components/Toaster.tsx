"use client";

import { useToastStore } from "@/store/toast-store";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const verberg = useToastStore((s) => s.verberg);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-[calc(100%-1.5rem)] max-w-sm bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6"
      role="region"
      aria-label="Meldingen"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="flex items-center gap-3 rounded-xl bg-slate-800 dark:bg-slate-700 text-white shadow-lg px-4 py-3 text-sm animate-in"
        >
          <span className="flex-1 min-w-0">{toast.bericht}</span>
          {toast.actieLabel && (
            <button
              onClick={() => {
                toast.onActie?.();
                verberg(toast.id);
              }}
              className="flex-shrink-0 font-semibold text-blue-300 hover:text-blue-200 transition-colors uppercase text-xs tracking-wide"
            >
              {toast.actieLabel}
            </button>
          )}
          <button
            onClick={() => verberg(toast.id)}
            aria-label="Melding sluiten"
            className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
