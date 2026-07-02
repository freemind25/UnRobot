/**
 * LIC — Humanization Detection Knowledge.
 *
 * Seuils, poids et listes pour les 12 sous-scores (#39-#50)
 * et la classification 4 classes du détecteur d'humanisation.
 *
 * Sprint 6 PR1.
 */

import type {
  HumanizationScoreConfig,
  LikelihoodConfig,
  ClassificationRule,
  HumanizationLists,
  HumanizationKnowledge,
} from "./types";

/* ── Sous-scores (#39-#50) ─────────────────────────────────────── */

const SCORES: Record<string, HumanizationScoreConfig> = {
  // #39 — Variation syntaxique
  syntacticVariation: {
    minItems: 3,
    thresholds: { entropyBaseline: 0.5 },
    params: { multiplier: 200 },
  },
  // #40 — Diversité lexicale anormale
  lexicalDiversity: {
    minItems: 20,
    thresholds: { ttrHigh: 0.8, ttrMid: 0.75 },
    params: { ttrHighMult: 500, ttrMidMult: 200, flatnessMult: 60 },
  },
  // #41 — Rythme des phrases
  sentenceRhythm: {
    minItems: 4,
    thresholds: { cvTooUniform: 0.15, cvNatural: 0.7, alternationThreshold: 0.7, minDiffForAlternation: 3 },
    params: { tooUniformScore: 80, alternationMult: 80 },
  },
  // #42 — Variance des paragraphes
  paragraphVariance: {
    minItems: 2,
    thresholds: { cvCritical: 0.15, cvWarning: 0.25 },
    params: { criticalBase: 90, criticalMult: 500, warningBase: 50, warningMult: 150 },
  },
  // #43 — Densité de phrases types IA
  aiPhraseDensity: {
    minItems: 0,
    thresholds: {},
    params: { densityMult: 250 },
  },
  // #44 — Surutilisation de connecteurs
  connectorOveruse: {
    minItems: 0,
    thresholds: {},
    params: { densityMult: 120 },
  },
  // #45 — Préservation sémantique
  semanticPreservation: {
    minItems: 3,
    thresholds: {},
    params: { similarityMult: 300, defaultScore: 50 },
  },
  // #46 — Variation de ton
  toneVariation: {
    minItems: 0,
    thresholds: {},
    params: { mixMult: 200 },
  },
  // #47 — Marqueurs personnels artificiels
  personalMarkerArtificiality: {
    minItems: 0,
    thresholds: { densityHigh: 0.3, varianceHigh: 0.5, densityVeryHigh: 0.5, varianceVeryHigh: 1.0 },
    params: { highBase: 40, highMult: 40, veryHighBase: 30, veryHighMult: 30 },
  },
  // #48 — Nuances humaines
  humanNuance: {
    minItems: 0,
    thresholds: {},
    params: {
      approxMaxPoints: 30, approxPointsPerHit: 10,
      parentheticalMaxPoints: 20, parentheticalPointsPerHit: 10,
      correctionMaxPoints: 20, correctionPointsPerHit: 10,
      empiricalMaxPoints: 15, empiricalPointsPerHit: 7,
      temporalMaxPoints: 15, temporalPointsPerHit: 7,
    },
  },
  // #49 — Randomisation de structure
  structureRandomness: {
    minItems: 4,
    thresholds: {},
    params: { missingTransitionWeight: 40, topicShiftWeight: 30 },
  },
};

/* ── Poids de vraisemblance (#50) ──────────────────────────────── */

const LIKELIHOOD: LikelihoodConfig = {
  positiveWeights: {
    syntacticVariation: 0.10,
    lexicalDiversity: 0.08,
    sentenceRhythm: 0.12,
    paragraphVariance: 0.08,
    toneVariation: 0.12,
    personalMarker: 0.10,
    structureRandomness: 0.10,
  },
  negativeWeights: {
    aiPhraseDensity: 0.15,
    connectorOveruse: 0.10,
  },
  nuanceWeights: {
    semanticPreservation: 0.05,
  },
  negativeDampening: 0.6,
};

/* ── Règles de classification ──────────────────────────────────── */

