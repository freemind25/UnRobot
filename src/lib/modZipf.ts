/**
 * Module Zipf (AWPA — Distance à la loi de Zipf)
 *
 * Mesure à quel point la distribution des mots suit la loi de Zipf.
 * R² élevé = distribution trop "parfaite" = signal IA.
 *
 * Sprint 5 : minUniqueWords + maxRank + minSorted → LIC
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";
import { knowledge } from "./knowledge/registry";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const zipfModule: AnalysisModule = {
  id: "zipf",
  label: "Loi de Zipf",
  weight: knowledge.weight("zipf"),

  execute(_text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { wordFreq, uniqueWords } = ctx;
    const V = uniqueWords.size;
    const cfg = knowledge.metric("zipf");

    if (V < (cfg.minUniqueWords ?? 0)) return { score: 0, data: { rSquared: 0 } };

    const p = cfg.params!;
    const maxRank = p.maxRank;
    const minSorted = p.minSorted;

    // Trier les mots par fréquence décroissante
    const sorted = [...wordFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.min(V, maxRank));

    if (sorted.length < minSorted) return { score: 0, data: { rSquared: 0 } };

    const N = sorted.length;
    const C = sorted[0][1];

    // Calculer R² entre log(fréquence réelle) et log(C/k)
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let k = 1; k <= N; k++) {
      const xTheory = Math.log(k);
      const y = Math.log(sorted[k - 1][1]);

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