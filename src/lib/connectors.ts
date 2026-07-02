/**
 * Connecteurs logiques avec poids de risque IA.
 * Extrait de textAnalysis.ts (Sprint 4 PR2).
 */

export const WEIGHTED_CONNECTORS: Array<{ connector: string; weight: number }> = [
  // Fort risque
  { connector: "en outre", weight: 3 },
  { connector: "il convient de noter que", weight: 3 },
  { connector: "cette approche permet de", weight: 3 },
  { connector: "il est important de souligner", weight: 2 },
  { connector: "par conséquent", weight: 2 },
  // Risque moyen
  { connector: "en effet", weight: 1 },
  { connector: "cependant", weight: 1 },
  { connector: "de plus", weight: 2 },
  { connector: "par ailleurs", weight: 2 },
  { connector: "néanmoins", weight: 1 },
  { connector: "toutefois", weight: 1 },
  { connector: "de surcroît", weight: 2 },
  { connector: "en conclusion", weight: 3 },
  // EN
  { connector: "however", weight: 1 },
  { connector: "moreover", weight: 1 },
  { connector: "furthermore", weight: 1 },
  { connector: "therefore", weight: 1 },
  { connector: "consequently", weight: 1 },
  { connector: "in conclusion", weight: 3 },
];