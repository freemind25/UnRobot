/**
 * Module ParagraphBalance (AWPA — Équilibre des paragraphes)
 *
 * Mesure la régularité des tailles de paragraphes.
 * L'IA tend à produire des paragraphes de taille très uniforme,
 * tandis qu'un humain varie naturellement la longueur.
 *
 * NOUVEAU score — n'existait pas comme métrique autonome.
 * La logique de symétrie était partiellement dans computeStructureScore()
 * (lignes 987-997 de textAnalysis.ts) mais contribuant au structureScore global.
 * Ce module en fait une métrique dédiée avec son propre poids.
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const paragraphBalanceModule: AnalysisModule = {
  id: "paragraphBalance",
  label: "Équilibre des paragraphes",
  weight: 0.0, // Nouveau score — ne participe pas au score composite initial

  execute(text: string, _ctx: AnalysisContext): AnalysisModuleResult {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    if (paragraphs.length < 2) {
      return { score: 0, data: { paragraphCount: 0, cv: 0 } };
    }

    const paraLengths = paragraphs.map((p) => p.trim().split(/\s+/).length);
    const avg = paraLengths.reduce((a, b) => a + b, 0) / paraLengths.length;
    const variance = paraLengths.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / paraLengths.length;
    const stdDev = Math.sqrt(variance);
    const cv = avg > 0 ? stdDev / avg : 0; // Coefficient de variation

    // CV faible = paragraphes trop uniformes = signal IA
    // CV < 0.15 : très suspect → score 90
    // CV 0.15-0.25 : suspect → score 50-80
    // CV 0.25-0.40 : normal → score 20-40
    // CV > 0.40 : naturel → score 0-15
    let score: number;
    if (cv < 0.15) score = 90;
    else if (cv < 0.25) score = 50 + (0.25 - cv) / 0.10 * 30;
    else if (cv < 0.40) score = 20 + (0.40 - cv) / 0.15 * 20;
    else score = Math.max(0, 15 - (cv - 0.40) * 20);

    return {
      score: clamp(score),
      data: {
        paragraphCount: paragraphs.length,
        cv: Math.round(cv * 1000) / 1000,
        avgParaLength: Math.round(avg * 10) / 10,
      },
    };
  },
};