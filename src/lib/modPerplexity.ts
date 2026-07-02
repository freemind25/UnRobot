/**
 * Module Perplexity (AWPA — Prévisibilité lexicale)
 *
 * Approxime la perplexité par le ratio de mots très courants.
 * Un texte IA a une proportion plus élevée de mots courants
 * (distribution plus "plate" et prévisible).
 *
 * Score élevé = beaucoup de mots courants = prévisible = IA.
 * weight=0.15 — identique au SCORE_WEIGHTS.perplexity existant.
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const MULTIPLIER = 1.8;

const COMMON_WORDS = new Set([
  "le", "la", "les", "de", "des", "un", "une", "et", "à", "en", "que", "qui",
  "dans", "pour", "est", "ce", "il", "elle", "the", "of", "and", "to", "in", "is", "a",
]);

export const perplexityModule: AnalysisModule = {
  id: "perplexity",
  label: "Perplexité",
  weight: 0.15,

  execute(_text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { words } = ctx;
    if (words.length === 0) return { score: 0 };

    const commonCount = words.filter((w) => COMMON_WORDS.has(w)).length;
    const commonRatio = (commonCount / Math.max(1, words.length)) * 100;
    const score = clamp(commonRatio * MULTIPLIER);

    return {
      score,
      data: {
        commonCount,
        commonRatio: Math.round(commonRatio * 100) / 100,
      },
    };
  },
};