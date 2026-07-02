/**
 * Module LexicalRichness (AWPA — Diversité lexicale)
 *
 * Mesure la richesse du vocabulaire via le TTR (Type-Token Ratio).
 * Un TTR faible = beaucoup de répétitions = signal IA.
 * Un TTR élevé = vocabulaire riche = signal humain.
 *
 * Extrait de textAnalysis.ts lignes 1118-1123.
 * Produit un résultat identique au vocabularyScore original.
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const lexicalRichnessModule: AnalysisModule = {
  id: "vocabulary",
  label: "Diversité lexicale",
  weight: 0.10,

  execute(_text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { words, uniqueWords } = ctx;
    if (words.length === 0) return { score: 0 };

    const ttr = (uniqueWords.size / Math.max(1, words.length)) * 100;
    // Score inversé : TTR faible → score élevé (IA)
    const score = clamp(100 - ttr);

    return {
      score,
      data: { ttr: Math.round(ttr * 10) / 10 },
    };
  },
};