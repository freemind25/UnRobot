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
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const sentenceVariationModule: AnalysisModule = {
  id: "burstiness",
  label: "Variation des phrases",
  weight: 0.15,

  execute(_text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { sentenceLengths, sentences } = ctx;
    if (sentenceLengths.length === 0) return { score: 0 };

    // ── Signal 1 : Between-sentence CV (original, inchangé) ──
    const avg = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance =
      sentenceLengths.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / sentenceLengths.length;
    const stdDev = Math.sqrt(variance);
    const betweenCV = stdDev / Math.max(1, avg);

    // ── Signal 2 : Within-sentence CV (nouveau) ──
    // Pour chaque phrase, calculer le CV des longueurs de mots
    // Un humain varie les longueurs de mots ; l'IA est plus uniforme
    let totalWithinCV = 0;
    let validSentences = 0;

    for (const s of sentences) {
      const wordLengths = s.trim().split(/\s+/).filter(Boolean).map((w) => w.length);
      if (wordLengths.length < 3) continue;

      const wAvg = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length;
      if (wAvg === 0) continue;
      const wVar = wordLengths.reduce((a, b) => a + Math.pow(b - wAvg, 2), 0) / wordLengths.length;
      const wStdDev = Math.sqrt(wVar);
      totalWithinCV += wStdDev / wAvg;
      validSentences++;
    }

    const avgWithinCV = validSentences > 0 ? totalWithinCV / validSentences : 0.5;

    // Combinaison : 70% inter-phrases + 30% intra-phrase
    // Les deux CV faibles = uniformité = IA
    // betweenCV typical: 0.3-0.8 (human), <0.25 (AI)
    // withinCV typical: 0.3-0.5 (human), <0.25 (AI)
    const normalizedBetween = Math.max(0, 1 - betweenCV * 2); // 0-1, low = AI
    const normalizedWithin = Math.max(0, 1 - avgWithinCV * 2.5); // 0-1, low = AI
    const combined = normalizedBetween * 0.7 + normalizedWithin * 0.3;
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