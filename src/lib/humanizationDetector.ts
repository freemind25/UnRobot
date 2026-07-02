/**
 * Module 11-12 : Humanization Detection — Analyse inversée des transformations IA.
 *
 * Détecte les signaux révélateurs d'un texte IA qui a été "humanisé"
 * par un outil de réécriture (QuillBot, Undetectable.AI, etc.).
 *
 * 12 scores avancés (modules 39-50 AWPA) + classification 4 classes.
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

/* ── Signatures de connecteurs et phrases humanisées ──────── */

/** Connecteurs typiquement injectés par les humanizers pour "casser" le style IA. */
const HUMANIZER_CONNECTORS = [
  "du coup", "du reste", "au fond", "en gros", "bref", "en fait",
  "bon", "alors là", "tout ça", "quand même", "enfin bref",
  "pour tout dire", "à vrai dire", "soit dit en passant",
];

/** Phrases typiques des humanizers qui remplacent les formules IA par des tournures "naturelles". */
const HUMANIZER_PHRASES = [
  "il faut savoir que", "ce qu'il faut comprendre", "la chose c'est que",
  "ce qui est intéressant", "ce qui est clair", "le truc c'est que",
  "je pense que", "on voit bien que", "ce qui frappe",
  "si on y regarde de plus près", "pour être tout à fait honnête",
];

/** Signaux de paraphrase IA : synonymes forcés, reformulations visibles. */
const PARAPHRASE_SIGNALS = [
  /\b(mettre en avant|mettre en évidence|mettre en lumière)\b.*\b(souligner|faire ressortir)\b/gi,
  /\b(important|essentiel|crucial)\b.*\b(à noter|de souligner|de retenir)\b/gi,
  /\b(permets? de|permet de|favorise|facilite)\b.*\b(accomplir|réaliser|atteindre)\b/gi,
  /\b(divers|différents|multiples)\b.*\b(aspects|points|éléments)\b/gi,
  /\b(en matière de|sur le plan de|dans le domaine de)\b/gi,
];

/* ── Fonctions de scoring individuelles ────────────────────── */

/**
 * #39 — Variation syntaxique.
 * Un humanizer tente de varier les structures, ce qui crée une distribution
 * anormalement uniforme (trop variée pour être naturelle).
 */
