/**
 * Linguistic Intelligence Core (LIC) — Métriques.
 *
 * Configuration de toutes les métriques d'analyse.
 * Chaque entrée contient poids, multiplicateurs, seuils et paramètres.
 *
 * Sprint 5 — Phase 0.
 */

import type { MetricConfig } from "./types";

/**
 * Registre complet des configurations de métriques.
 *
 * Convention de nommage des clés dans `thresholds` et `params` :
 * - camelCase, descriptif (ex: `cvLow`, `betweenWeight`)
 * - Pas de magic numbers dans les modules — tout passe par ici
 */
export const METRIC_CONFIGS: Record<string, MetricConfig> = {
  // ── Métriques composites (weight > 0) ──────────────────────────────

  burstiness: {
    id: "burstiness",
    label: "Variation des phrases",
    weight: 0.15,
    params: {
      betweenWeight: 0.7,
      withinWeight: 0.3,
      betweenNorm: 2.0,
      withinNorm: 2.5,
      minWordsPerSentence: 3,
      fallbackWithinCV: 0.5,
    },
  },

  vocabulary: {
    id: "vocabulary",
    label: "Diversité lexicale",
    weight: 0.10,
  },

  transition: {
    id: "transition",
    label: "Transitions mécaniques",
    weight: 0.10,
    multiplier: 150,
  },

  perfection: {
    id: "perfection",
    label: "Perfection (oralité)",
    weight: 0.05,
    multiplier: 220,
  },

  voice: {
    id: "voice",
    label: "Voix générique",
    weight: 0.10,
    multiplier: 350,
  },

  perplexity: {
    id: "perplexity",
    label: "Perplexité",
    weight: 0.15,
    multiplier: 1.8,
  },

  depth: {
    id: "depth",
    label: "Profondeur",
    weight: 0.05,
    multiplier: 900,
  },

  structure: {
    id: "structure",
    label: "Structure IA",
    weight: 0.10,
    thresholds: {
      paraCVLow: 0.2,
      paraCVMid: 0.3,
      connectorHigh: 0.4,
      connectorMid: 0.25,
    },
    params: {
      enumPoints: 8,
      headerPoints: 8,
      symmetryHighPoints: 15,
      symmetryMidPoints: 8,
      connectorHighPoints: 12,
      connectorMidPoints: 6,
    },
  },

  semanticRepetition: {
    id: "semanticRepetition",
    label: "Répétition sémantique",
    weight: 0.05,
    multiplier: 500,
    thresholds: {
      bigramSimilarity: 0.4,
    },
    params: {
      minWordsPerSentence: 3,
    },
  },

  personalization: {
    id: "personalization",
    label: "Personnalisation",
    weight: 0.05,
    multiplier: 25,
  },

  paraphrase: {
    id: "paraphrase",
    label: "Paraphrase IA",
    weight: 0.05,
    multiplier: 250,
  },

  style: {
    id: "style",
    label: "Style",
    weight: 0.05,
    thresholds: {
      sentLenMin: 15,
      sentLenMax: 30,
      connectorRateMin: 0.01,
      personalMarkersMax: 0.05,
      vocabDensityMax: 0.65,
    },
    params: {
      sentLenPoints: 30,
      connectorPoints: 25,
      personalPoints: 25,
      vocabPoints: 20,
    },
  },

  // ── Métriques observationnelles (weight = 0) ────────────────────────

  paragraphBalance: {
    id: "paragraphBalance",
    label: "Équilibre des paragraphes",
    weight: 0.0,
    thresholds: {
      cvCritical: 0.15,
      cvWarning: 0.25,
      cvNormal: 0.40,
    },
    params: {
      criticalScore: 90,
      warningBase: 50,
      warningRange: 30,
      normalBase: 20,
      normalRange: 20,
      naturalBase: 15,
      naturalSlope: 20,
    },
  },

  entropy: {
    id: "entropy",
    label: "Entropie lexicale",
    weight: 0.0,
    minWords: 10,
    minUniqueWords: 5,
  },

  compressionRatio: {
    id: "compressionRatio",
    label: "Ratio de compression",
    weight: 0.0,
    minWords: 10,
    params: {
      bigramWeight: 0.6,
      trigramWeight: 0.4,
      norm: 200,
    },
  },

  zipf: {
    id: "zipf",
    label: "Loi de Zipf",
    weight: 0.0,
    minUniqueWords: 10,
    params: {
      maxRank: 100,
      minSorted: 5,
    },
  },

  passiveVoice: {
    id: "passiveVoice",
    label: "Voix passive",
    weight: 0.0,
    minWords: 15,
    multiplier: 300,
    params: {
      proximityWindow: 5,
    },
  },
} as const;