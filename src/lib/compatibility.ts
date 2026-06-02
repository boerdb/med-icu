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
  exclusiefLumen?: string[];
  gevaarlijkBijCvdFlush: string[];
}

const dataset = data as CompatibiliteitsData;

const alleenCentraalSet = new Set<string>(dataset.alleenCentraal ?? []);
const exclusiefLumenSet = new Set<string>(dataset.exclusiefLumen ?? []);
const gevaarlijkBijCvdFlushSet = new Set<string>(
  dataset.gevaarlijkBijCvdFlush ?? []
);

const TPV_NAAM = "Totale parenterale voeding";
const INSULINE_NAAM = "Insuline";

function canoniek(medicijn: string): string {
  return resolveCanoniekeNaam(medicijn);
}

/** TPV / Olimel e.d. — eigen lumen; in de praktijk soms + insuline op hetzelfde lumen. */
export function isExclusiefLumen(medicijn: string): boolean {
  return exclusiefLumenSet.has(canoniek(medicijn));
}

export function isTpvMedicijn(medicijn: string): boolean {
  return canoniek(medicijn) === TPV_NAAM;
}

export function isInsulineMedicijn(medicijn: string): boolean {
  return canoniek(medicijn) === INSULINE_NAAM;
}

/** Insuline bij TPV op hetzelfde lumen is gangbare IC-praktijk. */
export function magOpZelfdeLumenMetTpv(a: string, b: string): boolean {
  const [ca, cb] = canoniekPaar(a, b);
  return (
    (ca === TPV_NAAM && cb === INSULINE_NAAM) ||
    (ca === INSULINE_NAAM && cb === TPV_NAAM)
  );
}

/** Mag nieuw medicijn op een lumen met bestaande toewijzingen? */
export function kanDelenOpLumen(
  bestaandeMedicijnen: string[],
  nieuwMedicijn: string
): boolean {
  if (bestaandeMedicijnen.length === 0) return true;

  const nieuw = canoniek(nieuwMedicijn);
  const aanwezig = bestaandeMedicijnen.map(canoniek);

  if (magOpZelfdeLumenMetTpv(nieuw, aanwezig[0]!)) {
    if (aanwezig.length === 1) return true;
    if (aanwezig.length === 2 && aanwezig.includes(TPV_NAAM) && aanwezig.includes(INSULINE_NAAM)) {
      return nieuw === TPV_NAAM || nieuw === INSULINE_NAAM;
    }
  }

  if (isExclusiefLumen(nieuw) || aanwezig.some(isExclusiefLumen)) {
    return false;
  }

  return true;
}

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
  if (magOpZelfdeLumenMetTpv(ca, cb)) return "compatibel";
  if (isExclusiefLumen(ca) || isExclusiefLumen(cb)) {
    return "incompatibel";
  }
  if (incompatibleSet.has(sleutel(ca, cb))) {
    return "incompatibel";
  }
  const bekendeA = dataset.medicijnen.includes(ca);
  const bekendeB = dataset.medicijnen.includes(cb);
  if (bekendeA && bekendeB) return "onbekend";
  return "onbekend";
}

export function isIncompatibel(a: string, b: string): boolean {
  const [ca, cb] = canoniekPaar(a, b);
  if (magOpZelfdeLumenMetTpv(ca, cb)) return false;
  if (isExclusiefLumen(ca) || isExclusiefLumen(cb)) return true;
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
    if (
      medicijnen.length >= 2 &&
      medicijnen.some(isExclusiefLumen) &&
      !(
        medicijnen.length === 2 &&
        medicijnen.some(isTpvMedicijn) &&
        medicijnen.some(isInsulineMedicijn)
      )
    ) {
      const tpv = medicijnen.find(isExclusiefLumen)!;
      const ander = medicijnen.find((m) => !isExclusiefLumen(m)) ?? medicijnen.find((m) => m !== tpv)!;
      const sleutel = [tpv, ander].sort().join("||");
      if (!gezien.has(sleutel)) {
        gezien.add(sleutel);
        conflicten.push([tpv, ander]);
      }
      continue;
    }
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
