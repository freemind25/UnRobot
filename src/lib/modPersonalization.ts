/**
 * Module Personalization (AWPA — Personnalisation)
 *
 * Mesure la présence de marques de personnalisation :
 * exemples précis, contexte, expérience, références concrètes.
 *
 * Score élevé = peu de personnalisation = IA.
 * weight=0.05 — identique au SCORE_WEIGHTS.personalization existant.
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

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
  weight: 0.05,

  execute(text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { sentences } = ctx;
    if (sentences.length === 0) return { score: 0 };

    let totalHits = 0;
    for (const marker of MARKERS) {
      totalHits += (text.match(marker) || []).length;
    }

    const density = sentences.length > 0 ? totalHits / sentences.length : 0;
    // Score inversé : peu de personnalisation = score IA élevé
    const score = clamp(100 - density * 25);

    return {
      score,
      data: {
        totalHits,
        density: Math.round(density * 1000) / 1000,
      },
    };
  },
};