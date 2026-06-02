export interface Lumen {
  id: string; // e.g. "0-0" = lijn 0, lumen 0
  lijnIndex: number;
  lumenIndex: number;
  lijnNaam: string;
  lijnType: "cvc" | "perifeer";
  isCvdLumen: boolean;
  lumenLabel: string;
}

export interface Toewijzing {
  medicijn: string;
  lumenId: string;
  lijnIndex: number;
  lumenIndex: number;
  lijnNaam: string;
  lumenLabel: string;
}

import {
  kanDelenOpLumen,
  isInsulineMedicijn,
  isTpvMedicijn,
} from "@/lib/compatibility";

export interface DsaturResultaat {
  toewijzingen: Toewijzing[];
  aantalGebruikteLumens: number;
}

/**
 * DSATUR graph-coloring algorithm met spreidingsheuristiek.
 *
 * Elke medicijn = knoop, elke incompatibiliteit = kant.
 * Incompatibele medicijnen krijgen nooit hetzelfde lumen.
 *
 * Spreiding: zolang er lege, toegestane lumens zijn, krijgt elk medicijn
 * een eigen lumen. Alleen als dat niet meer kan, worden compatibele
 * medicijnen gedeeld — steeds op het minst bezette lumen.
 */
export function dsatur(
  medicijnen: string[],
  incompatibiliteiten: [string, string][],
  lumens: Lumen[],
  alleenCentraal: Set<string> = new Set(),
  gevaarlijkBijCvdFlush: Set<string> = new Set()
): DsaturResultaat | null {
  if (medicijnen.length === 0) {
    return { toewijzingen: [], aantalGebruikteLumens: 0 };
  }

  // Bouw aangrenzingssets
  const buren = new Map<string, Set<string>>();
  for (const med of medicijnen) {
    buren.set(med, new Set());
  }
  for (const [a, b] of incompatibiliteiten) {
    if (buren.has(a) && buren.has(b)) {
      buren.get(a)!.add(b);
      buren.get(b)!.add(a);
    }
  }

  // DSATUR toestand
  const kleuren = new Map<string, string>(); // medicijn -> lumenId
  const lumenBezetting = new Map<string, number>(
    lumens.map((l) => [l.id, 0])
  );
  const lumenInhoud = new Map<string, string[]>(
    lumens.map((l) => [l.id, []])
  );
  let deelRotatie = 0;
  // Saturatiegraad = aantal unieke lumen-ids gebruikt door buren
  const saturatie = new Map<string, Set<string>>();
  for (const med of medicijnen) {
    saturatie.set(med, new Set());
  }

  const n = medicijnen.length;

  for (let stap = 0; stap < n; stap++) {
    const ongekleurd = medicijnen.filter((m) => !kleuren.has(m));
    const centraalOngekleurd = ongekleurd.filter((m) =>
      alleenCentraal.has(m)
    );
    // Vasoactief/centraal eerst — anders pakken andere middelen CVC-lumens in
    const pool =
      centraalOngekleurd.length > 0 ? centraalOngekleurd : ongekleurd;

    // Kies niet-gekleurde knoop met hoogste saturatie; bij gelijke saturatie: hoogste graad
    let besteKnoop = "";
    let besteSat = -1;
    let besteGraad = -1;

    for (const med of pool) {
      const sat = saturatie.get(med)!.size;
      const graad = buren.get(med)!.size;
      if (
        sat > besteSat ||
        (sat === besteSat && graad > besteGraad)
      ) {
        besteSat = sat;
        besteGraad = graad;
        besteKnoop = med;
      }
    }

    // Bepaal welke lumens al worden gebruikt door buren
    const gebruiktDoorBuren = new Set<string>();
    for (const buur of buren.get(besteKnoop)!) {
      if (kleuren.has(buur)) {
        gebruiktDoorBuren.add(kleuren.get(buur)!);
      }
    }

    const toegewezenLumen = kiesLumen(
      lumens,
      gebruiktDoorBuren,
      besteKnoop,
      alleenCentraal,
      gevaarlijkBijCvdFlush,
      lumenBezetting,
      lumenInhoud,
      deelRotatie
    );

    if (!toegewezenLumen) {
      return null;
    }

    if (lumenBezetting.get(toegewezenLumen)! > 0) {
      deelRotatie++;
    }

    kleuren.set(besteKnoop, toegewezenLumen);
    lumenBezetting.set(
      toegewezenLumen,
      lumenBezetting.get(toegewezenLumen)! + 1
    );
    lumenInhoud.get(toegewezenLumen)!.push(besteKnoop);

    // Update saturatie van niet-gekleurde buren
    for (const buur of buren.get(besteKnoop)!) {
      if (!kleuren.has(buur)) {
        saturatie.get(buur)!.add(toegewezenLumen);
      }
    }
  }

  const gebruikteLumens = new Set(kleuren.values());

  const toewijzingen: Toewijzing[] = medicijnen.map((med) => {
    const lumenId = kleuren.get(med)!;
    const lumen = lumens.find((l) => l.id === lumenId)!;
    return {
      medicijn: med,
      lumenId,
      lijnIndex: lumen.lijnIndex,
      lumenIndex: lumen.lumenIndex,
      lijnNaam: lumen.lijnNaam,
      lumenLabel: lumen.lumenLabel,
    };
  });

  return {
    toewijzingen,
    aantalGebruikteLumens: gebruikteLumens.size,
  };
}

