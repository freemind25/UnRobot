/**
 * Moteur d'analyse IA — 100% local, sans dépendance React ni réseau.
 * Source unique de vérité partagée entre le hook UI, le worker et les tests.
 *
 * Ce fichier est l'orchestrateur : il construit le contexte, appelle les modules,
 * exécute le pattern engine, calcule le score composite + SUCKS,
 * et retourne le résultat complet.
 *
 * Sprint 5 PR2 : détails, checklist, SUCKS pilotés par le LIC.
 */

import { splitSentences } from "./utils";
import { detectHumanization, type HumanizationDetectionResult, type TextClassification } from "./humanizationDetector";
import { runModule, type AnalysisContext } from "./analysisRegistry";
import { AI_PATTERNS, type PatternDef } from "./patterns";
import { AI_PHRASES } from "./aiPhrases";
import { WEIGHTED_CONNECTORS } from "./connectors";
import { runPatternEngine } from "./patternEngine";
import { knowledge } from "./knowledge/registry";

// ── Ré-exports pour compatibilité ────────────────────────────────────
export type { PatternDef } from "./patterns";
export { AI_PATTERNS } from "./patterns";
export { AI_PHRASES } from "./aiPhrases";
export { WEIGHTED_CONNECTORS } from "./connectors";

// ── Types publics ─────────────────────────────────────────────────────

export interface StyleFingerprint {
  sentenceLength: number;
  vocabularyDensity: number;
  connectorRate: number;
  repetitionRate: number;
  complexity: number;
  personalMarkers: number;
}

export interface AIAnalysisResult {
  score: number;
  perplexityScore: number;
  burstinessScore: number;
  transitionScore: number;
  perfectionScore: number;
  voiceScore: number;
  vocabularyScore: number;
  depthScore: number;
  structureScore: number;
  semanticRepetitionScore: number;
  personalizationScore: number;
  paraphraseScore: number;
  styleScore: number;
  paragraphBalanceScore: number;
  entropyScore: number;
  compressionRatioScore: number;
  zipfScore: number;
  passiveVoiceScore: number;
  humanizationScore: number;
  sucksScore: number;
  patternCount: number;
  checklist: ChecklistItem[];
  details: AnalysisDetail[];
  styleFingerprint: StyleFingerprint;
  /* ── Modules 11-12 : Humanization Detection ── */
  classification: TextClassification;
  classificationLabel: string;
  humanizationDetection: HumanizationDetectionResult | null;
}

export interface AnalysisDetail {
  category: string;
  issue: string;
  severity: Severity;
  examples?: string[];
  suggestions?: string[];
}

export interface ChecklistItem {
  label: string;
  passed: boolean;
}

export type Severity = "low" | "medium" | "high";

/** Longueur minimale (caractères) pour lancer une analyse significative. */
export const MIN_ANALYSIS_LENGTH = knowledge.global().minAnalysisLength;

// ── Helpers ───────────────────────────────────────────────────────────

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Évalue les règles de détails LIC pour une métrique donnée.
 * Remplace les `if (score > X)` codés en dur.
 */
function evaluateDetails(
  metricId: string,
  score: number,
  data?: Record<string, number | string | boolean>,
): AnalysisDetail[] {
  const rules = knowledge.details(metricId);
  const results: AnalysisDetail[] = [];
  const maxEx = knowledge.global().maxExamples;

  for (const rule of rules) {
    const ctype = rule.conditionType ?? "score";
    let triggered = false;
    let severity = rule.severity;
    let issue = rule.issue;

    if (ctype === "score") {
      triggered = score >= rule.minScore;
    } else if (ctype === "dataBelow") {
      const val = Number(data?.[rule.conditionField ?? ""] ?? 0);
      triggered = val > 0 && val < rule.minScore;
    } else if (ctype === "dataAbove") {
      const val = Number(data?.[rule.conditionField ?? ""] ?? 0);
      if (val > 0) {
        triggered = true;
        if (rule.highThreshold !== undefined && val > rule.highThreshold) {
          severity = "high";
        }
      }
    }

    if (!triggered) continue;

    // Issue dynamique pour la répétition sémantique
    if (!issue && rule.conditionField === "pairs") {
      const pairs = Number(data?.["pairs"] ?? 0);
      issue = `${pairs} paire(s) de phrases consécutives avec contenu trop similaire`;
    }

    const detail: AnalysisDetail = { category: rule.category, issue, severity };

    if (rule.examplesDataKey && data?.[rule.examplesDataKey]) {
      detail.examples = JSON.parse(String(data[rule.examplesDataKey])).slice(0, rule.maxExamples ?? maxEx);
    }

    results.push(detail);
  }

  return results;
}

