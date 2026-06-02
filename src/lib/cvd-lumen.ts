import { isGevaarlijkBijCvdFlush } from "@/lib/compatibility";

export interface CvdLumenProbleem {
  lijnNaam: string;
  lumenLabel: string;
  medicijnen: string[];
  gevaarlijkeMedicijnen: string[];
  heeftMeerdereMedicijnen: boolean;
}

export interface LumenMetMedicijnen {
  label: string;
  isCvdLumen: boolean;
  medicijnen: string[];
}

/** CVD-poort: geen vasoactieven/vesicanten; bij voorkeur max. 1 infuus (alleen meting). */
export function vindCvdLumenProblemen(
  perLijn: Iterable<{
    lijnNaam: string;
    lumens: Record<number, LumenMetMedicijnen> | Iterable<LumenMetMedicijnen>;
  }>
): CvdLumenProbleem[] {
  const problemen: CvdLumenProbleem[] = [];

  for (const lijn of perLijn) {
    const lumens = Object.values(
      lijn.lumens as Record<number, LumenMetMedicijnen>
    );
    for (const lumen of lumens) {
      if (!lumen.isCvdLumen || lumen.medicijnen.length === 0) continue;

      const gevaarlijkeMedicijnen = lumen.medicijnen.filter(isGevaarlijkBijCvdFlush);
      const heeftMeerdereMedicijnen = lumen.medicijnen.length >= 2;

      if (gevaarlijkeMedicijnen.length > 0 || heeftMeerdereMedicijnen) {
        problemen.push({
          lijnNaam: lijn.lijnNaam,
          lumenLabel: lumen.label,
          medicijnen: lumen.medicijnen,
          gevaarlijkeMedicijnen,
          heeftMeerdereMedicijnen,
        });
      }
    }
  }

  return problemen;
}

export function heeftCvdLumenProblemen(problemen: CvdLumenProbleem[]): boolean {
  return problemen.length > 0;
}
