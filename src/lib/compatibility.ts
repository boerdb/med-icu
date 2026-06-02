import data from "@/data/compatibility.fallback.json";
import { resolveCanoniekeNaam } from "@/lib/medicijn-zoeken";

export type CompatibiliteitStatus = "compatibel" | "incompatibel" | "onbekend";

export interface CompatibiliteitsData {
  versie: string;
  bijgewerkt: string;
  bron: string;
  opmerking: string;
  medicijnen: string[];
  incompatibel: [string, string][];
  alleenCentraal: string[];
  gevaarlijkBijCvdFlush: string[];
}

const dataset = data as CompatibiliteitsData;

const alleenCentraalSet = new Set<string>(dataset.alleenCentraal ?? []);
const gevaarlijkBijCvdFlushSet = new Set<string>(
  dataset.gevaarlijkBijCvdFlush ?? []
);

// Normalized set: "DRUG_A||DRUG_B" where A < B alphabetically
const incompatibleSet = new Set<string>(
  dataset.incompatibel.map(([a, b]) => {
    const [x, y] = [a, b].sort();
    return `${x}||${y}`;
  })
);

function sleutel(a: string, b: string): string {
  const [x, y] = [a, b].sort();
  return `${x}||${y}`;
}

function canoniekPaar(a: string, b: string): [string, string] {
  return [resolveCanoniekeNaam(a), resolveCanoniekeNaam(b)];
}

export function getStatus(a: string, b: string): CompatibiliteitStatus {
  const [ca, cb] = canoniekPaar(a, b);
  if (ca === cb) return "compatibel";
  if (incompatibleSet.has(sleutel(ca, cb))) return "incompatibel";
  const bekendeA = dataset.medicijnen.includes(ca);
  const bekendeB = dataset.medicijnen.includes(cb);
  if (bekendeA && bekendeB) return "onbekend";
  return "onbekend";
}

export function isIncompatibel(a: string, b: string): boolean {
  const [ca, cb] = canoniekPaar(a, b);
  return incompatibleSet.has(sleutel(ca, cb));
}

export function getIncompatibeleParenVoor(
  medicijnen: string[]
): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < medicijnen.length; i++) {
    for (let j = i + 1; j < medicijnen.length; j++) {
      if (isIncompatibel(medicijnen[i], medicijnen[j])) {
        pairs.push([medicijnen[i], medicijnen[j]]);
      }
    }
  }
  return pairs;
}

export function getAlleMedicijnen(): string[] {
  return dataset.medicijnen;
}

const bekendeMedicijnenSet = new Set<string>(dataset.medicijnen);

/** Staat het medicijn in de compatibiliteitsdataset? Vrij ingevoerde namen niet. */
export function isBekendMedicijn(medicijn: string): boolean {
  return bekendeMedicijnenSet.has(resolveCanoniekeNaam(medicijn));
}

/** Incompatibele paren die op hetzelfde lumen zijn geplaatst (veiligheidscheck). */
export function vindConflictenInToewijzingen(
  toewijzingen: { medicijn: string; lumenId: string }[]
): [string, string][] {
  const perLumen = new Map<string, string[]>();
  for (const { medicijn, lumenId } of toewijzingen) {
    const lijst = perLumen.get(lumenId) ?? [];
    lijst.push(medicijn);
    perLumen.set(lumenId, lijst);
  }

  const conflicten: [string, string][] = [];
  const gezien = new Set<string>();

  for (const medicijnen of perLumen.values()) {
    for (let i = 0; i < medicijnen.length; i++) {
      for (let j = i + 1; j < medicijnen.length; j++) {
        if (isIncompatibel(medicijnen[i], medicijnen[j])) {
          const sleutel = [medicijnen[i], medicijnen[j]].sort().join("||");
          if (!gezien.has(sleutel)) {
            gezien.add(sleutel);
            conflicten.push([medicijnen[i], medicijnen[j]]);
          }
        }
      }
    }
  }

  return conflicten;
}

export function getBron(): string {
  return dataset.bron;
}

export function getOpmerking(): string {
  return dataset.opmerking;
}

export function isAlleenCentraal(medicijn: string): boolean {
  return alleenCentraalSet.has(resolveCanoniekeNaam(medicijn));
}

export function getAlleenCentraalMedicijnen(): string[] {
  return dataset.alleenCentraal ?? [];
}

export function isGevaarlijkBijCvdFlush(medicijn: string): boolean {
  return gevaarlijkBijCvdFlushSet.has(resolveCanoniekeNaam(medicijn));
}

export function isCvdLumenVeilig(medicijn: string): boolean {
  return !gevaarlijkBijCvdFlushSet.has(medicijn);
}