function computeSyntacticVariation(sentences: string[]): number {
  if (sentences.length < 3) return 0;

  // Compter les types de structures syntaxiques par phrase
  const passiveCount = sentences.filter(s => /\b(être|été|est|sont|était|étaient)\s+\w+(é|ée|és|ées)/i.test(s)).length;
  const interrogativeCount = sentences.filter(s => /^\s*[a-zàâäéèêëîïôöùûüç]'|\?|est-ce que/i.test(s)).length;
  const imperativeCount = sentences.filter(s => /^\s*[a-zàâäéèêëîïôöùûüç]+(?:z|ons|ez)\b/i.test(s)).length;
  const infinitiveStart = sentences.filter(s => /^\s*(?:pour|avant|après|de|sans)\s+\w+(?:er|ir|re|oir)\b/i.test(s)).length;

  const structureTypes = [passiveCount, interrogativeCount, imperativeCount, infinitiveStart];
  const activeCount = sentences.length - passiveCount - interrogativeCount - imperativeCount;
  structureTypes.push(activeCount);

  // Entropie des types de structures
  const total = sentences.length;
  let entropy = 0;
  for (const count of structureTypes) {
    if (count === 0) continue;
    const p = count / total;
    entropy -= p * Math.log2(p);
  }
  const maxEntropy = Math.log2(6); // 6 types possibles
  const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;

  // Si toutes les structures sont représentées de manière trop équitable = suspect
  // Un humain a des biais de syntaxe naturels
  return clamp((normalizedEntropy - 0.5) * 200);
}

/**
 * #40 — Diversité lexicale anormale.
 * Les humanizers injectent des synonymes, ce qui monte artificiellement le TTR.
 */
function computeLexicalDiversity(words: string[], uniqueWords: Set<string>): number {
  if (words.length < 20) return 0;

  const ttr = uniqueWords.size / words.length;

  // Un TTR très élevé (> 0.8) sur un texte court est suspect
  // Les textes humains naturels ont généralement 0.5-0.75
  if (ttr > 0.8) return clamp((ttr - 0.8) * 500);
  if (ttr > 0.75) return clamp((ttr - 0.75) * 200);

  // Vérifier la distribution de fréquence : un humanizer crée une distribution trop plate
  const freqMap = new Map<string, number>();
  for (const w of words) {
    freqMap.set(w, (freqMap.get(w) || 0) + 1);
  }
  const freqValues = Array.from(freqMap.values());
  const freqVariance = variance(freqValues);
  const avgFreq = words.length / Math.max(1, uniqueWords.size);

  // Variance basse = distribution trop plate = synonymes artificiels
  const flatnessScore = Math.max(0, 1 - freqVariance / Math.max(0.01, avgFreq));

  return clamp(flatnessScore * 60);
}

/**
 * #41 — Rythme des phrases.
 * Un humanizer crée une alternance courte/longue trop régulière.
 */
function computeSentenceRhythm(sentences: string[]): number {
  if (sentences.length < 4) return 0;

  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const sd = stdDev(lengths);
  const cv = avg > 0 ? sd / avg : 0; // Coefficient de variation

  // CV entre 0.3 et 0.5 = zone normale humaine
  // CV trop régulier (0.4-0.5 exactement) ou pattern alternance parfaite = suspect
  if (cv < 0.15) return clamp(80); // Trop uniforme (non humanisé, IA brute)
  if (cv > 0.7) return 0; // Très naturel

  // Détecter un pattern d'alternance courte/longue/courte/longue
  let alternations = 0;
  for (let i = 1; i < lengths.length; i++) {
    const diff = lengths[i] - lengths[i - 1];
    if (i >= 2) {
      const prevDiff = lengths[i - 1] - lengths[i - 2];
      if (Math.sign(diff) !== Math.sign(prevDiff) && Math.abs(diff) > 3) {
        alternations++;
      }
    }
  }
  const alternationRatio = alternations / Math.max(1, lengths.length - 2);

  // Trop d'alternances régulières = humanizer
  if (alternationRatio > 0.7) return clamp(alternationRatio * 80);
  return 0;
}

/**
 * #42 — Variance des paragraphes.
 * Un humanizer peut égaliser les tailles de paragraphes.
 */
function computeParagraphVariance(text: string): number {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  if (paragraphs.length < 2) return 0;

  const paraLengths = paragraphs.map(p => p.trim().split(/\s+/).length);
  const paraCV = stdDev(paraLengths) / Math.max(1, paraLengths.reduce((a, b) => a + b, 0) / paraLengths.length);

  // CV très faible = paragraphes trop égaux = suspect
  if (paraCV < 0.15) return clamp(90 - paraCV * 500);
  if (paraCV < 0.25) return clamp(50 - paraCV * 150);
  return 0;
}

/**
 * #43 — Densité de phrases types IA résiduelles.
 * Même après humanisation, certaines phrases IA subsistent.
 */
function computeAiPhraseDensity(text: string, sentences: string[]): number {
  const aiPhrases = [
    "il est important de", "il convient de", "en conclusion", "pour conclure",
    "force est de constater", "il est essentiel", "in today's world",
    "it is important to", "plays a crucial role", "a testament to",
    "delve into", "à l'ère du", "dans le monde de", "enjeux majeurs",
    "cette approche permet", "solution innovante", "en conclusion",
    "une chose est certaine", "il est clair que",
  ];

  let count = 0;
  for (const phrase of aiPhrases) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = text.match(new RegExp(escaped, "gi"));
    if (matches) count += matches.length;
  }

  return clamp((count / Math.max(1, sentences.length)) * 250);
}

/**
 * #44 — Surutilisation de connecteurs (compensation par le humanizer).
 */
function computeConnectorOveruse(text: string, sentences: string[]): number {
  const allConnectors = [
    ...HUMANIZER_CONNECTORS,
    "en effet", "cependant", "de plus", "par ailleurs", "en outre",
    "par conséquent", "néanmoins", "toutefois", "enfin", "ensuite",
    "d'une part", "d'autre part", "non seulement", "mais encore",
  ];

  let count = 0;
  for (const c of allConnectors) {
    const escaped = c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = text.match(new RegExp(`\\b${escaped}\\b`, "gi"));
    if (matches) count += matches.length;
  }

  const density = count / Math.max(1, sentences.length);
  return clamp(density * 120);
}

/**
 * #45 — Préservation sémantique.
 * Un bon texte humain a des écarts sémantiques naturels.
 * Un texte humanisé conserve trop bien la cohérence sémantique.
 */
