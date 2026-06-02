export type LijnType = "cvc" | "perifeer";

export const cvcLumenLabels = ["Proximaal", "Mediaal", "Distaal", "Extra"];

export function lumenLabel(type: LijnType, index: number): string {
  if (type === "perifeer") return "Infuus";
  return cvcLumenLabels[index] ?? `Lumen ${index + 1}`;
}

/** Standaard distaal lumen voor CVD-meting (meest distale poort). */
export function defaultCvdLumenIndex(aantalLumens: number): number {
  return Math.max(0, aantalLumens - 1);
}
