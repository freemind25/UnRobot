/**
 * Module CompressionRatio (AWPA — Ratio de compression)
 *
 * Proxy de compressibilité basé sur la redondance des n-grammes.
 * Plus un texte a de n-grammes répétés, plus il est "compressible".
 * L'IA génère des textes plus compressibles (patterns répétitifs).
 *
 * Métrique = 1 - (bigrams uniques / bigrams totaux)
 * Score IA élevé = beaucoup de répétition = compressible = IA
 *
 * Zéro dépendance, 100% local, synchrone.
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const compressionRatioModule: AnalysisModule = {
  id: "compressionRatio",
  label: "Ratio de compression",
  weight: 0.0, // Observationnel

  execute(_text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { words } = ctx;
    if (words.length < 10) {
      return { score: 0, data: { bigramRedundancy: 0, trigramRedundancy: 0 } };
    }

    // ── Bigram redundancy ──
    const bigramSet = new Set<string>();
    let bigramCount = 0;
    for (let i = 0; i < words.length - 1; i++) {
      bigramSet.add(`${words[i]}|${words[i + 1]}`);
      bigramCount++;
    }
    const bigramRedundancy = bigramCount > 0 ? 1 - bigramSet.size / bigramCount : 0;

    // ── Trigram redundancy ──
    const trigramSet = new Set<string>();
    let trigramCount = 0;
    for (let i = 0; i < words.length - 2; i++) {
      trigramSet.add(`${words[i]}|${words[i + 1]}|${words[i + 2]}`);
      trigramCount++;
    }
    const trigramRedundancy = trigramCount > 0 ? 1 - trigramSet.size / trigramCount : 0;

    // Combinaison : 60% bigram + 40% trigram
    // Bigramme plus stable, trigramme plus discriminant
    const redundancy = bigramRedundancy * 0.6 + trigramRedundancy * 0.4;

    // Normaliser : redundancy typique 0.1-0.4 (human), 0.3-0.6 (AI)
    // Score : redundancy faible = humain (score bas), élevée = IA (score haut)
    const score = clamp(redundancy * 200);

    return {
      score,
      data: {
        bigramRedundancy: Math.round(bigramRedundancy * 1000) / 1000,
        trigramRedundancy: Math.round(trigramRedundancy * 1000) / 1000,
      },
    };
  },
};