const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    name: "ai_brute",
    conditions: [
      { score: "aiScore", op: ">", value: 60 },
      { score: "humanizationProbability", op: "<", value: 35 },
    ],
    classification: "ai",
    label: "Texte compatible avec une génération IA brute",
  },
  {
    name: "ai_humanized_primary",
    conditions: [
      { score: "humanizationProbability", op: ">", value: 50 },
      { score: "aiScore", op: ">", value: 30 },
      { score: "aiScore", op: "<", value: 75 },
    ],
    confirmConditions: [
      { score: "toneVariationScore", op: ">", value: 30 },
      { score: "sentenceRhythmScore", op: ">", value: 20 },
    ],
    classification: "ai_humanized",
    label: "Texte présentant des caractéristiques compatibles avec une humanisation IA",
  },
  {
    name: "ai_paraphrased",
    conditions: [
      { score: "aiScore", op: ">", value: 40 },
      { score: "aiPhraseDensity", op: ">", value: 20 },
      { score: "humanizationProbability", op: ">", value: 25 },
    ],
    classification: "ai_paraphrased",
    label: "Texte présentant des caractéristiques compatibles avec une paraphrase IA",
  },
  {
    name: "ai_humanized_alt",
    conditions: [
      { score: "aiScore", op: "<", value: 40 },
      { score: "humanizationProbability", op: ">", value: 60 },
    ],
    classification: "ai_humanized",
    label: "Texte présentant des caractéristiques compatibles avec une transformation IA",
  },
];

/* ── Listes de mots et patterns ────────────────────────────────── */

const LISTS: HumanizationLists = {
  humanizerConnectors: [
    "du coup", "du reste", "au fond", "en gros", "bref", "en fait",
    "bon", "alors là", "tout ça", "quand même", "enfin bref",
    "pour tout dire", "à vrai dire", "soit dit en passant",
  ],
  humanizerPhrases: [
    "il faut savoir que", "ce qu'il faut comprendre", "la chose c'est que",
    "ce qui est intéressant", "ce qui est clair", "le truc c'est que",
    "je pense que", "on voit bien que", "ce qui frappe",
    "si on y regarde de plus près", "pour être tout à fait honnête",
  ],
  paraphraseSignals: [
    "(mettre en avant|mettre en évidence|mettre en lumière)\\b.*\\b(souligner|faire ressortir)",
    "(important|essentiel|crucial)\\b.*\\b(à noter|de souligner|de retenir)",
    "(permets? de|permet de|favorise|facilite)\\b.*\\b(accomplir|réaliser|atteindre)",
    "(divers|différents|multiples)\\b.*\\b(aspects|points|éléments)",
    "(en matière de|sur le plan de|dans le domaine de)",
  ],
  aiPhrases: [
    "il est important de", "il convient de", "en conclusion", "pour conclure",
    "force est de constater", "il est essentiel", "in today's world",
    "it is important to", "plays a crucial role", "a testament to",
    "delve into", "à l'ère du", "dans le monde de", "enjeux majeurs",
    "cette approche permet", "solution innovante", "en conclusion",
    "une chose est certaine", "il est clair que",
  ],
  formalMarkers: [
    "en effet", "par conséquent", "il convient de", "ainsi que",
    "notamment", "cependant", "en revanche", "par ailleurs",
  ],
  informalMarkers: [
    "du coup", "en gros", "au fond", "bref", "bon", "alors là",
    "franchement", "genre", "truc", "tout ça",
  ],
  additionalConnectors: [
    "en effet", "cependant", "de plus", "par ailleurs", "en outre",
    "par conséquent", "néanmoins", "toutefois", "enfin", "ensuite",
    "d'une part", "d'autre part", "non seulement", "mais encore",
  ],
  structureConnectors: [
    "mais", "donc", "or", "ni", "car", "puis", "en", "et", "ou",
    "cependant", "toutefois", "néanmoins", "enfin",
    "ensuite", "premièrement", "deuxièmement", "par ailleurs",
    "de plus", "en outre", "en effet", "ainsi",
  ],
  approximations: [
    "environ", "à peu près", "grossièrement", "autour de",
    "quelque chose comme", "plus ou moins", "je dirais",
    "si je me souviens bien", "à ma connaissance", "sauf erreur",
  ],
  temporalMarkers: [
    "récemment", "l'an dernier", "en \\d{4}", "cette année", "le mois dernier",
  ],
};

/* ── Export ────────────────────────────────────────────────────── */

export const HUMANIZATION_KNOWLEDGE: HumanizationKnowledge = {
  minTextLength: 100,
  scores: SCORES,
  likelihood: LIKELIHOOD,
  classificationRules: CLASSIFICATION_RULES,
  lists: LISTS,
} as const;