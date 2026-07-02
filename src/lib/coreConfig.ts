/**
 * Configuration des scores composites.
 * Désormais pilotée par le LIC (Sprint 5 PR2).
 *
 * Ces ré-exports garantissent la rétro-compatibilité :
 * les imports existants de coreConfig continuent de fonctionner.
 * La source de vérité est knowledge/metrics.ts + knowledge/evidence.ts.
 */

import { knowledge } from "./knowledge/registry";

/**
 * Pondérations du score IA multi-signaux.
 * Dérivées du LIC — ne pas modifier directement.
 * Formule : AI_SCORE = Σ(score × weight) + min(maxPatternPoints, patternPoints)
 */
export const SCORE_WEIGHTS = {
  ...knowledge.compositeWeights(),
  maxPatternPoints: knowledge.global().maxPatternPoints,
} as const;

/**
 * Configuration SUCKS (Specific, Unique, Clear, Simple, Sticky).
 * Dérivée du LIC — ne pas modifier directement.
 */
export const SUCKS_CONFIG = knowledge.global().sucks;