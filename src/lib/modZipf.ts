/**
 * Module Zipf (AWPA — Distance à la loi de Zipf)
 *
 * Mesure à quel point la distribution des mots suit la loi de Zipf :
 * fréquence du k-ième mot le plus fréquent ≈ C / k
 *
 * Calcule R² (coefficient de détermination) entre la distribution
 * réelle et la distribution Zipf théorique.
 *
 * - R² élevé (proche de 1) : distribution trop "parfaite" = signal IA
 * - R² faible : distribution naturelle avec écarts = signal humain
 *
 * Score IA = R² × 100
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const zipfModule: AnalysisModule = {
  id: "zipf",
  label: "Loi de Zipf",
  weight: 0.0, // Observationnel

  execute(_text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { wordFreq, uniqueWords } = ctx;
    const V = uniqueWords.size;
    if (V < 10) return { score: 0, data: { rSquared: 0 } };

    // Trier les mots par fréquence décroissante
    const sorted = [...wordFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.min(V, 100)); // Limiter aux 100 mots les plus fréquents

    if (sorted.length < 5) return { score: 0, data: { rSquared: 0 } };

    const N = sorted.length;
    const C = sorted[0][1]; // Fréquence du mot le plus fréquent

    // Calculer R² entre log(fréquence réelle) et log(C/k)
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let k = 1; k <= N; k++) {
      const x = Math.log(k);                    // log(rank)
      const y = Math.log(sorted[k - 1][1]);    // log(fréquence)
      const xTheory = Math.log(k);
      const yTheory = Math.log(C / k);

      // Utiliser les valeurs théoriques pour x, réelles pour y
      sumX += xTheory;
      sumY += y;
      sumXY += xTheory * y;
      sumX2 += xTheory * xTheory;
      sumY2 += y * y;
    }

    const n = N;
    const denominator = (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY);
    const rSquared = denominator === 0
      ? 0
      : Math.pow(n * sumXY - sumX * sumY, 2) / denominator;

    // R² élevé = bonne adhésion à Zipf = IA
    const score = clamp(rSquared * 100);

    return {
      score,
      data: { rSquared: Math.round(rSquared * 1000) / 1000 },
    };
  },
};