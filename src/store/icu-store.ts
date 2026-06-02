import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { getIncompatibeleParenVoor, isAlleenCentraal, isGevaarlijkBijCvdFlush } from "@/lib/compatibility";
import { dsatur, bouwLumens, type Toewijzing } from "@/lib/graph-coloring";
import { defaultCvdLumenIndex, type LijnType } from "@/lib/lijnen";

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
  verdelingFout: "geen_lumen" | "centraal_vereist" | null;
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
    if (state.activeMedicijnen.includes(naam)) return;
    set({
      activeMedicijnen: [...state.activeMedicijnen, naam],
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
    set((s) => {
      if (s.activeMedicijnen.includes(naam)) return s;
      const arr = [...s.activeMedicijnen];
      arr.splice(Math.min(Math.max(0, index), arr.length), 0, naam);
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
  },

  voegCvcToe: () => {
    const state = get();
    const aantal = state.lijnen.filter((l) => l.type === "cvc").length;
    set({
      lijnen: [...state.lijnen, nieuweCvc(aantal === 0 ? "CVC" : `CVC ${aantal + 1}`)],
      ...verdelingReset,
    });
  },

  verwijderLijn: (id) => {
    set((s) => ({
      lijnen: s.lijnen.filter((l) => l.id !== id),
      ...verdelingReset,
    }));
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
  },

  berekenVerdeling: () => {
    const { activeMedicijnen, lijnen } = get();
    if (activeMedicijnen.length === 0) {
      set({
        toewijzingen: [],
        verdelingMogelijk: true,
        verdelingFout: null,
        aantalGebruikteLumens: 0,
      });
      return;
    }

    const centraalVereist = activeMedicijnen.filter(isAlleenCentraal);
    const cvcLumens = lijnen
      .filter((l) => l.type === "cvc")
      .reduce((s, l) => s + l.aantalLumens, 0);

    if (centraalVereist.length > 0 && cvcLumens === 0) {
      set({
        toewijzingen: null,
        verdelingMogelijk: false,
        verdelingFout: "centraal_vereist",
        aantalGebruikteLumens: 0,
      });
      return;
    }

    const incompatibelen = getIncompatibeleParenVoor(activeMedicijnen);
    const lumens = bouwLumens(lijnen);
    const alleenCentraal = new Set(centraalVereist);
    const gevaarlijkBijCvd = new Set(
      activeMedicijnen.filter(isGevaarlijkBijCvdFlush)
    );
    const resultaat = dsatur(
      activeMedicijnen,
      incompatibelen,
      lumens,
      alleenCentraal,
      gevaarlijkBijCvd
    );

    if (resultaat === null) {
      set({
        toewijzingen: null,
        verdelingMogelijk: false,
        verdelingFout: "geen_lumen",
        aantalGebruikteLumens: 0,
      });
    } else {
      set({
        toewijzingen: resultaat.toewijzingen,
        verdelingMogelijk: true,
        verdelingFout: null,
        aantalGebruikteLumens: resultaat.aantalGebruikteLumens,
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
    }
  )
);
