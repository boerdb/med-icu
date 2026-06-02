import { getAlleMedicijnen } from "@/lib/compatibility";

/** Alternatieve spellingsnamen → canonieke naam in de lijst */
export const zoekSynoniemen: Record<string, string[]> = {
  Enoximone: ["Enoximon", "Enoximona", "Simdax"],
  Midazolam: ["Dormicum"],
  Rocuronium: ["Esmeron"],
  Noradrenaline: ["Norepinefrine", "Levophed"],
  Adrenaline: ["Epinefrine", "Epinephrine"],
  Fentanyl: ["Fentanyl"],
  Morfine: ["Morphine"],
  Insuline: ["Insulin"],
  Natriumwaterstofcarbonaat: ["NaHCO3", "Bicarbonaat", "Bic"],
  Kaliumchloride: ["KCl", "Kalium"],
  Calciumgluconaat: ["Calcium", "Ca gluconaat"],
  "Piperacilline-tazobactam": ["Tazocin", "Piperacilline/tazobactam"],
  Acetylcysteïne: ["NAC", "Acetylcysteine"],
  Fenylefrine: ["Phenylephrine", "Neosynephrine"],
  Natriumfosfaat: ["Fosfaat", "KH2PO4", "Kaliumfosfaat"],
  Tranexaminezuur: ["TXA", "Cyklokapron"],
  Ceftriaxon: ["Rocephin"],
  Linezolid: ["Zyvox"],
  Furosemide: ["Lasix", "Furosemide"],
  Magnesiumsulfaat: [
    "Magnesium sulfaat",
    "Magnesiumsulfaat",
    "MgSO4",
    "Mg SO4",
    "Magnesium",
  ],
};

export function normaliseerZoekterm(term: string): string {
  return term
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

let canoniekOpGenormaliseerd: Map<string, string> | null = null;

function getCanoniekLookup(): Map<string, string> {
  if (canoniekOpGenormaliseerd) return canoniekOpGenormaliseerd;

  canoniekOpGenormaliseerd = new Map<string, string>();
  for (const canoniek of getAlleMedicijnen()) {
    const registreer = (alias: string) => {
      const norm = normaliseerZoekterm(alias);
      if (norm) canoniekOpGenormaliseerd!.set(norm, canoniek);
    };
    registreer(canoniek);
    for (const synoniem of zoekSynoniemen[canoniek] ?? []) {
      registreer(synoniem);
    }
  }
  return canoniekOpGenormaliseerd;
}

/** Zet invoer om naar de canonieke datasetnaam (synoniemen, accenten, hoofdletters). */
export function resolveCanoniekeNaam(invoer: string): string {
  const trimmed = invoer.trim();
  if (!trimmed) return trimmed;

  if (getAlleMedicijnen().includes(trimmed)) return trimmed;

  const canoniek = getCanoniekLookup().get(normaliseerZoekterm(trimmed));
  if (canoniek) return canoniek;

  return trimmed;
}

export function zoekMedicijnen(
  zoekterm: string,
  actieveMedicijnen: string[]
): string[] {
  const norm = normaliseerZoekterm(zoekterm);
  if (!norm) return [];

  return getAlleMedicijnen().filter((naam) => {
    if (actieveMedicijnen.includes(naam)) return false;

    const normNaam = normaliseerZoekterm(naam);
    if (normNaam.includes(norm)) return true;

    const synoniemen = zoekSynoniemen[naam] ?? [];
    return synoniemen.some((s) => normaliseerZoekterm(s).includes(norm));
  });
}
