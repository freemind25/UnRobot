/**
 * Moteur d'analyse IA — 100% local, sans dépendance React ni réseau.
 * Source unique de vérité partagée entre le hook UI, le worker et les tests.
 */
import { splitSentences } from "./utils";
import { detectHumanization, type HumanizationDetectionResult, type TextClassification } from "./humanizationDetector";
import { runModule, type AnalysisContext } from "./analysisRegistry";
import { AI_PATTERNS, type PatternDef } from "./patterns";
import { AI_PHRASES } from "./aiPhrases";
import { WEIGHTED_CONNECTORS } from "./connectors";

export type { PatternDef } from "./patterns";
export { AI_PHRASES } from "./aiPhrases";
export { WEIGHTED_CONNECTORS } from "./connectors";

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

/**
 * AI_SCORE = (Perplexity + Burstiness + Style + Structure + Lexical + Semantic) / N
 * Formule multi-signaux conforme au module AWPA.
 */
const SCORE_WEIGHTS = {
  burstiness: 0.15,
  transition: 0.10,
  perfection: 0.05,
  voice: 0.10,
  perplexity: 0.15,
  vocabulary: 0.10,
  depth: 0.05,
  structure: 0.10,
  semanticRepetition: 0.05,
  personalization: 0.05,
  paraphrase: 0.05,
  style: 0.05,
  maxPatternPoints: 30,
} as const;