// ── Orchestrateur principal ──────────────────────────────────────────

/** Analyse complète d'un texte. Pure, déterministe (hors aléatoire : aucun). */
export function analyzeText(text: string): AIAnalysisResult {
  if (!text || text.length < MIN_ANALYSIS_LENGTH) {
    const emptyFingerprint: StyleFingerprint = { sentenceLength: 0, vocabularyDensity: 0, connectorRate: 0, repetitionRate: 0, complexity: 0, personalMarkers: 0 };
    return {
      score: 0,
      perplexityScore: 0,
      burstinessScore: 0,
      transitionScore: 0,
      perfectionScore: 0,
      voiceScore: 0,
      vocabularyScore: 0,
      depthScore: 0,
      structureScore: 0,
      semanticRepetitionScore: 0,
      personalizationScore: 0,
      paraphraseScore: 0,
      styleScore: 0,
      paragraphBalanceScore: 0,
      entropyScore: 0,
      compressionRatioScore: 0,
      zipfScore: 0,
      passiveVoiceScore: 0,
      humanizationScore: 100,
      sucksScore: 0,
      patternCount: 0,
      checklist: [],
      details: [],
      styleFingerprint: emptyFingerprint,
      classification: "human",
      classificationLabel: "Texte trop court pour l'analyse",
      humanizationDetection: null,
    };
  }

  // ── Contexte partagé ──────────────────────────────────────────────
  const sentences = splitSentences(text);
  const words = text.toLowerCase().match(/\b[\wàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]+\b/gi) || [];
  const sentenceLengths = sentences.map((s) => s.trim().split(/\s+/).length);
  const wordFreq = new Map<string, number>();
  for (const w of words) wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
  const uniqueWords = new Set(words);
  const ctx: AnalysisContext = { sentences, words, sentenceLengths, wordFreq, uniqueWords, textLength: text.length };

  // ── Modules d'analyse ─────────────────────────────────────────────
  const details: AnalysisDetail[] = [];

  const burstinessResult = runModule("burstiness", text, ctx);
  const burstinessScore = burstinessResult?.score ?? 0;
  const avgLength = (burstinessResult?.data?.avgLength as number) ?? 0;
  details.push(...evaluateDetails("burstiness", burstinessScore));

  const vocabResult = runModule("vocabulary", text, ctx);
  const vocabularyScore = vocabResult?.score ?? 0;
  details.push(...evaluateDetails("vocabulary", vocabularyScore, vocabResult?.data));

  const transResult = runModule("transition", text, ctx);
  const transitionScore = transResult?.score ?? 0;
  details.push(...evaluateDetails("transition", transitionScore, transResult?.data));

  const perfectionResult = runModule("perfection", text, ctx);
  const perfectionScore = perfectionResult?.score ?? 0;
  details.push(...evaluateDetails("perfection", perfectionScore));

  const voiceResult = runModule("voice", text, ctx);
  const voiceScore = voiceResult?.score ?? 0;
  details.push(...evaluateDetails("voice", voiceScore, voiceResult?.data));

  const perplexityResult = runModule("perplexity", text, ctx);
  const perplexityScore = perplexityResult?.score ?? 0;

  const depthResult = runModule("depth", text, ctx);
  const depthScore = depthResult?.score ?? 0;
  const digits = (depthResult?.data?.digitCount as number) ?? 0;
  const properNouns = (depthResult?.data?.properNounCount as number) ?? 0;
  details.push(...evaluateDetails("depth", depthScore));

  const structureResult = runModule("structure", text, ctx);
  const structureScore = structureResult?.score ?? 0;
  details.push(...evaluateDetails("structure", structureScore));

  const repResult = runModule("semanticRepetition", text, ctx);
  const semanticRepetitionScore = repResult?.score ?? 0;
  details.push(...evaluateDetails("semanticRepetition", semanticRepetitionScore, repResult?.data));

  const personalizationResult = runModule("personalization", text, ctx);
  const personalizationScore = personalizationResult?.score ?? 0;
  details.push(...evaluateDetails("personalization", personalizationScore));

  const paraphraseResult = runModule("paraphrase", text, ctx);
  const paraphraseScore = paraphraseResult?.score ?? 0;
  details.push(...evaluateDetails("paraphrase", paraphraseScore));

  const styleResult = runModule("style", text, ctx);
  const styleScore = styleResult?.score ?? 0;
  const styleFingerprint: StyleFingerprint = JSON.parse((styleResult?.data?.fingerprint as string) ?? "{}");

  const paragraphBalanceResult = runModule("paragraphBalance", text, ctx);
  const paragraphBalanceScore = paragraphBalanceResult?.score ?? 0;
  details.push(...evaluateDetails("paragraphBalance", paragraphBalanceScore));

  const entropyScore = (runModule("entropy", text, ctx))?.score ?? 0;
  const compressionRatioScore = (runModule("compressionRatio", text, ctx))?.score ?? 0;
  const zipfScore = (runModule("zipf", text, ctx))?.score ?? 0;
  const passiveVoiceScore = (runModule("passiveVoice", text, ctx))?.score ?? 0;

  // ── Pattern Engine ────────────────────────────────────────────────
  const { patternCount, patternPoints, patternHits, details: patternDetails } = runPatternEngine(text, sentences);
  details.push(...patternDetails);

  // ── Score composite (poids via LIC) ────────────────────────────────
  const W = knowledge.compositeWeights();
  const weightedSubScores =
    burstinessScore * W.burstiness +
    transitionScore * W.transition +
    perfectionScore * W.perfection +
    voiceScore * W.voice +
    perplexityScore * W.perplexity +
    vocabularyScore * W.vocabulary +
    depthScore * W.depth +
    structureScore * W.structure +
    semanticRepetitionScore * W.semanticRepetition +
    personalizationScore * W.personalization +
    paraphraseScore * W.paraphrase +
    styleScore * W.style;

  const maxPP = knowledge.global().maxPatternPoints;
  const score = clamp(weightedSubScores + Math.min(maxPP, patternPoints));
  const humanizationScore = clamp(100 - score);

  // ── Score SUCKS (config via LIC) ───────────────────────────────────
  const S = knowledge.global().sucks;
  const specific = clamp(100 - depthScore * S.specific.weight + (digits + properNouns > S.specific.threshold ? S.specific.bonus : 0));
  const unique = clamp(100 - voiceScore * S.unique.weight - (patternHits[S.unique.flag ?? ""] ? S.unique.penalty : 0));
  const clear = clamp(100 - transitionScore * S.clear.weight - (patternHits[S.clear.flag ?? ""] ? S.clear.penalty : 0));
  const simple = clamp(100 - vocabularyScore * S.simple.weight - (avgLength > S.simple.avgLengthThreshold! ? S.simple.penalty : 0));
  const sticky = clamp(100 - perfectionScore * S.sticky.weight - (patternHits[S.sticky.flag ?? ""] ? S.sticky.penalty : 0));
  const sucksScore = clamp((specific + unique + clear + simple + sticky) / 5);

  // ── Checklist (règles via LIC) ──────────────────────────────────────
  const scoreMap: Record<string, number> = {
    burstiness: burstinessScore,
    vocabulary: vocabularyScore,
    transition: transitionScore,
    perfection: perfectionScore,
    voice: voiceScore,
    perplexity: perplexityScore,
    depth: depthScore,
    structure: structureScore,
    semanticRepetition: semanticRepetitionScore,
    personalization: personalizationScore,
    paraphrase: paraphraseScore,
    style: styleScore,
    sucks: sucksScore,
  };

  const checklist: ChecklistItem[] = knowledge.checklist().map((rule) => {
    if (rule.type === "pattern") {
      return { label: rule.label, passed: !patternHits[rule.patternFlag ?? ""] };
    }
    const val = scoreMap[rule.scoreMetric ?? ""];
    if (rule.comparison === ">") return { label: rule.label, passed: val > (rule.value ?? 0) };
    return { label: rule.label, passed: val < (rule.value ?? 0) };
  });

  // ── Humanization Detection ─────────────────────────────────────────
  const humanizationDetection = detectHumanization(text, score);

  return {
    score,
    perplexityScore,
    burstinessScore,
    transitionScore,
    perfectionScore,
    voiceScore,
    vocabularyScore,
    depthScore,
    structureScore,
    semanticRepetitionScore,
    personalizationScore,
    paraphraseScore,
    styleScore,
    paragraphBalanceScore,
    entropyScore,
    compressionRatioScore,
    zipfScore,
    passiveVoiceScore,
    humanizationScore,
    sucksScore,
    patternCount,
    checklist,
    details,
    styleFingerprint,
    classification: humanizationDetection.classification,
    classificationLabel: humanizationDetection.classificationLabel,
    humanizationDetection,
  };
}