/**
 * Pattern Engine — Anti-AI Writing Engine.
 *
 * Exécute les patterns regex (AI_PATTERNS) et la détection staccato.
 * Extrait de textAnalysis.ts (Sprint 4 PR4).
 */

import type { Severity, AnalysisDetail } from "./textAnalysis";
import { AI_PATTERNS } from "./patterns";

export interface PatternEngineResult {
  patternCount: number;
  patternPoints: number;
  patternHits: Record<string, boolean>;
  details: AnalysisDetail[];
}

/** Détection de phrasé staccato : 3+ phrases consécutives de moins de 5 mots. */
const detectStaccato = (sentences: string[]): number => {
  let run = 0;
  let hits = 0;
  sentences.forEach((s) => {
    const len = s.trim().split(/\s+/).filter(Boolean).length;
    if (len > 0 && len < 5) {
      run += 1;
      if (run === 3) hits += 1;
    } else {
      run = 0;
    }
  });
  return hits;
};

/**
 * Exécute l'Anti-AI Writing Engine sur le texte.
 * Parcourt tous les patterns regex et ajoute les détails trouvés.
 */
export function runPatternEngine(
  text: string,
  sentences: string[],
): PatternEngineResult {
  let patternCount = 0;
  let patternPoints = 0;
  const patternHits: Record<string, boolean> = {};
  const details: AnalysisDetail[] = [];

  AI_PATTERNS.forEach((p) => {
    const matches = text.match(p.regex) || [];
    if (matches.length === 0) return;
    patternHits[p.category] = true;
    patternCount += matches.length;
    patternPoints += matches.length * p.points;
    const examples = Array.from(new Set(matches.map((m) => m.trim()))).slice(0, 5);
    details.push({
      category: p.category,
      issue: p.issue,
      severity: p.severity,
      examples,
      suggestions: [p.suggestion],
    });
  });

  const staccatoHits = detectStaccato(sentences);
  if (staccatoHits > 0) {
    patternCount += staccatoHits;
    patternPoints += staccatoHits * 5;
    patternHits["Phrasé staccato"] = true;
    details.push({
      category: "Phrasé staccato",
      issue: "Suite de fragments courts et dramatiques (« No fluff. No filler. »).",
      severity: "medium",
      suggestions: ["Combinez les fragments en phrases complètes."],
    });
  }

  return { patternCount, patternPoints, patternHits, details };
}