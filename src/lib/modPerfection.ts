/**
 * Module Perfection (AWPA — Absence d'oralité)
 *
 * Détecte l'absence de marques d'oralité (informalités, ellipses).
 * L'IA produit un style trop lisse, sans imperfections humaines.
 *
 * Sprint 5 : magic numbers → LIC
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";
import { knowledge } from "./knowledge/registry";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const INFORMAL_FR = /\b(bah|ben|du coup|genre|truc|ouais|franchement|carrément)\b/gi;
const ELLIPSIS_RE = /\.\.\.|…/g;

export const perfectionModule: AnalysisModule = {
  id: "perfection",
  label: "Perfection (oralité)",
  weight: knowledge.weight("perfection"),

  execute(text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { sentences } = ctx;
    if (sentences.length === 0) return { score: 0 };

    const multiplier = knowledge.multiplier("perfection");

    const informalMarkers = (text.match(INFORMAL_FR) || []).length;
    const ellipsis = (text.match(ELLIPSIS_RE) || []).length;
    const informalDensity = (informalMarkers + ellipsis) / Math.max(1, sentences.length);
    const score = clamp(100 - informalDensity * multiplier);

    return {
      score,
      data: {
        informalCount: informalMarkers,
        ellipsisCount: ellipsis,
        density: Math.round(informalDensity * 1000) / 1000,
      },
    };
  },
};