/**
 * Module Personalization (AWPA — Personnalisation)
 *
 * Mesure la présence de marques de personnalisation.
 * Sprint 5 : weight + multiplier → LIC
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";
import { clampScore as clamp } from "./utils";
import { knowledge } from "./knowledge/registry";


const MARKERS = [
  // Références concrètes (noms propres, lieux, organisations)
  /(?<=\s)[A-ZÀ-Ý][a-zà-ÿ]{2,}/g,
  // Chiffres et pourcentages
  /\d+(?:\s*%|\s*(?:euros|dollars|€|\$|ans|mois|jours|heures|personnes|étudiants|employés|utilisateurs))/gi,
  // Marques d'expérience personnelle
  /\b(nous avons|j'ai|notre (équipe|équipe|étude|analyse|laboratoire|expérience|recherche)|dans (notre|mon|ma) (cas|étude|analyse|expérience|travail))\b/gi,
  // Exemples introduits par « par exemple », « comme »
  /\b(par exemple|tel que|notamment|parmi (lesquel|lesquell)les?|comme (le|la|l'|les))\b/gi,
  // Citations ou références
  /(?:selon|d'après|comme le (dit|montre|souligne))\s+[\wÀ-Ý]/gi,
];

export const personalizationModule: AnalysisModule = {
  id: "personalization",
  label: "Personnalisation",
  weight: knowledge.weight("personalization"),

  execute(text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { sentences } = ctx;
    if (sentences.length === 0) return { score: 0 };

    const multiplier = knowledge.multiplier("personalization");

    let totalHits = 0;
    for (const marker of MARKERS) {
      totalHits += (text.match(marker) || []).length;
    }

    const density = sentences.length > 0 ? totalHits / sentences.length : 0;
    // Score inversé : peu de personnalisation = score IA élevé
    const score = clamp(100 - density * multiplier);

    return {
      score,
      data: {
        totalHits,
        density: Math.round(density * 1000) / 1000,
      },
    };
  },
};