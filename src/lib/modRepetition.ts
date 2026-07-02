/**
 * Module Repetition (AWPA — Répétition sémantique)
 *
 * Détecte la répétition sémantique entre phrases consécutives
 * via le chevauchement de bigrammes (proxy local, pas d'embeddings).
 *
 * Extrait de textAnalysis.ts : fonction detectSemanticRepetition() (lignes 885-908)
 * et son appel dans analyzeText() (lignes 1197-1202).
 * Produit un résultat identique au semanticRepetitionScore original.
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";

const WORD_RE = /\b[\wàâäéèêëîïôöùûüç]+\b/gi;
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Détecte la répétition sémantique entre phrases consécutives.
 * Retourne un ratio 0-1 et le nombre de paires suspectes.
 */
function detectSemanticRepetition(sentences: string[]): { ratio: number; pairs: number } {
  if (sentences.length < 2) return { ratio: 0, pairs: 0 };
  let suspiciousPairs = 0;

  for (let i = 1; i < sentences.length; i++) {
    const a = (sentences[i - 1].toLowerCase().match(WORD_RE) || []);
    const b = (sentences[i].toLowerCase().match(WORD_RE) || []);
    if (a.length < 3 || b.length < 3) continue;

    const bigramsA = new Set<string>();
    const bigramsB = new Set<string>();
    for (let j = 0; j < a.length - 1; j++) bigramsA.add(`${a[j]}|${a[j + 1]}`);
    for (let j = 0; j < b.length - 1; j++) bigramsB.add(`${b[j]}|${b[j + 1]}`);

    const intersection = [...bigramsA].filter((bg) => bigramsB.has(bg)).length;
    const union = new Set([...bigramsA, ...bigramsB]).size;
    const similarity = union > 0 ? intersection / union : 0;

    if (similarity > 0.4) suspiciousPairs++;
  }

  return { ratio: sentences.length > 1 ? suspiciousPairs / (sentences.length - 1) : 0, pairs: suspiciousPairs };
}

export const repetitionModule: AnalysisModule = {
  id: "semanticRepetition",
  label: "Répétition sémantique",
  weight: 0.05,

  execute(_text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { sentences } = ctx;
    const { ratio, pairs } = detectSemanticRepetition(sentences);
    const score = clamp(ratio * 500); // MULTIPLIERS.semanticRepetition = 500

    return {
      score,
      data: { ratio: Math.round(ratio * 1000) / 1000, pairs },
    };
  },
};