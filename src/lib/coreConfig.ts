/**
 * Configuration des scores composites.
 * Extrait de textAnalysis.ts (Sprint 4 PR4).
 */

/**
 * Pondérations du score IA multi-signaux.
 * Formule : AI_SCORE = Σ(score × weight) + min(maxPatternPoints, patternPoints)
 */
export const SCORE_WEIGHTS = {
  burstiness: 0.15,
  transition: 0.10,
  perfection: 0.05,
  voice: 0.10,
  perplexity: 0.15,
  vocabulary: 0.10,
  depth: 0.05,
  structure: 0.10,
  semanticRepetition: 0.05,
  personalization: 0.05,
  paraphrase: 0.05,
  style: 0.05,
  maxPatternPoints: 30,
} as const;

/**
 * Pondérations et seuils du score SUCKS
 * (Specific, Unique, Clear, Simple, Sticky).
 */
export const SUCKS_CONFIG = {
  specific:   { weight: 0.6, bonus: 25, threshold: 3, field: "depth" as const },
  unique:     { weight: 0.7, penalty: 25, flag: "Langage vague" as const, field: "voice" as const },
  clear:      { weight: 0.5, penalty: 25, flag: "Jargon corporate" as const, field: "transition" as const },
  simple:     { weight: 0.4, penalty: 25, avgLengthThreshold: 25, field: "vocabulary" as const },
  sticky:     { weight: 0.5, penalty: 20, flag: "Phrases rhétoriques interdites" as const, field: "perfection" as const },
} as const;