import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { defaultCvdLumenIndex, type LijnType } from "@/lib/lijnen";
import { resolveCanoniekeNaam } from "@/lib/medicijn-zoeken";
import {
  berekenVerdelingUitkomst,
  type VerdelingFout,
} from "@/lib/verdeling-diagnose";
import type { Toewijzing } from "@/lib/graph-coloring";

export type { VerdelingFout };

export interface Lijn {
  id: string;
  naam: string;
  type: LijnType;
  aantalLumens: number;
  /** Lumenindex voor CVD-meting; alleen bij type "cvc". */
  cvdLumenIndex?: number | null;
}

interface IcuState {
  activeMedicijnen: string[];
  lijnen: Lijn[];
  toewijzingen: Toewijzing[] | null;
  verdelingMogelijk: boolean | null; // null = nog niet berekend
  verdelingFout: VerdelingFout;
  aantalGebruikteLumens: number;
}

interface IcuActions {
  voegMedicijnToe: (naam: string) => void;
  verwijderMedicijn: (naam: string) => void;
  herstelMedicijn: (naam: string, index: number) => void;
  voegLijnToe: () => void;
  voegPerifeerToe: () => void;
  voegCvcToe: () => void;
  verwijderLijn: (id: string) => void;
  herstelLijn: (lijn: Lijn, index: number) => void;
  updateLijn: (id: string, wijzigingen: Partial<Omit<Lijn, "id">>) => void;
  verhoogEersteCvcLumens: () => void;
  berekenVerdeling: () => void;
  resetVerdeling: () => void;
  resetAlles: () => void;
}

export type IcuStore = IcuState & IcuActions;

function nieuweId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function nieuweCvc(naam = "CVC"): Lijn {
  return {
    id: nieuweId(),
    naam,
    type: "cvc",
    aantalLumens: 3,
    cvdLumenIndex: 2,
  };
}

const defaultLijnen: Lijn[] = [nieuweCvc()];

const verdelingReset = {
  toewijzingen: null,
  verdelingMogelijk: null,
  verdelingFout: null,
} as const;

const ssrVeiligeStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useIcuStore = create<IcuStore>()(
  persist(
    (set, get) => ({
  activeMedicijnen: [],
  lijnen: defaultLijnen,
  toewijzingen: null,
  verdelingMogelijk: null,
  verdelingFout: null,
  aantalGebruikteLumens: 0,

  voegMedicijnToe: (naam) => {
    const state = get();
    const canoniek = resolveCanoniekeNaam(naam);
    if (!canoniek || state.activeMedicijnen.includes(canoniek)) return;
    set({
      activeMedicijnen: [...state.activeMedicijnen, canoniek],
      toewijzingen: null,
      verdelingMogelijk: null,
      verdelingFout: null,
    });
  },

  verwijderMedicijn: (naam) => {
    set((s) => ({
      activeMedicijnen: s.activeMedicijnen.filter((m) => m !== naam),
      ...verdelingReset,
    }));
  },

  herstelMedicijn: (naam, index) => {
    const canoniek = resolveCanoniekeNaam(naam);
    set((s) => {
      if (s.activeMedicijnen.includes(canoniek)) return s;
      const arr = [...s.activeMedicijnen];
      arr.splice(Math.min(Math.max(0, index), arr.length), 0, canoniek);
      return { activeMedicijnen: arr, ...verdelingReset };
    });
  },

  voegLijnToe: () => {
    get().voegPerifeerToe();
  },

  voegPerifeerToe: () => {
    const state = get();
    const nummer =
      state.lijnen.filter((l) => l.type === "perifeer").length + 1;
    set({
      lijnen: [
        ...state.lijnen,
        {
          id: nieuweId(),
          naam: `Perifeer ${nummer}`,
          type: "perifeer",
          aantalLumens: 1,
        },
      ],
      ...verdelingReset,
    });
    if (get().activeMedicijnen.length > 0) {
      get().berekenVerdeling();
    }
  },

  voegCvcToe: () => {
    const state = get();
    const aantal = state.lijnen.filter((l) => l.type === "cvc").length;
    set({
      lijnen: [...state.lijnen, nieuweCvc(aantal === 0 ? "CVC" : `CVC ${aantal + 1}`)],
      ...verdelingReset,
    });
    if (get().activeMedicijnen.length > 0) {
      get().berekenVerdeling();
    }
  },

  verwijderLijn: (id) => {
    set((s) => ({
      lijnen: s.lijnen.filter((l) => l.id !== id),
      ...verdelingReset,
    }));
    if (get().activeMedicijnen.length > 0) {
      get().berekenVerdeling();
    }
  },

  herstelLijn: (lijn, index) => {
    set((s) => {
      if (s.lijnen.some((l) => l.id === lijn.id)) return s;
      const arr = [...s.lijnen];
      arr.splice(Math.min(Math.max(0, index), arr.length), 0, lijn);
      return { lijnen: arr, ...verdelingReset };
    });
  },

  updateLijn: (id, wijzigingen) => {
    set((s) => ({
      lijnen: s.lijnen.map((l) => {
        if (l.id !== id) return l;
        const bijgewerkt = { ...l, ...wijzigingen };
        if (bijgewerkt.type === "perifeer") {
          bijgewerkt.aantalLumens = 1;
          bijgewerkt.cvdLumenIndex = null;
        } else {
          const cvd =
            bijgewerkt.cvdLumenIndex ??
            defaultCvdLumenIndex(bijgewerkt.aantalLumens);
          bijgewerkt.cvdLumenIndex = Math.min(
            Math.max(0, cvd),
            bijgewerkt.aantalLumens - 1
          );
        }
        return bijgewerkt;
      }),
      ...verdelingReset,
    }));
    if (get().activeMedicijnen.length > 0) {
      get().berekenVerdeling();
    }
  },

  verhoogEersteCvcLumens: () => {
    const cvc = get().lijnen.find((l) => l.type === "cvc");
    if (!cvc || cvc.aantalLumens >= 4) return;
    get().updateLijn(cvc.id, { aantalLumens: cvc.aantalLumens + 1 });
  },

  berekenVerdeling: () => {
    const state = get();
    const { lijnen } = state;
    const uniekeMedicijnen = [
      ...new Set(state.activeMedicijnen.map(resolveCanoniekeNaam)),
    ];

    if (
      uniekeMedicijnen.length !== state.activeMedicijnen.length ||
      uniekeMedicijnen.some((m, i) => m !== state.activeMedicijnen[i])
    ) {
      set({ activeMedicijnen: uniekeMedicijnen });
    }

    if (uniekeMedicijnen.length === 0) {
      set({
        toewijzingen: [],
        verdelingMogelijk: true,
        verdelingFout: null,
        aantalGebruikteLumens: 0,
      });
      return;
    }

    const uitkomst = berekenVerdelingUitkomst(uniekeMedicijnen, lijnen);

    if (uitkomst.resultaat === null) {
      set({
        toewijzingen: null,
        verdelingMogelijk: false,
        verdelingFout: uitkomst.fout,
        aantalGebruikteLumens: 0,
      });
    } else {
      set({
        toewijzingen: uitkomst.resultaat.toewijzingen,
        verdelingMogelijk: true,
        verdelingFout: null,
        aantalGebruikteLumens: uitkomst.resultaat.aantalGebruikteLumens,
      });
    }
  },

  resetVerdeling: () => {
    set({ ...verdelingReset });
  },

  resetAlles: () => {
    set({
      activeMedicijnen: [],
      lijnen: [nieuweCvc()],
      toewijzingen: null,
      verdelingMogelijk: null,
      verdelingFout: null,
      aantalGebruikteLumens: 0,
    });
  },
    }),
    {
      name: "icu-store",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : ssrVeiligeStorage
      ),
      partialize: (state) => ({
        activeMedicijnen: state.activeMedicijnen,
        lijnen: state.lijnen,
        toewijzingen: state.toewijzingen,
        verdelingMogelijk: state.verdelingMogelijk,
        verdelingFout: state.verdelingFout,
        aantalGebruikteLumens: state.aantalGebruikteLumens,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.activeMedicijnen = [
          ...new Set(state.activeMedicijnen.map(resolveCanoniekeNaam)),
        ];
        state.toewijzingen = null;
        state.verdelingMogelijk = null;
        state.verdelingFout = null;
        state.aantalGebruikteLumens = 0;
      },
    }
  )
);
