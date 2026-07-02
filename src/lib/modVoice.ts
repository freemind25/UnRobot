/**
 * Module Voice (AWPA — Voix générique LLM)
 *
 * Détecte les formules passe-partout caractéristiques des LLM.
 * L'IA surutilise des phrases génériques comme
 * "il est important de", "delve into", etc.
 *
 * Sprint 5 : magic numbers → LIC
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";
import { clampScore as clamp } from "./utils";
import { knowledge } from "./knowledge/registry";


const GENERIC_PHRASES = [
  "il est important de", "il convient de", "dans le monde de", "à l'ère du",
  "en conclusion", "pour conclure", "force est de constater", "il est essentiel",
  "in today's world", "it is important to", "plays a crucial role", "in conclusion",
  "delve into", "a testament to",
];

export const voiceModule: AnalysisModule = {
  id: "voice",
  label: "Voix générique",
  weight: knowledge.weight("voice"),

  execute(text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { sentences } = ctx;
    if (sentences.length === 0) return { score: 0 };

    const multiplier = knowledge.multiplier("voice");

    let genericCount = 0;
    const genericFound: string[] = [];
    for (const p of GENERIC_PHRASES) {
      const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const matches = text.match(re) || [];
      if (matches.length) {
        genericFound.push(p);
        genericCount += matches.length;
      }
    }

    const score = clamp((genericCount / Math.max(1, sentences.length)) * multiplier);

    return {
      score,
      data: {
        genericCount,
        foundCount: genericFound.length,
        foundJson: JSON.stringify(genericFound),
      },
    };
  },
};