/** Bouw een gestructureerde Lumen-lijst op basis van lijnconfiguratie */
export function bouwLumens(
  lijnen: {
    id: string;
    naam: string;
    type: "cvc" | "perifeer";
    aantalLumens: number;
    cvdLumenIndex?: number | null;
  }[]
): Lumen[] {
  const lumens: Lumen[] = [];

  lijnen.forEach((lijn, lijnIndex) => {
    for (let lumenIndex = 0; lumenIndex < lijn.aantalLumens; lumenIndex++) {
      const isCvdLumen =
        lijn.type === "cvc" && lijn.cvdLumenIndex === lumenIndex;
      lumens.push({
        id: `${lijnIndex}-${lumenIndex}`,
        lijnIndex,
        lumenIndex,
        lijnNaam: lijn.naam,
        lijnType: lijn.type,
        isCvdLumen,
        lumenLabel:
          lijn.type === "perifeer"
            ? "Infuus"
            : (["Proximaal", "Mediaal", "Distaal", "Extra"][lumenIndex] ??
              `Lumen ${lumenIndex + 1}`),
      });
    }
  });

  return lumens;
}

function isLumenToegestaan(
  lumen: Lumen,
  medicijn: string,
  gebruiktDoorBuren: Set<string>,
  alleenCentraal: Set<string>,
  gevaarlijkBijCvdFlush: Set<string>,
  lumenInhoud: Map<string, string[]>
): boolean {
  if (gebruiktDoorBuren.has(lumen.id)) return false;
  const inhoud = lumenInhoud.get(lumen.id) ?? [];
  if (inhoud.length > 0 && !kanDelenOpLumen(inhoud, medicijn)) {
    return false;
  }
  if (alleenCentraal.has(medicijn) && lumen.lijnType === "perifeer") {
    return false;
  }
  if (lumen.isCvdLumen && gevaarlijkBijCvdFlush.has(medicijn)) {
    return false;
  }
  return true;
}

/** TPV + insuline op hetzelfde CVC-lumen (niet-CVD) indien mogelijk. */
function vindTpvInsulinePartnerLumen(
  lumens: Lumen[],
  medicijn: string,
  alleenCentraal: Set<string>,
  gevaarlijkBijCvdFlush: Set<string>,
  lumenInhoud: Map<string, string[]>
): string | null {
  const zoekPartner = isInsulineMedicijn(medicijn)
    ? isTpvMedicijn
    : isTpvMedicijn(medicijn)
      ? isInsulineMedicijn
      : null;
  if (!zoekPartner) return null;

  for (const lumen of lumens) {
    if (lumen.lijnType !== "cvc" || lumen.isCvdLumen) continue;
    const inhoud = lumenInhoud.get(lumen.id) ?? [];
    if (inhoud.length !== 1 || !inhoud.some(zoekPartner)) continue;
    if (
      isLumenToegestaan(
        lumen,
        medicijn,
        new Set(),
        alleenCentraal,
        gevaarlijkBijCvdFlush,
        lumenInhoud
      )
    ) {
      return lumen.id;
    }
  }
  return null;
}

