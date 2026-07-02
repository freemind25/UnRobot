/**
 * Moteur d'analyse IA — 100% local, sans dépendance React ni réseau.
 * Source unique de vérité partagée entre le hook UI, le worker et les tests.
 *
 * Ce fichier est l'orchestrateur : il construit le contexte, appelle les modules,
 * exécute le pattern engine, calcule le score composite + SUCKS,
 * et retourne le résultat complet.
 */
import { splitSentences } from "./utils";
import { detectHumanization, type HumanizationDetectionResult, type TextClassification } from "./humanizationDetector";
import { runModule, type AnalysisContext } from "./analysisRegistry";
import { AI_PATTERNS, type PatternDef } from "./patterns";
import { AI_PHRASES } from "./aiPhrases";
import { WEIGHTED_CONNECTORS } from "./connectors";
import { runPatternEngine } from "./patternEngine";
import { SCORE_WEIGHTS, SUCKS_CONFIG } from "./coreConfig";

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
export const MIN_ANALYSIS_LENGTH = 50;

// ── Helpers ───────────────────────────────────────────────────────────

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

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
  if (burstinessScore > 70) details.push({ category: "Burstiness", issue: "Longueur de phrases trop uniforme (typique de l'IA)", severity: "high" });

  const vocabResult = runModule("vocabulary", text, ctx);
  const vocabularyScore = vocabResult?.score ?? 0;
  const ttr = (vocabResult?.data?.ttr as number) ?? 0;
  if (ttr > 0 && ttr < 40) details.push({ category: "Vocabulaire", issue: "Diversité lexicale faible, vocabulaire répétitif", severity: "medium" });

  const transResult = runModule("transition", text, ctx);
  const transitionScore = transResult?.score ?? 0;
  if (transitionScore > 45) {
    const transFound: string[] = JSON.parse((transResult?.data?.transFoundJson as string) ?? "[]");
    details.push({ category: "Transitions", issue: "Connecteurs logiques trop fréquents", severity: "medium", examples: transFound.slice(0, 6) });
  }

  const perfectionResult = runModule("perfection", text, ctx);
  const perfectionScore = perfectionResult?.score ?? 0;
  if (perfectionScore > 80) details.push({ category: "Perfection", issue: "Style trop lisse, aucune marque d'oralité", severity: "low" });

  const voiceResult = runModule("voice", text, ctx);
  const voiceScore = voiceResult?.score ?? 0;
  if (voiceScore > 40) {
    const voiceFound: string[] = JSON.parse((voiceResult?.data?.foundJson as string) ?? "[]");
    details.push({ category: "Voix générique", issue: "Formulations passe-partout caractéristiques de l'IA", severity: "high", examples: voiceFound.slice(0, 6) });
  }

  const perplexityScore = (runModule("perplexity", text, ctx))?.score ?? 0;

  const depthResult = runModule("depth", text, ctx);
  const depthScore = depthResult?.score ?? 0;
  const digits = (depthResult?.data?.digitCount as number) ?? 0;
  const properNouns = (depthResult?.data?.properNounCount as number) ?? 0;
  if (depthScore > 85) details.push({ category: "Profondeur", issue: "Peu de détails concrets (chiffres, noms, exemples)", severity: "low" });

  const structureScore = (runModule("structure", text, ctx))?.score ?? 0;
  if (structureScore > 50) details.push({ category: "Structure IA", issue: "Structure trop parfaite, symétrie excessive ou énumération rigide", severity: "high" });
  else if (structureScore > 25) details.push({ category: "Structure IA", issue: "Certaines marques de structure artificielle détectées", severity: "medium" });

  const repResult = runModule("semanticRepetition", text, ctx);
  const semanticRepetitionScore = repResult?.score ?? 0;
  const semRepetitionPairs = (repResult?.data?.pairs as number) ?? 0;
  if (semRepetitionPairs > 0) details.push({ category: "Répétition sémantique", issue: `${semRepetitionPairs} paire(s) de phrases consécutives avec contenu trop similaire`, severity: semRepetitionPairs > 2 ? "high" : "medium" });

  const personalizationScore = (runModule("personalization", text, ctx))?.score ?? 0;
  if (personalizationScore > 80) details.push({ category: "Personnalisation", issue: "Absence de marques de personnalisation", severity: "high" });
  else if (personalizationScore > 60) details.push({ category: "Personnalisation", issue: "Peu de marques de personnalisation détectées", severity: "medium" });

  const paraphraseScore = (runModule("paraphrase", text, ctx))?.score ?? 0;
  if (paraphraseScore > 50) details.push({ category: "Paraphrase IA", issue: "Reformulations artificielles détectées", severity: "high" });
  else if (paraphraseScore > 25) details.push({ category: "Paraphrase IA", issue: "Quelques signaux de paraphrase artificielle", severity: "low" });

  const styleResult = runModule("style", text, ctx);
  const styleScore = styleResult?.score ?? 0;
  const styleFingerprint: StyleFingerprint = JSON.parse((styleResult?.data?.fingerprint as string) ?? "{}");

  const paragraphBalanceScore = (runModule("paragraphBalance", text, ctx))?.score ?? 0;
  if (paragraphBalanceScore > 60) details.push({ category: "Équilibre paragraphes", issue: "Paragraphes de taille trop uniforme (symétrie suspecte)", severity: paragraphBalanceScore > 80 ? "high" : "medium" });

  const entropyScore = (runModule("entropy", text, ctx))?.score ?? 0;
  const compressionRatioScore = (runModule("compressionRatio", text, ctx))?.score ?? 0;
  const zipfScore = (runModule("zipf", text, ctx))?.score ?? 0;
  const passiveVoiceScore = (runModule("passiveVoice", text, ctx))?.score ?? 0;

  // ── Pattern Engine ────────────────────────────────────────────────
  const { patternCount, patternPoints, patternHits, details: patternDetails } = runPatternEngine(text, sentences);
  details.push(...patternDetails);

  // ── Score composite ───────────────────────────────────────────────
  const W = SCORE_WEIGHTS;
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

  const score = clamp(weightedSubScores + Math.min(W.maxPatternPoints, patternPoints));
  const humanizationScore = clamp(100 - score);

  // ── Score SUCKS ───────────────────────────────────────────────────
  const S = SUCKS_CONFIG;
  const specific = clamp(100 - depthScore * S.specific.weight + (digits + properNouns > S.specific.threshold ? S.specific.bonus : 0));
  const unique = clamp(100 - voiceScore * S.unique.weight - (patternHits[S.unique.flag] ? S.unique.penalty : 0));
  const clear = clamp(100 - transitionScore * S.clear.weight - (patternHits[S.clear.flag] ? S.clear.penalty : 0));
  const simple = clamp(100 - vocabularyScore * S.simple.weight - (avgLength > S.simple.avgLengthThreshold ? S.simple.penalty : 0));
  const sticky = clamp(100 - perfectionScore * S.sticky.weight - (patternHits[S.sticky.flag] ? S.sticky.penalty : 0));
  const sucksScore = clamp((specific + unique + clear + simple + sticky) / 5);

  // ── Checklist ──────────────────────────────────────────────────────
  const checklist: ChecklistItem[] = [
    { label: "Aucune construction corrélative", passed: !patternHits["Construction corrélative"] },
    { label: "Pas de langage hésitant", passed: !patternHits["Langage hésitant"] },
    { label: "Pas de voix passive", passed: !patternHits["Voix passive"] },
    { label: "Pas de phrases rhétoriques interdites", passed: !patternHits["Phrases rhétoriques interdites"] },
    { label: "Score SUCKS > 70", passed: sucksScore > 70 },
    { label: "Variété de longueur des phrases", passed: burstinessScore < 70 },
    { label: "Pas de répétition sémantique", passed: semanticRepetitionScore < 30 },
    { label: "Personnalisation présente", passed: personalizationScore < 70 },
    { label: "Structure naturelle", passed: structureScore < 40 },
  ];

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