import {
  getIncompatibeleParenVoor,
  isAlleenCentraal,
  isGevaarlijkBijCvdFlush,
} from "@/lib/compatibility";
import { bouwLumens, dsatur, type DsaturResultaat } from "@/lib/graph-coloring";

export type VerdelingFout =
  | "centraal_vereist"
  | "cvc_lumen_tekort"
  | "geen_lumen"
  | null;

export interface CvcCapaciteit {
  totaalCvcLumens: number;
  infuusLumens: number;
  cvdPoorten: number;
}

export interface LijnVoorCapaciteit {
  id: string;
  naam: string;
  type: "cvc" | "perifeer";
  aantalLumens: number;
  cvdLumenIndex?: number | null;
}

export function telCvcCapaciteit(lijnen: LijnVoorCapaciteit[]): CvcCapaciteit {
  let totaalCvcLumens = 0;
  let cvdPoorten = 0;

  for (const lijn of lijnen) {
    if (lijn.type !== "cvc") continue;
    totaalCvcLumens += lijn.aantalLumens;
    cvdPoorten += 1;
  }

  return {
    totaalCvcLumens,
    infuusLumens: Math.max(0, totaalCvcLumens - cvdPoorten),
    cvdPoorten,
  };
}

export interface VerdelingUitkomst {
  resultaat: DsaturResultaat | null;
  fout: VerdelingFout;
  centraalVereist: string[];
  capaciteit: CvcCapaciteit;
}

/** Bepaalt of verdeling lukt en welke fout het meest specifiek is. */
export function berekenVerdelingUitkomst(
  medicijnen: string[],
  lijnen: LijnVoorCapaciteit[]
): VerdelingUitkomst {
  const capaciteit = telCvcCapaciteit(lijnen);
  const centraalVereist = medicijnen.filter(isAlleenCentraal);
  const lumens = bouwLumens(lijnen);
  const cvcLumens = lumens.filter((l) => l.lijnType === "cvc");

  if (centraalVereist.length > 0 && capaciteit.totaalCvcLumens === 0) {
    return {
      resultaat: null,
      fout: "centraal_vereist",
      centraalVereist,
      capaciteit,
    };
  }

  const incompatibelen = getIncompatibeleParenVoor(medicijnen);
  const alleenCentraal = new Set(centraalVereist);
  const gevaarlijkBijCvd = new Set(
    medicijnen.filter(isGevaarlijkBijCvdFlush)
  );

  if (centraalVereist.length > 0 && cvcLumens.length > 0) {
    const centraalIncompat = getIncompatibeleParenVoor(centraalVereist);
    const centraalPast = dsatur(
      centraalVereist,
      centraalIncompat,
      cvcLumens,
      alleenCentraal,
      gevaarlijkBijCvd
    );
    if (centraalPast === null) {
      return {
        resultaat: null,
        fout: "cvc_lumen_tekort",
        centraalVereist,
        capaciteit,
      };
    }
  }

  const resultaat = dsatur(
    medicijnen,
    incompatibelen,
    lumens,
    alleenCentraal,
    gevaarlijkBijCvd
  );

  return {
    resultaat,
    fout: resultaat === null ? "geen_lumen" : null,
    centraalVereist,
    capaciteit,
  };
}