function computeSemanticPreservation(sentences: string[]): number {
  if (sentences.length < 3) return 50;

  // Mesurer la similarité bigrammes entre phrases consécutives
  let totalSimilarity = 0;
  let pairs = 0;

  for (let i = 1; i < sentences.length; i++) {
    const prevBigrams = new Set<string>();
    const currBigrams = new Set<string>();

    const prevWords = sentences[i - 1].toLowerCase().split(/\s+/);
    const currWords = sentences[i].toLowerCase().split(/\s+/);

    for (let j = 0; j < prevWords.length - 1; j++) {
      prevBigrams.add(prevWords[j] + " " + prevWords[j + 1]);
    }
    for (let j = 0; j < currWords.length - 1; j++) {
      currBigrams.add(currWords[j] + " " + currWords[j + 1]);
    }

    if (prevBigrams.size === 0 || currBigrams.size === 0) continue;

    let overlap = 0;
    for (const bg of currBigrams) {
      if (prevBigrams.has(bg)) overlap++;
    }
    const similarity = overlap / Math.min(prevBigrams.size, currBigrams.size);
    totalSimilarity += similarity;
    pairs++;
  }

  const avgSimilarity = pairs > 0 ? totalSimilarity / pairs : 0;

  // Similarité très faible entre phrases = naturel (sauts logiques humains)
  // Similarité élevée = IA ou humanizer qui maintient la cohérence
  return clamp(100 - avgSimilarity * 300);
}

/**
 * #46 — Variation de ton.
 * Un humanizer injecte des changements de ton (formel → familier) trop visibles.
 */
function computeToneVariation(text: string, sentences: string[]): number {
  // Marqueurs formels
  const formalMarkers = [
    "en effet", "par conséquent", "il convient de", "ainsi que",
    "notamment", "cependant", "en revanche", "par ailleurs",
  ];
  // Marqueurs informels (injectés par les humanizers)
  const informalMarkers = [
    "du coup", "en gros", "au fond", "bref", "bon", "alors là",
    "franchement", "genre", "truc", "tout ça",
  ];

  let formalCount = 0;
  let informalCount = 0;

  for (const m of formalMarkers) {
    const escaped = m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    formalCount += (text.match(new RegExp(`\\b${escaped}\\b`, "gi")) || []).length;
  }
  for (const m of informalMarkers) {
    const escaped = m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    informalCount += (text.match(new RegExp(`\\b${escaped}\\b`, "gi")) || []).length;
  }

  const total = formalCount + informalCount;
  if (total === 0) return 0;

  // Mélange formel/informel très équilibré = suspect (humanizer)
  const balance = 1 - Math.abs(formalCount - informalCount) / total;
  const mixDensity = total / Math.max(1, sentences.length);

  return clamp(balance * mixDensity * 200);
}

/**
 * #47 — Marqueurs personnels artificiels.
 * Un humanizer ajoute "je", "mon", "notre" de manière trop régulière.
 */
