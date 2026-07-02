/**
 * Module Entropy (AWPA — Entropie de Shannon)
 *
 * Mesure l'entropie de Shannon de la distribution des mots.
 * H = -Σ p(w) × log2(p(w))
 * Normalisée : H_norm = H / log2(V) où V = taille du vocabulaire
 *
 * Sprint 5 : minWords/minUniqueWords → LIC
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";
import { clampScore as clamp } from "./utils";
import { knowledge } from "./knowledge/registry";


export const entropyModule: AnalysisModule = {
  id: "entropy",
  label: "Entropie lexicale",
  weight: knowledge.weight("entropy"),

  execute(_text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { words, wordFreq, uniqueWords } = ctx;
    const cfg = knowledge.metric("entropy");

    if (words.length < (cfg.minWords ?? 0) || uniqueWords.size < (cfg.minUniqueWords ?? 0)) {
      return { score: 0, data: { rawEntropy: 0, normalizedEntropy: 0 } };
    }

    const wc = words.length;
    let H = 0;
    for (const [, count] of wordFreq) {
      const p = count / wc;
      if (p > 0) H -= p * Math.log2(p);
    }

    // Normaliser par l'entropie maximale (distribution uniforme)
    const maxH = Math.log2(uniqueWords.size);
    const normalizedEntropy = maxH > 0 ? H / maxH : 0;

    // Score inversé : faible entropie normalisée = texte prévisible = IA
    const score = clamp((1 - normalizedEntropy) * 100);

    return {
      score,
      data: {
        rawEntropy: Math.round(H * 100) / 100,
        normalizedEntropy: Math.round(normalizedEntropy * 1000) / 1000,
      },
    };
  },
};