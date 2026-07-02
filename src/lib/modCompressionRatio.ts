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
 * Sprint 5 : magic numbers → LIC
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";
import { knowledge } from "./knowledge/registry";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const compressionRatioModule: AnalysisModule = {
  id: "compressionRatio",
  label: "Ratio de compression",
  weight: knowledge.weight("compressionRatio"),

  execute(_text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { words } = ctx;
    const cfg = knowledge.metric("compressionRatio");
    if (words.length < (cfg.minWords ?? 0)) {
      return { score: 0, data: { bigramRedundancy: 0, trigramRedundancy: 0 } };
    }

    const p = cfg.params!;

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

    // Combinaison : poids via LIC
    const redundancy = bigramRedundancy * p.bigramWeight + trigramRedundancy * p.trigramWeight;

    // Normalisation : multiplicateur via LIC
    const score = clamp(redundancy * p.norm);

    return {
      score,
      data: {
        bigramRedundancy: Math.round(bigramRedundancy * 1000) / 1000,
        trigramRedundancy: Math.round(trigramRedundancy * 1000) / 1000,
      },
    };
  },
};