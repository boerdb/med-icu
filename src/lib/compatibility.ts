import data from "@/data/compatibility.fallback.json";

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

export function getStatus(a: string, b: string): CompatibiliteitStatus {
  if (a === b) return "compatibel";
  if (incompatibleSet.has(sleutel(a, b))) return "incompatibel";
  const bekendeA = dataset.medicijnen.includes(a);
  const bekendeB = dataset.medicijnen.includes(b);
  if (bekendeA && bekendeB) return "onbekend";
  return "onbekend";
}

export function isIncompatibel(a: string, b: string): boolean {
  return incompatibleSet.has(sleutel(a, b));
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

export function getBron(): string {
  return dataset.bron;
}

export function getOpmerking(): string {
  return dataset.opmerking;
}

export function isAlleenCentraal(medicijn: string): boolean {
  return alleenCentraalSet.has(medicijn);
}

export function getAlleenCentraalMedicijnen(): string[] {
  return dataset.alleenCentraal ?? [];
}

export function isGevaarlijkBijCvdFlush(medicijn: string): boolean {
  return gevaarlijkBijCvdFlushSet.has(medicijn);
}

export function isCvdLumenVeilig(medicijn: string): boolean {
  return !gevaarlijkBijCvdFlushSet.has(medicijn);
}
