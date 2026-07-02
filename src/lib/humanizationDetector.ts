/**
 * Module 11-12 : Humanization Detection — Analyse inversée des transformations IA.
 *
 * Détecte les signaux révélateurs d'un texte IA qui a été "humanisé"
 * par un outil de réécriture (QuillBot, Undetectable.AI, etc.).
 *
 * 12 scores avancés (modules 39-50 AWPA) + classification 4 classes.
 *
 * Sprint 6 PR2 : tous les seuils/poids/listes externalisés vers le LIC.
 */
import { splitSentences } from "./utils";
import { knowledge } from "./knowledge/registry";
import type { TextClassification } from "./knowledge/types";
export type { TextClassification };

export interface HumanizationDetectionResult {
  /** Score de probabilité que le texte ait été humanisé (0-100) */
  humanizationProbability: number;
  /** Classification en 4 classes */
  classification: TextClassification;
  /** Libellé lisible de la classification */
  classificationLabel: string;

  /* ── 12 scores avancés (modules 39-50) ── */
  /** #39 — Variation des structures syntaxiques (0-100, haut = suspect) */
  syntacticVariationScore: number;
  /** #40 — Diversité lexicale anormale (0-100, haut = suspect) */
  lexicalDiversityScore: number;
  /** #41 — Rythme des phrases trop régulier (0-100, haut = suspect) */
  sentenceRhythmScore: number;
  /** #42 — Variance des paragraphes (0-100, haut = suspect) */
  paragraphVarianceScore: number;
  /** #43 — Densité de phrases types IA (0-100, haut = suspect) */
  aiPhraseDensity: number;
  /** #44 — Surutilisation de connecteurs (0-100, haut = suspect) */
  connectorOveruseScore: number;
  /** #45 — Préservation sémantique après humanisation (0-100, haut = bon signe) */
  semanticPreservationScore: number;
  /** #46 — Variation de ton artificielle (0-100, haut = suspect) */
  toneVariationScore: number;
  /** #47 — Marqueurs personnels ajoutés artificiellement (0-100, haut = suspect) */
  personalMarkerScore: number;
  /** #48 — Nuances humaines (0-100, haut = bon signe) */
  humanNuanceScore: number;
  /** #49 — Randomisation de structure visible (0-100, haut = suspect) */
  structureRandomnessScore: number;
  /** #50 — Score global de probabilité d'humanisation (0-100, haut = humanisé) */
  humanizationLikelihood: number;
}

/* ── Helpers ────────────────────────────────────────────────── */

function clamp(v: number, min = 0, max = 100): number {
  return Math.round(Math.max(min, Math.min(max, v)));
}

function variance(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / arr.length;
}

function stdDev(arr: number[]): number {
  return Math.sqrt(variance(arr));
}

/** Compte les occurrences d'une liste de mots dans un texte. */
function countListMatches(text: string, list: string[], wordBoundary = true): number {
  let count = 0;
  for (const item of list) {
    const escaped = item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = wordBoundary ? `\\b${escaped}\\b` : escaped;
    const matches = text.match(new RegExp(pattern, "gi"));
    if (matches) count += matches.length;
  }
  return count;
}

/** Compare une valeur avec un opérateur (pour la classification). */
function cmp(val: number, op: string, target: number): boolean {
  switch (op) {
    case ">": return val > target;
    case "<": return val < target;
    case ">=": return val >= target;
    case "<=": return val <= target;
    default: return false;
  }
}

/* ── Fonctions de scoring individuelles ────────────────────── */

/**
 * #39 — Variation syntaxique.
 * Un humanizer tente de varier les structures, ce qui crée une distribution
 * anormalement uniforme (trop variée pour être naturelle).
 */
