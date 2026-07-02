/**
 * Phrases génériques typiques de l'IA, avec poids de risque.
 * Extrait de textAnalysis.ts (Sprint 4 PR2).
 */

export const AI_PHRASES: Array<{ phrase: string; weight: number }> = [
  // Fort risque
  { phrase: "en outre", weight: 3 },
  { phrase: "de plus", weight: 2 },
  { phrase: "par ailleurs", weight: 3 },
  { phrase: "en conclusion", weight: 3 },
  { phrase: "il convient de noter", weight: 3 },
  { phrase: "cette approche permet", weight: 3 },
  { phrase: "approche innovante", weight: 3 },
  { phrase: "solution pertinente", weight: 3 },
  { phrase: "enjeux majeurs", weight: 3 },
  { phrase: "impact significatif", weight: 3 },
  { phrase: "contexte en constante évolution", weight: 3 },
  { phrase: "perspectives prometteuses", weight: 3 },
  // Moyen risque
  { phrase: "il est important de", weight: 2 },
  { phrase: "il est essentiel de", weight: 2 },
  { phrase: "dans le monde actuel", weight: 2 },
  { phrase: "à l'ère du", weight: 2 },
  { phrase: "force est de constater", weight: 2 },
  { phrase: "pour conclure", weight: 2 },
  { phrase: "avancée majeure", weight: 2 },
  { phrase: "potentiel considérable", weight: 2 },
  { phrase: "défis majeurs", weight: 2 },
  { phrase: "progrès significatifs", weight: 2 },
  { phrase: "in today's world", weight: 2 },
  { phrase: "it is important to", weight: 2 },
  { phrase: "plays a crucial role", weight: 2 },
  { phrase: "delve into", weight: 3 },
  { phrase: "a testament to", weight: 2 },
  { phrase: "in conclusion", weight: 3 },
  { phrase: "however", weight: 1 },
  { phrase: "moreover", weight: 1 },
  { phrase: "furthermore", weight: 1 },
  { phrase: "therefore", weight: 1 },
  { phrase: "consequently", weight: 1 },
];