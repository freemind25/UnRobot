/**
 * Module SentenceVariation (AWPA — Burstiness)
 *
 * Mesure l'uniformité des longueurs de phrases.
 * Un texte IA a tendance à avoir des phrases de longueur très uniforme,
 * tandis qu'un humain varie naturellement (phrases courtes, longues, moyennes).
 *
 * Extrait de textAnalysis.ts lignes 1100-1108.
 * Produit un résultat identique au burstinessScore original.
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const sentenceVariationModule: AnalysisModule = {
  id: "burstiness",
  label: "Variation des phrases",
  weight: 0.15,

  execute(_text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { sentenceLengths } = ctx;
    if (sentenceLengths.length === 0) return { score: 0 };

    const avg = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance =
      sentenceLengths.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / sentenceLengths.length;
    const stdDev = Math.sqrt(variance);

    // Formule originale : (1 - CV) * 100
    // CV = stdDev / avg → plus CV est faible, plus c'est uniforme (IA)
    const score = clamp((1 - stdDev / Math.max(1, avg)) * 100);

    return {
      score,
      data: { avgLength: Math.round(avg * 10) / 10, stdDev: Math.round(stdDev * 10) / 10 },
    };
  },
};