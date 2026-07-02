/**
 * Module Entropy (AWPA — Entropie de Shannon)
 *
 * Mesure l'entropie de Shannon de la distribution des mots.
 * H = -Σ p(w) × log2(p(w))
 * Normalisée : H_norm = H / log2(V) où V = taille du vocabulaire
 *
 * Un texte IA a une entropie normalisée plus FAIBLE car les mots
 * sont plus prévisibles (distribution plus "plate" et conventionnelle).
 * Un humain a une entropie normalisée plus ÉLEVÉE car il utilise
 * des mots rares, des néologismes, et des choix inhabituels.
 *
 * Score IA = 100 - (H_norm × 100)
 * Donc : faible entropie → score élevé → signal IA
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const entropyModule: AnalysisModule = {
  id: "entropy",
  label: "Entropie lexicale",
  weight: 0.0, // Observational — ne participe pas au score composite

  execute(_text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { words, wordFreq, uniqueWords } = ctx;
    if (words.length < 10 || uniqueWords.size < 5) {
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