/** Kies een lumen: spreid, respecteer CVD-poort, vul CVC-lumens waar mogelijk. */
function kiesLumen(
  lumens: Lumen[],
  gebruiktDoorBuren: Set<string>,
  medicijn: string,
  alleenCentraal: Set<string>,
  gevaarlijkBijCvdFlush: Set<string>,
  lumenBezetting: Map<string, number>,
  lumenInhoud: Map<string, string[]>,
  deelRotatie: number
): string | null {
  const partnerLumen = vindTpvInsulinePartnerLumen(
    lumens,
    medicijn,
    alleenCentraal,
    gevaarlijkBijCvdFlush,
    lumenInhoud
  );
  if (partnerLumen) return partnerLumen;

  const toegestaan = lumens.filter((l) =>
    isLumenToegestaan(
      l,
      medicijn,
      gebruiktDoorBuren,
      alleenCentraal,
      gevaarlijkBijCvdFlush,
      lumenInhoud
    )
  );
  if (toegestaan.length === 0) return null;

  const centraal = alleenCentraal.has(medicijn);
  const cvc = toegestaan.filter((l) => l.lijnType === "cvc");
  const cvcNietCvd = cvc.filter((l) => !l.isCvdLumen);
  const cvcCvd = cvc.filter((l) => l.isCvdLumen);
  const perifeer = toegestaan.filter((l) => l.lijnType === "perifeer");

  if (centraal) {
    const lege = cvcNietCvd.filter((l) => lumenBezetting.get(l.id) === 0);
    if (lege.length > 0) return lege[0].id;
    if (cvcNietCvd.length > 0) {
      return kiesMinstBezet(
        cvcNietCvd,
        lumenBezetting,
        lumenInhoud,
        medicijn,
        deelRotatie
      );
    }
    return null;
  }

  // Niet-centraal: eerst lege CVC-lumens (niet-CVD) bezetten i.p.v. leeg laten
  const legeCvcNietCvd = cvcNietCvd.filter(
    (l) => lumenBezetting.get(l.id) === 0
  );
  if (legeCvcNietCvd.length > 0) return legeCvcNietCvd[0].id;

  const legePerifeer = perifeer.filter((l) => lumenBezetting.get(l.id) === 0);
  if (legePerifeer.length > 0) return legePerifeer[0].id;
  if (perifeer.length > 0) {
    return kiesMinstBezet(
      perifeer,
      lumenBezetting,
      lumenInhoud,
      medicijn,
      deelRotatie
    );
  }

  // CVD-poort: alleen één CVD-veilig medicijn op lege meetpoort (noodgeval).
  // Nooit een tweede medicijn op hetzelfde CVD-lumen — prik perifeer infuus.
  const legeCvd = cvcCvd.filter((l) => lumenBezetting.get(l.id) === 0);
  if (legeCvd.length > 0) return legeCvd[0].id;

  if (cvcNietCvd.length > 0) {
    return kiesMinstBezet(
      cvcNietCvd,
      lumenBezetting,
      lumenInhoud,
      medicijn,
      deelRotatie
    );
  }

  return null;
}

function kiesMinstBezet(
  kandidaten: Lumen[],
  lumenBezetting: Map<string, number>,
  lumenInhoud: Map<string, string[]>,
  medicijn: string,
  deelRotatie: number
): string {
  const deelbaar = kandidaten.filter((l) => {
    const inhoud = lumenInhoud.get(l.id) ?? [];
    return inhoud.length === 0 || kanDelenOpLumen(inhoud, medicijn);
  });
  const pool = deelbaar.length > 0 ? deelbaar : kandidaten;
  const minBezetting = Math.min(
    ...pool.map((l) => lumenBezetting.get(l.id)!)
  );
  const minstBezet = pool.filter(
    (l) => lumenBezetting.get(l.id) === minBezetting
  );
  return minstBezet[deelRotatie % minstBezet.length].id;
}
