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
};

export function normaliseerZoekterm(term: string): string {
  return term
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
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
