/**
 * Module SentenceVariation (AWPA — Burstiness ENHANCED)
 *
 * Mesure l'uniformité des longueurs de phrases à deux niveaux :
 * 1. Between-sentence CV (original) : variation des longueurs entre phrases
 * 2. Within-sentence CV (nouveau) : variation des longueurs de mots dans chaque phrase
 *
 * Le score combine les deux signaux avec un poids 70/30.
 * L'IA produit des phrases uniformes ET des mots de longueur uniforme dans chaque phrase.
 *
 * Sprint 2A : extraction originale (CV inter-phrases uniquement)
 * Sprint 2B : ajout du CV intra-phrase
 * Sprint 5  : magic numbers → LIC
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";
import { knowledge } from "./knowledge/registry";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const sentenceVariationModule: AnalysisModule = {
  id: "burstiness",
  label: "Variation des phrases",
  weight: knowledge.weight("burstiness"),

  execute(_text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { sentenceLengths, sentences } = ctx;
    if (sentenceLengths.length === 0) return { score: 0 };

    const cfg = knowledge.metric("burstiness");
    const p = cfg.params!;

    // ── Signal 1 : Between-sentence CV (original, inchangé) ──
    const avg = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance =
      sentenceLengths.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / sentenceLengths.length;
    const stdDev = Math.sqrt(variance);
    const betweenCV = stdDev / Math.max(1, avg);

    // ── Signal 2 : Within-sentence CV (nouveau) ──
    let totalWithinCV = 0;
    let validSentences = 0;

    for (const s of sentences) {
      const wordLengths = s.trim().split(/\s+/).filter(Boolean).map((w) => w.length);
      if (wordLengths.length < p.minWordsPerSentence) continue;

      const wAvg = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length;
      if (wAvg === 0) continue;
      const wVar = wordLengths.reduce((a, b) => a + Math.pow(b - wAvg, 2), 0) / wordLengths.length;
      const wStdDev = Math.sqrt(wVar);
      totalWithinCV += wStdDev / wAvg;
      validSentences++;
    }

    const avgWithinCV = validSentences > 0 ? totalWithinCV / validSentences : p.fallbackWithinCV;

    // Combinaison : poids via LIC
    const normalizedBetween = Math.max(0, 1 - betweenCV * p.betweenNorm);
    const normalizedWithin = Math.max(0, 1 - avgWithinCV * p.withinNorm);
    const combined = normalizedBetween * p.betweenWeight + normalizedWithin * p.withinWeight;
    const score = clamp(combined * 100);

    return {
      score,
      data: {
        avgLength: Math.round(avg * 10) / 10,
        stdDev: Math.round(stdDev * 10) / 10,
        betweenCV: Math.round(betweenCV * 1000) / 1000,
        withinCV: Math.round(avgWithinCV * 1000) / 1000,
      },
    };
  },
};