function computePersonalMarkerArtificiality(text: string, sentences: string[]): number {
  const firstPerson = (text.match(/\b(je|mon|ma|mes|nous|notre|nos|j')\b/gi) || []).length;
  const density = firstPerson / Math.max(1, sentences.length);

  // Trop régulier : chaque phrase a exactement 1-2 marqueurs = suspect
  const perSentence = sentences.map(s =>
    (s.match(/\b(je|mon|ma|mes|nous|notre|nos|j')\b/gi) || []).length
  );
  const markerVariance = variance(perSentence);

  // Variance très faible + densité notable = artificiel
  if (density > 0.3 && markerVariance < 0.5) {
    return clamp(40 + (1 - markerVariance) * 40);
  }
  if (density > 0.5 && markerVariance < 1.0) {
    return clamp(30 + (1 - markerVariance) * 30);
  }

  return 0;
}

/**
 * #48 — Nuances humaines.
 * Textes humains : approximations, hésitations, digressions.
 * Humanizers : ces éléments sont absents ou mal imités.
 */
function computeHumanNuance(text: string, sentences: string[]): number {
  let nuanceScore = 0;

  // Approximations (marqueurs d'incertitude naturelle)
  const approximations = [
    "environ", "à peu près", "grossièrement", "autour de",
    "quelque chose comme", "plus ou moins", "je dirais",
    "si je me souviens bien", "à ma connaissance", "sauf erreur",
  ];
  let approxCount = 0;
  for (const a of approximations) {
    const escaped = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    approxCount += (text.match(new RegExp(`\\b${escaped}\\b`, "gi")) || []).length;
  }
  nuanceScore += Math.min(30, approxCount * 10);

  // Digressions (parenthèses, incises)
  const parentheticals = (text.match(/\([^)]{10,}\)/g) || []).length;
  const emDashes = (text.match(/—[^—]+—/g) || []).length;
  nuanceScore += Math.min(20, (parentheticals + emDashes) * 10);

  // Auto-corrections ("ou plutôt", "enfin", "quoique")
  const corrections = (text.match(/\b(ou plutôt|enfin[^,]|quoique|du moins)\b/gi) || []).length;
  nuanceScore += Math.min(20, corrections * 10);

  // Empirisme ("en pratique", "d'après mon expérience", "de ce que j'ai vu")
  const empirical = (text.match(/\b(en pratique|d'après mon expérience|de ce que j'ai vu|concrètement)\b/gi) || []).length;
  nuanceScore += Math.min(15, empirical * 7);

  // Spécificités temporelles ("récemment", "l'an dernier", "en 2024")
  const temporal = (text.match(/\b(récemment|l'an dernier|en \d{4}|cette année|le mois dernier)\b/gi) || []).length;
  nuanceScore += Math.min(15, temporal * 7);

  return clamp(nuanceScore);
}

/**
 * #49 — Randomisation de structure.
 * Les humanizers réordonnent les phrases et aléatorisent les transitions.
 */
function computeStructureRandomness(sentences: string[]): number {
  if (sentences.length < 4) return 0;

  // Détecter les changements brusques de sujet (absence de transition)
  let topicShifts = 0;
  const topicWords = new Set<string>();

  for (const s of sentences) {
    const words = s.toLowerCase().match(/\b[\wàâäéèêëîïôöùûüç]{4,}\b/g) || [];
    if (words.length === 0) continue;
    const topWord = words[0]; // Premier mot significatif
    if (topicWords.has(topWord)) {
      topicShifts++;
    }
    for (const w of words.slice(0, 5)) topicWords.add(w);
  }

  // Absence totale de connecteurs entre les phrases = réordonnancement
  const connectorWords = new Set([
    "mais", "donc", "or", "ni", "car", "puis", "en", "et", "ou",
    "cependant", "cependant", "toutefois", "néanmoins", "enfin",
    "ensuite", "premièrement", "deuxièmement", "par ailleurs",
    "de plus", "en outre", "en effet", "ainsi",
  ]);

  let missingTransitions = 0;
  for (let i = 1; i < sentences.length; i++) {
    const firstWord = sentences[i].trim().split(/\s+/)[0]?.toLowerCase() || "";
    if (!connectorWords.has(firstWord) && firstWord.length > 2) {
      missingTransitions++;
    }
  }

  const missingRatio = missingTransitions / Math.max(1, sentences.length - 1);
  const shiftRatio = topicShifts / Math.max(1, sentences.length);

  return clamp(missingRatio * 40 + shiftRatio * 30);
}

/**
 * #50 — Score global de probabilité d'humanisation.
 * Combine les signaux inverses pour estimer si un texte a été humanisé.
 */
function computeHumanizationLikelihood(scores: Omit<HumanizationDetectionResult, "classification" | "classificationLabel" | "humanizationLikelihood">): number {
  const {
    syntacticVariationScore,
    lexicalDiversityScore,
    sentenceRhythmScore,
    paragraphVarianceScore,
    aiPhraseDensity,
    connectorOveruseScore,
    semanticPreservationScore,
    toneVariationScore,
    personalMarkerScore,
    structureRandomnessScore,
  } = scores;

  // Signaux positifs d'humanisation (plus élevés = plus probablement humanisé)
  const positiveSignals = [
    syntacticVariationScore * 0.10,
    lexicalDiversityScore * 0.08,
    sentenceRhythmScore * 0.12,
    paragraphVarianceScore * 0.08,
    toneVariationScore * 0.12,
    personalMarkerScore * 0.10,
    structureRandomnessScore * 0.10,
  ];

  // Signaux négatifs (présence résiduelle d'IA)
  const negativeSignals = [
    aiPhraseDensity * 0.15,
    connectorOveruseScore * 0.10,
  ];

  // Signaux mitigés
  const nuanceSignals = [
    (100 - semanticPreservationScore) * 0.05, // Moins de préservation = plus humain
  ];

  const positiveSum = positiveSignals.reduce((a, b) => a + b, 0);
  const negativeSum = negativeSignals.reduce((a, b) => a + b, 0);
  const nuanceSum = nuanceSignals.reduce((a, b) => a + b, 0);

  return clamp(positiveSum - negativeSum * 0.6 + nuanceSum);
}

/* ── Classification 4 classes ──────────────────────────────── */

function classify(
  aiScore: number,
  humanizationProbability: number,
  aiPhraseDensity: number,
  sentenceRhythmScore: number,
  toneVariationScore: number,
): { classification: TextClassification; label: string } {
  // AI brute : score IA élevé + probabilité d'humanisation faible
  if (aiScore > 60 && humanizationProbability < 35) {
    return { classification: "ai", label: "Texte compatible avec une génération IA brute" };
  }

  // AI humanisé : score IA modéré + signaux d'humanisation clairs
  if (humanizationProbability > 50 && aiScore > 30 && aiScore < 75) {
    if (toneVariationScore > 30 || sentenceRhythmScore > 20) {
      return { classification: "ai_humanized", label: "Texte présentant des caractéristiques compatibles avec une humanisation IA" };
    }
  }

  // AI paraphrasé : score IA élevé + densité de phrases IA résiduelles + signaux de reformulation
  if (aiScore > 40 && aiPhraseDensity > 20 && humanizationProbability > 25) {
    return { classification: "ai_paraphrased", label: "Texte présentant des caractéristiques compatibles avec une paraphrase IA" };
  }

  // Humanisé aussi si le score IA a été réduit artificiellement
  if (aiScore < 40 && humanizationProbability > 60) {
    return { classification: "ai_humanized", label: "Texte présentant des caractéristiques compatibles avec une transformation IA" };
  }

  // Humain par défaut
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
  if (!text || text.length < 100) {
    return {
      humanizationProbability: 0,
      classification: "human",
      classificationLabel: "Texte trop court pour l'analyse",
      syntacticVariationScore: 0, lexicalDiversityScore: 0,
      sentenceRhythmScore: 0, paragraphVarianceScore: 0,
      aiPhraseDensity: 0, connectorOveruseScore: 0,
      semanticPreservationScore: 50, toneVariationScore: 0,
      personalMarkerScore: 0, humanNuanceScore: 0,
      structureRandomnessScore: 0, humanizationLikelihood: 0,
    };
  }

  const sentences = splitSentences(text);
  const words = text.toLowerCase().match(/\b[\wàâäéèêëîïôöùûüç]+\b/gi) || [];
  const uniqueWords = new Set(words);

  // Calculer les 12 scores
  const syntacticVariationScore = computeSyntacticVariation(sentences);
  const lexicalDiversityScore = computeLexicalDiversity(words, uniqueWords);
  const sentenceRhythmScore = computeSentenceRhythm(sentences);
  const paragraphVarianceScore = computeParagraphVariance(text);
  const aiPhraseDensity = computeAiPhraseDensity(text, sentences);
  const connectorOveruseScore = computeConnectorOveruse(text, sentences);
  const semanticPreservationScore = computeSemanticPreservation(sentences);
  const toneVariationScore = computeToneVariation(text, sentences);
  const personalMarkerScore = computePersonalMarkerArtificiality(text, sentences);
  const humanNuanceScore = computeHumanNuance(text, sentences);
  const structureRandomnessScore = computeStructureRandomness(sentences);

  // Scores intermédiaires pour la classification
  const intermediateScores = {
    syntacticVariationScore, lexicalDiversityScore, sentenceRhythmScore,
    paragraphVarianceScore, aiPhraseDensity, connectorOveruseScore,
    semanticPreservationScore, toneVariationScore, personalMarkerScore,
    humanNuanceScore, structureRandomnessScore,
  };

  const humanizationLikelihood = computeHumanizationLikelihood(intermediateScores);

  const { classification, label: classificationLabel } = classify(
    aiScore, humanizationLikelihood, aiPhraseDensity, sentenceRhythmScore, toneVariationScore,
  );

  return {
    humanizationProbability: humanizationLikelihood,
    classification,
    classificationLabel,
    ...intermediateScores,
    humanizationLikelihood,
  };
}