function computeSyntacticVariation(sentences: string[]): number {
  const cfg = knowledge.humanScore("syntacticVariation");
  if (sentences.length < cfg.minItems) return 0;

  const passiveCount = sentences.filter(s => /\b(être|été|est|sont|était|étaient)\s+\w+(é|ée|és|ées)/i.test(s)).length;
  const interrogativeCount = sentences.filter(s => /^\s*[a-zàâäéèêëîïôöùûüç]'|\?|est-ce que/i.test(s)).length;
  const imperativeCount = sentences.filter(s => /^\s*[a-zàâäéèêëîïôöùûüç]+(?:z|ons|ez)\b/i.test(s)).length;
  const infinitiveStart = sentences.filter(s => /^\s*(?:pour|avant|après|de|sans)\s+\w+(?:er|ir|re|oir)\b/i.test(s)).length;

  const structureTypes = [passiveCount, interrogativeCount, imperativeCount, infinitiveStart,
    sentences.length - passiveCount - interrogativeCount - imperativeCount];

  const total = sentences.length;
  let entropy = 0;
  for (const count of structureTypes) {
    if (count === 0) continue;
    const p = count / total;
    entropy -= p * Math.log2(p);
  }
  const maxEntropy = Math.log2(structureTypes.length);
  const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;

  return clamp((normalizedEntropy - cfg.thresholds.entropyBaseline) * cfg.params.multiplier);
}

/**
 * #40 — Diversité lexicale anormale.
 * Les humanizers injectent des synonymes, ce qui monte artificiellement le TTR.
 */
function computeLexicalDiversity(words: string[], uniqueWords: Set<string>): number {
  const cfg = knowledge.humanScore("lexicalDiversity");
  if (words.length < cfg.minItems) return 0;

  const ttr = uniqueWords.size / words.length;

  if (ttr > cfg.thresholds.ttrHigh) return clamp((ttr - cfg.thresholds.ttrHigh) * cfg.params.ttrHighMult);
  if (ttr > cfg.thresholds.ttrMid) return clamp((ttr - cfg.thresholds.ttrMid) * cfg.params.ttrMidMult);

  const freqMap = new Map<string, number>();
  for (const w of words) freqMap.set(w, (freqMap.get(w) || 0) + 1);
  const freqValues = Array.from(freqMap.values());
  const freqVariance = variance(freqValues);
  const avgFreq = words.length / Math.max(1, uniqueWords.size);

  const flatnessScore = Math.max(0, 1 - freqVariance / Math.max(0.01, avgFreq));
  return clamp(flatnessScore * cfg.params.flatnessMult);
}

/**
 * #41 — Rythme des phrases.
 * Un humanizer crée une alternance courte/longue trop régulière.
 */
function computeSentenceRhythm(sentences: string[]): number {
  const cfg = knowledge.humanScore("sentenceRhythm");
  if (sentences.length < cfg.minItems) return 0;

  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const cv = avg > 0 ? stdDev(lengths) / avg : 0;

  if (cv < cfg.thresholds.cvTooUniform) return clamp(cfg.params.tooUniformScore);
  if (cv > cfg.thresholds.cvNatural) return 0;

  let alternations = 0;
  for (let i = 1; i < lengths.length; i++) {
    const diff = lengths[i] - lengths[i - 1];
    if (i >= 2) {
      const prevDiff = lengths[i - 1] - lengths[i - 2];
      if (Math.sign(diff) !== Math.sign(prevDiff) && Math.abs(diff) > cfg.thresholds.minDiffForAlternation) {
        alternations++;
      }
    }
  }
  const alternationRatio = alternations / Math.max(1, lengths.length - 2);

  if (alternationRatio > cfg.thresholds.alternationThreshold) return clamp(alternationRatio * cfg.params.alternationMult);
  return 0;
}

/**
 * #42 — Variance des paragraphes.
 * Un humanizer peut égaliser les tailles de paragraphes.
 */
function computeParagraphVariance(text: string): number {
  const cfg = knowledge.humanScore("paragraphVariance");
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  if (paragraphs.length < cfg.minItems) return 0;

  const paraLengths = paragraphs.map(p => p.trim().split(/\s+/).length);
  const paraCV = stdDev(paraLengths) / Math.max(1, paraLengths.reduce((a, b) => a + b, 0) / paraLengths.length);

  if (paraCV < cfg.thresholds.cvCritical) return clamp(cfg.params.criticalBase - paraCV * cfg.params.criticalMult);
  if (paraCV < cfg.thresholds.cvWarning) return clamp(cfg.params.warningBase - paraCV * cfg.params.warningMult);
  return 0;
}

/**
 * #43 — Densité de phrases types IA résiduelles.
 * Même après humanisation, certaines phrases IA subsistent.
 */
function computeAiPhraseDensity(text: string, sentences: string[]): number {
  const cfg = knowledge.humanScore("aiPhraseDensity");
  const lists = knowledge.humanization().lists;

  const count = countListMatches(text, lists.aiPhrases, false);
  return clamp((count / Math.max(1, sentences.length)) * cfg.params.densityMult);
}

/**
 * #44 — Surutilisation de connecteurs (compensation par le humanizer).
 */
function computeConnectorOveruse(text: string, sentences: string[]): number {
  const cfg = knowledge.humanScore("connectorOveruse");
  const lists = knowledge.humanization().lists;

  const allConnectors = [...lists.humanizerConnectors, ...lists.additionalConnectors];
  const count = countListMatches(text, allConnectors);

  const density = count / Math.max(1, sentences.length);
  return clamp(density * cfg.params.densityMult);
}

/**
 * #45 — Préservation sémantique.
 * Un bon texte humain a des écarts sémantiques naturels.
 * Un texte humanisé conserve trop bien la cohérence sémantique.
 */
function computeSemanticPreservation(sentences: string[]): number {
  const cfg = knowledge.humanScore("semanticPreservation");
  if (sentences.length < cfg.minItems) return cfg.params.defaultScore;

  let totalSimilarity = 0;
  let pairs = 0;

  for (let i = 1; i < sentences.length; i++) {
    const prevBigrams = new Set<string>();
    const currBigrams = new Set<string>();

    const prevWords = sentences[i - 1].toLowerCase().split(/\s+/);
    const currWords = sentences[i].toLowerCase().split(/\s+/);

    for (let j = 0; j < prevWords.length - 1; j++) prevBigrams.add(prevWords[j] + " " + prevWords[j + 1]);
    for (let j = 0; j < currWords.length - 1; j++) currBigrams.add(currWords[j] + " " + currWords[j + 1]);

    if (prevBigrams.size === 0 || currBigrams.size === 0) continue;

    let overlap = 0;
    for (const bg of currBigrams) if (prevBigrams.has(bg)) overlap++;
    totalSimilarity += overlap / Math.min(prevBigrams.size, currBigrams.size);
    pairs++;
  }

  const avgSimilarity = pairs > 0 ? totalSimilarity / pairs : 0;
  return clamp(100 - avgSimilarity * cfg.params.similarityMult);
}

/**
 * #46 — Variation de ton.
 * Un humanizer injecte des changements de ton (formel → familier) trop visibles.
 */
function computeToneVariation(text: string, sentences: string[]): number {
  const cfg = knowledge.humanScore("toneVariation");
  const lists = knowledge.humanization().lists;

  const formalCount = countListMatches(text, lists.formalMarkers);
  const informalCount = countListMatches(text, lists.informalMarkers);

  const total = formalCount + informalCount;
  if (total === 0) return 0;

  const balance = 1 - Math.abs(formalCount - informalCount) / total;
  const mixDensity = total / Math.max(1, sentences.length);

  return clamp(balance * mixDensity * cfg.params.mixMult);
}

/**
 * #47 — Marqueurs personnels artificiels.
 * Un humanizer ajoute "je", "mon", "notre" de manière trop régulière.
 */
function computePersonalMarkerArtificiality(text: string, sentences: string[]): number {
  const cfg = knowledge.humanScore("personalMarkerArtificiality");
  const t = cfg.thresholds;
  const p = cfg.params;

  const firstPerson = (text.match(/\b(je|mon|ma|mes|nous|notre|nos|j')\b/gi) || []).length;
  const density = firstPerson / Math.max(1, sentences.length);

  const perSentence = sentences.map(s =>
    (s.match(/\b(je|mon|ma|mes|nous|notre|nos|j')\b/gi) || []).length
  );
  const markerVariance = variance(perSentence);

  if (density > t.densityHigh && markerVariance < t.varianceHigh)
    return clamp(p.highBase + (1 - markerVariance) * p.highMult);
  if (density > t.densityVeryHigh && markerVariance < t.varianceVeryHigh)
    return clamp(p.veryHighBase + (1 - markerVariance) * p.veryHighMult);

  return 0;
}

/**
 * #48 — Nuances humaines.
 * Textes humains : approximations, hésitations, digressions.
 * Humanizers : ces éléments sont absents ou mal imités.
 */
function computeHumanNuance(text: string, sentences: string[]): number {
  const cfg = knowledge.humanScore("humanNuance");
  const lists = knowledge.humanization().lists;
  const p = cfg.params;
  let nuanceScore = 0;

  const approxCount = countListMatches(text, lists.approximations);
  nuanceScore += Math.min(p.approxMaxPoints, approxCount * p.approxPointsPerHit);

  const parentheticals = (text.match(/\([^)]{10,}\)/g) || []).length;
  const emDashes = (text.match(/—[^—]+—/g) || []).length;
  nuanceScore += Math.min(p.parentheticalMaxPoints, (parentheticals + emDashes) * p.parentheticalPointsPerHit);

  const corrections = (text.match(/\b(ou plutôt|enfin[^,]|quoique|du moins)\b/gi) || []).length;
  nuanceScore += Math.min(p.correctionMaxPoints, corrections * p.correctionPointsPerHit);

  const empirical = (text.match(/\b(en pratique|d'après mon expérience|de ce que j'ai vu|concrètement)\b/gi) || []).length;
  nuanceScore += Math.min(p.empiricalMaxPoints, empirical * p.empiricalPointsPerHit);

  const temporalPattern = new RegExp(`\\b(${lists.temporalMarkers.join("|")})\\b`, "gi");
  const temporal = (text.match(temporalPattern) || []).length;
  nuanceScore += Math.min(p.temporalMaxPoints, temporal * p.temporalPointsPerHit);

  return clamp(nuanceScore);
}

/**
 * #49 — Randomisation de structure.
 * Les humanizers réordonnent les phrases et aléatorisent les transitions.
 */
function computeStructureRandomness(sentences: string[]): number {
  const cfg = knowledge.humanScore("structureRandomness");
  if (sentences.length < cfg.minItems) return 0;

  const lists = knowledge.humanization().lists;
  const connectorWords = new Set(lists.structureConnectors);

  let topicShifts = 0;
  const topicWords = new Set<string>();

  for (const s of sentences) {
    const words = s.toLowerCase().match(/\b[\wàâäéèêëîïôöùûüç]{4,}\b/g) || [];
    if (words.length === 0) continue;
    if (topicWords.has(words[0])) topicShifts++;
    for (const w of words.slice(0, 5)) topicWords.add(w);
  }

  let missingTransitions = 0;
  for (let i = 1; i < sentences.length; i++) {
    const firstWord = sentences[i].trim().split(/\s+/)[0]?.toLowerCase() || "";
    if (!connectorWords.has(firstWord) && firstWord.length > 2) missingTransitions++;
  }

  const missingRatio = missingTransitions / Math.max(1, sentences.length - 1);
  const shiftRatio = topicShifts / Math.max(1, sentences.length);

  return clamp(missingRatio * cfg.params.missingTransitionWeight + shiftRatio * cfg.params.topicShiftWeight);
}

/**
 * #50 — Score global de probabilité d'humanisation.
 * Combine les signaux inverses pour estimer si un texte a été humanisé.
 */
function computeHumanizationLikelihood(scores: Record<string, number>): number {
  const lk = knowledge.humanization().likelihood;
  const pw = lk.positiveWeights;
  const nw = lk.negativeWeights;
  const nuw = lk.nuanceWeights;

  const positiveSum = Object.entries(pw).reduce((s, [k, w]) => s + (scores[k] ?? 0) * w, 0);
  const negativeSum = Object.entries(nw).reduce((s, [k, w]) => s + (scores[k] ?? 0) * w, 0);
  const nuanceSum = Object.entries(nuw).reduce((s, [k, w]) => s + (100 - (scores[k] ?? 0)) * w, 0);

  return clamp(positiveSum - negativeSum * lk.negativeDampening + nuanceSum);
}

/* ── Classification 4 classes (data-driven) ──────────────────── */

function classify(scores: Record<string, number>): { classification: TextClassification; label: string } {
  const rules = knowledge.humanization().classificationRules;

  for (const rule of rules) {
    if (!rule.conditions.every(c => cmp(scores[c.score] ?? 0, c.op, c.value))) continue;
    if (rule.confirmConditions && !rule.confirmConditions.some(c => cmp(scores[c.score] ?? 0, c.op, c.value))) continue;
    return { classification: rule.classification, label: rule.label };
  }

  return { classification: "human", label: "Caractéristiques d'écriture humaine" };
}

/* ── Fonction principale ──────────────────────────────────── */

/**
 * Analyse complète de la détection d'humanisation.
 * Appelée par `analyzeText()` pour enrichir le résultat.
 */
export function detectHumanization(
  text: string,
  aiScore: number,
): HumanizationDetectionResult {
  const h = knowledge.humanization();

  if (!text || text.length < h.minTextLength) {
    const semDefault = h.scores.semanticPreservation.params.defaultScore;
    return {
      humanizationProbability: 0,
      classification: "human",
      classificationLabel: "Texte trop court pour l'analyse",
      syntacticVariationScore: 0, lexicalDiversityScore: 0,
      sentenceRhythmScore: 0, paragraphVarianceScore: 0,
      aiPhraseDensity: 0, connectorOveruseScore: 0,
      semanticPreservationScore: semDefault, toneVariationScore: 0,
      personalMarkerScore: 0, humanNuanceScore: 0,
      structureRandomnessScore: 0, humanizationLikelihood: 0,
    };
  }

  const sentences = splitSentences(text);
  const words = text.toLowerCase().match(/\b[\wàâäéèêëîïôöùûüç]+\b/gi) || [];
  const uniqueWords = new Set(words);

  const scores: Record<string, number> = {
    syntacticVariationScore: computeSyntacticVariation(sentences),
    lexicalDiversityScore: computeLexicalDiversity(words, uniqueWords),
    sentenceRhythmScore: computeSentenceRhythm(sentences),
    paragraphVarianceScore: computeParagraphVariance(text),
    aiPhraseDensity: computeAiPhraseDensity(text, sentences),
    connectorOveruseScore: computeConnectorOveruse(text, sentences),
    semanticPreservationScore: computeSemanticPreservation(sentences),
    toneVariationScore: computeToneVariation(text, sentences),
    personalMarkerScore: computePersonalMarkerArtificiality(text, sentences),
    humanNuanceScore: computeHumanNuance(text, sentences),
    structureRandomnessScore: computeStructureRandomness(sentences),
  };

  const humanizationLikelihood = computeHumanizationLikelihood(scores);

  const { classification, label: classificationLabel } = classify({
    ...scores,
    aiScore,
    humanizationProbability: humanizationLikelihood,
  });

  return {
    humanizationProbability: humanizationLikelihood,
    classification,
    classificationLabel,
    syntacticVariationScore: scores.syntacticVariationScore,
    lexicalDiversityScore: scores.lexicalDiversityScore,
    sentenceRhythmScore: scores.sentenceRhythmScore,
    paragraphVarianceScore: scores.paragraphVarianceScore,
    aiPhraseDensity: scores.aiPhraseDensity,
    connectorOveruseScore: scores.connectorOveruseScore,
    semanticPreservationScore: scores.semanticPreservationScore,
    toneVariationScore: scores.toneVariationScore,
    personalMarkerScore: scores.personalMarkerScore,
    humanNuanceScore: scores.humanNuanceScore,
    structureRandomnessScore: scores.structureRandomnessScore,
    humanizationLikelihood,
  };
}