/** Pondérations et seuils du score SUCKS. */
const SUCKS_CONFIG = {
  specific:   { weight: 0.6, bonus: 25, threshold: 3, field: "depth" as const },
  unique:     { weight: 0.7, penalty: 25, flag: "Langage vague" as const, field: "voice" as const },
  clear:      { weight: 0.5, penalty: 25, flag: "Jargon corporate" as const, field: "transition" as const },
  simple:     { weight: 0.4, penalty: 25, avgLengthThreshold: 25, field: "vocabulary" as const },
  sticky:     { weight: 0.5, penalty: 20, flag: "Phrases rhétoriques interdites" as const, field: "perfection" as const },
} as const;

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// Détection de phrasé staccato : 3+ phrases consécutives de moins de 5 mots.
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

  const details: AnalysisDetail[] = [];
  const sentences = splitSentences(text);
  // Inclut les majuscules accentuées (À, É, È, Ô, etc.)
  const words = text.toLowerCase().match(/\b[\wàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]+\b/gi) || [];

  // Construction du contexte partagé pour les modules
  const sentenceLengths = sentences.map((s) => s.trim().split(/\s+/).length);
  const wordFreq = new Map<string, number>();
  for (const w of words) wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
  const uniqueWords = new Set(words);
  const ctx: AnalysisContext = {
    sentences, words, sentenceLengths, wordFreq, uniqueWords, textLength: text.length,
  };

  // 1. Burstiness — via module SentenceVariation
  const burstinessResult = runModule("burstiness", text, ctx);
  const burstinessScore = burstinessResult?.score ?? 0;
  const avgLength = (burstinessResult?.data?.avgLength as number) ?? 0;
  if (burstinessScore > 70) {
    details.push({ category: "Burstiness", issue: "Longueur de phrases trop uniforme (typique de l'IA)", severity: "high" });
  }

  // 2. Diversité lexicale — via module LexicalRichness
  const vocabResult = runModule("vocabulary", text, ctx);
  const vocabularyScore = vocabResult?.score ?? 0;
  const ttr = (vocabResult?.data?.ttr as number) ?? 0;
  if (ttr > 0 && ttr < 40) {
    details.push({ category: "Vocabulaire", issue: "Diversité lexicale faible, vocabulaire répétitif", severity: "medium" });
  }

  // 3. Transitions mécaniques — via module TransitionDensity
  const transResult = runModule("transition", text, ctx);
  const transitionScore = transResult?.score ?? 0;
  if (transitionScore > 45) {
    const transFound: string[] = JSON.parse((transResult?.data?.transFoundJson as string) ?? "[]");
    details.push({ category: "Transitions", issue: "Connecteurs logiques trop fréquents", severity: "medium", examples: transFound.slice(0, 6) });
  }

  // 4. Perfection (absence d'oralité) — via module Perfection
  const perfectionResult = runModule("perfection", text, ctx);
  const perfectionScore = perfectionResult?.score ?? 0;
  if (perfectionScore > 80) {
    details.push({ category: "Perfection", issue: "Style trop lisse, aucune marque d'oralité", severity: "low" });
  }

  // 5. Voix générique — via module Voice
  const voiceResult = runModule("voice", text, ctx);
  const voiceScore = voiceResult?.score ?? 0;
  if (voiceScore > 40) {
    const voiceFound: string[] = JSON.parse((voiceResult?.data?.foundJson as string) ?? "[]");
    details.push({ category: "Voix générique", issue: "Formulations passe-partout caractéristiques de l'IA", severity: "high", examples: voiceFound.slice(0, 6) });
  }

  // 6. Perplexité — via module Perplexity
  const perplexityResult = runModule("perplexity", text, ctx);
  const perplexityScore = perplexityResult?.score ?? 0;

  // 7. Profondeur — via module Depth
  const depthResult = runModule("depth", text, ctx);
  const depthScore = depthResult?.score ?? 0;
  const digits = (depthResult?.data?.digitCount as number) ?? 0;
  const properNouns = (depthResult?.data?.properNounCount as number) ?? 0;
  if (depthScore > 85) {
    details.push({ category: "Profondeur", issue: "Peu de détails concrets (chiffres, noms, exemples)", severity: "low" });
  }

  // ── NOUVEAUX MODULES AWPA ──────────────────────────────────────

  // Module 3 : Score de structure IA — via module Structure
  const structureResult = runModule("structure", text, ctx);
  const structureScore = structureResult?.score ?? 0;
  if (structureScore > 50) {
    details.push({ category: "Structure IA", issue: "Structure trop parfaite, symétrie excessive ou énumération rigide", severity: "high" });
  } else if (structureScore > 25) {
    details.push({ category: "Structure IA", issue: "Certaines marques de structure artificielle détectées", severity: "medium" });
  }

  // Module 6 : Répétition sémantique — via module Repetition
  const repResult = runModule("semanticRepetition", text, ctx);
  const semanticRepetitionScore = repResult?.score ?? 0;
  const semRepetitionPairs = (repResult?.data?.pairs as number) ?? 0;
  if (semRepetitionPairs > 0) {
    details.push({ category: "Répétition sémantique", issue: `${semRepetitionPairs} paire(s) de phrases consécutives avec contenu trop similaire (REPETITION_AI_PATTERN)`, severity: semRepetitionPairs > 2 ? "high" : "medium" });
  }

  // Module 7 : Personnalisation — via module Personalization
  const personalizationResult = runModule("personalization", text, ctx);
  const personalizationScore = personalizationResult?.score ?? 0;
  if (personalizationScore > 80) {
    details.push({ category: "Personnalisation", issue: "Absence de marques de personnalisation : pas d'exemples précis, de contexte, ni de références concrètes", severity: "high" });
  } else if (personalizationScore > 60) {
    details.push({ category: "Personnalisation", issue: "Peu de marques de personnalisation détectées", severity: "medium" });
  }

  // Module 8 : Paraphrase IA — via module Paraphrase
  const paraphraseResult = runModule("paraphrase", text, ctx);
  const paraphraseScore = paraphraseResult?.score ?? 0;
  if (paraphraseScore > 50) {
    details.push({ category: "Paraphrase IA", issue: "Reformulations artificielles détectées : synonymes forcés ou complexité sans gain d'information", severity: "high" });
  } else if (paraphraseScore > 25) {
    details.push({ category: "Paraphrase IA", issue: "Quelques signaux de paraphrase artificielle", severity: "low" });
  }

  // Module 9 : Style Fingerprint + Style Score — via module Style
  const styleResult = runModule("style", text, ctx);
  const styleScore = styleResult?.score ?? 0;
  const styleFingerprint: StyleFingerprint = JSON.parse((styleResult?.data?.fingerprint as string) ?? "{}");

  // ParagraphBalance — via module (NOUVEAU score, ne participe pas au score composite)
  const paraBalResult = runModule("paragraphBalance", text, ctx);
  const paragraphBalanceScore = paraBalResult?.score ?? 0;
  if (paragraphBalanceScore > 60) {
    details.push({ category: "Équilibre paragraphes", issue: "Paragraphes de taille trop uniforme (symétrie suspecte)", severity: paragraphBalanceScore > 80 ? "high" : "medium" });
  }

  // Sprint 2B — Entropy
  const entropyResult = runModule("entropy", text, ctx);
  const entropyScore = entropyResult?.score ?? 0;

  // Sprint 2B — CompressionRatio
  const compResult = runModule("compressionRatio", text, ctx);
  const compressionRatioScore = compResult?.score ?? 0;

  // Sprint 2B — Zipf
  const zipfResult = runModule("zipf", text, ctx);
  const zipfScore = zipfResult?.score ?? 0;

  // Sprint 2B — PassiveVoice
  const pvResult = runModule("passiveVoice", text, ctx);
  const passiveVoiceScore = pvResult?.score ?? 0;

  // 8. Anti-AI Writing Engine : motifs explicites + suggestions de réécriture
  let patternCount = 0;
  let patternPoints = 0;
  const patternHits: Record<string, boolean> = {};
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

  const W = SCORE_WEIGHTS;
  // AI_SCORE = moyenne multi-signaux conformément au module AWPA
  // (Perplexity + Burstiness + Style + Structure + Lexical + Semantic) / N
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

  // Score SUCKS (Specific, Unique, Clear, Simple, Sticky) — heuristique locale 0-100.
  const S = SUCKS_CONFIG;
  const specific = clamp(100 - depthScore * S.specific.weight + (digits + properNouns > S.specific.threshold ? S.specific.bonus : 0));
  const unique = clamp(100 - voiceScore * S.unique.weight - (patternHits[S.unique.flag] ? S.unique.penalty : 0));
  const clear = clamp(100 - transitionScore * S.clear.weight - (patternHits[S.clear.flag] ? S.clear.penalty : 0));
  const simple = clamp(100 - vocabularyScore * S.simple.weight - (avgLength > S.simple.avgLengthThreshold ? S.simple.penalty : 0));
  const sticky = clamp(100 - perfectionScore * S.sticky.weight - (patternHits[S.sticky.flag] ? S.sticky.penalty : 0));
  const sucksScore = clamp((specific + unique + clear + simple + sticky) / 5);

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

  // ── Modules 11-12 : Humanization Detection ──────────────────
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