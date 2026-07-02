/**
 * Module Paraphrase (AWPA — Paraphrase IA)
 *
 * Détecte les paraphrases artificielles :
 * synonymes forcés, changements de registre inutiles,
 * phrases plus complexes sans gain d'information.
 *
 * Sprint 5 : magic numbers → LIC
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";
import { knowledge } from "./knowledge/registry";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const PARAPHRASE_SIGNALS = [
  // Nominalisations (verbe → nom abstrait)
  /\b(la mise en œuvre|la mise en place|la prise en charge|la mise en œuvre|la gestion de|le traitement de|l'optimisation de|l'amélioration de)\b/gi,
  // Verbes faibles + compléments abstraits
  /\b(contribuer à|permettre de|viser à|tendre à|avoir pour (but|objectif|vocation))\s+(l'|la|le|les|une|un|d'|des)\b/gi,
  // Formules de reformulation
  /\b(autrement dit|en d'autres termes|c'est-à-dire|en d'autres mots|pour le dire autrement)\b/gi,
];

export const paraphraseModule: AnalysisModule = {
  id: "paraphrase",
  label: "Paraphrase IA",
  weight: knowledge.weight("paraphrase"),

  execute(text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { sentences } = ctx;
    if (sentences.length === 0) return { score: 0 };

    const multiplier = knowledge.multiplier("paraphrase");

    let signalCount = 0;
    for (const sig of PARAPHRASE_SIGNALS) {
      signalCount += (text.match(sig) || []).length;
    }

    const density = signalCount / sentences.length;
    const score = clamp(density * multiplier);

    return {
      score,
      data: {
        signalCount,
        density: Math.round(density * 1000) / 1000,
      },
    };
  },
};