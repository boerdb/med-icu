import { create } from "zustand";

export interface Toast {
  id: string;
  bericht: string;
  actieLabel?: string;
  onActie?: () => void;
}

interface ToastState {
  toasts: Toast[];
  toon: (toast: Omit<Toast, "id">, duurMs?: number) => void;
  verberg: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  toon: (toast, duurMs = 6000) => {
    const id = Math.random().toString(36).slice(2, 9);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    if (duurMs > 0) {
      setTimeout(() => get().verberg(id), duurMs);
    }
  },

  verberg: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
