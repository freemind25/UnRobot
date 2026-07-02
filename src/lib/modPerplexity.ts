/**
 * Module Perplexity (AWPA — Prévisibilité lexicale)
 *
 * Approxime la perplexité par le ratio de mots très courants.
 * Sprint 5 : weight + multiplier → LIC
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";
import { knowledge } from "./knowledge/registry";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const COMMON_WORDS = new Set([
  "le", "la", "les", "de", "des", "un", "une", "et", "à", "en", "que", "qui",
  "dans", "pour", "est", "ce", "il", "elle", "the", "of", "and", "to", "in", "is", "a",
]);

export const perplexityModule: AnalysisModule = {
  id: "perplexity",
  label: "Perplexité",
  weight: knowledge.weight("perplexity"),

  execute(_text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { words } = ctx;
    if (words.length === 0) return { score: 0 };

    const multiplier = knowledge.multiplier("perplexity");

    const commonCount = words.filter((w) => COMMON_WORDS.has(w)).length;
    const commonRatio = (commonCount / Math.max(1, words.length)) * 100;
    const score = clamp(commonRatio * multiplier);

    return {
      score,
      data: {
        commonCount,
        commonRatio: Math.round(commonRatio * 100) / 100,
      },
    };
  },
};