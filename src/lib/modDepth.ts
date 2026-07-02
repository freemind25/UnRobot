/**
 * Module Depth (AWPA — Profondeur / détails concrets)
 *
 * Mesure la densité de détails concrets : chiffres et noms propres.
 * L'IA produit des textes avec peu de données factuelles.
 *
 * Score élevé = peu de détails concrets = IA.
 * weight=0.05 — identique au SCORE_WEIGHTS.depth existant.
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const MULTIPLIER = 900;

const DIGIT_RE = /\d/g;
const PROPER_NOUN_RE = /(?<=\s)[A-ZÀ-Ý][a-zà-ÿ]{2,}/g;

export const depthModule: AnalysisModule = {
  id: "depth",
  label: "Profondeur",
  weight: 0.05,

  execute(text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { words } = ctx;
    if (words.length === 0) return { score: 0 };

    const digits = (text.match(DIGIT_RE) || []).length;
    const properNouns = (text.match(PROPER_NOUN_RE) || []).length;
    const concreteDensity = (digits + properNouns) / Math.max(1, words.length);
    const score = clamp(100 - concreteDensity * MULTIPLIER);

    return {
      score,
      data: {
        digitCount: digits,
        properNounCount: properNouns,
        concreteDensity: Math.round(concreteDensity * 1000) / 1000,
      },
    };
  },
};