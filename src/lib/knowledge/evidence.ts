/**
 * Linguistic Intelligence Core (LIC) — Preuves et règles.
 *
 * Contient les règles de détails, la checklist SUCKS,
 * la configuration SUCKS et les paramètres du Pattern Engine.
 *
 * Sprint 5 — Phase 0.
 */

import type { DetailRule, ChecklistRule, SucksDimension, PatternEngineConfig, GlobalConfig } from "./types";

// ── Règles de détails (rapport) ──────────────────────────────────────
// Chaque règle déclenche un détail quand le score (ou un champ data)
// dépasse le seuil défini.

export const DETAIL_RULES: DetailRule[] = [
  {
    metricId: "burstiness",
    minScore: 70,
    severity: "high",
    category: "Burstiness",
    issue: "Longueur de phrases trop uniforme (typique de l'IA)",
  },
  {
    metricId: "vocabulary",
    conditionType: "dataBelow",
    conditionField: "ttr",
    minScore: 40,
    severity: "medium",
    category: "Vocabulaire",
    issue: "Diversité lexicale faible, vocabulaire répétitif",
  },
  {
    metricId: "transition",
    minScore: 45,
    severity: "medium",
    category: "Transitions",
    issue: "Connecteurs logiques trop fréquents",
    maxExamples: 6,
    examplesDataKey: "transFoundJson",
  },
  {
    metricId: "perfection",
    minScore: 80,
    severity: "low",
    category: "Perfection",
    issue: "Style trop lisse, aucune marque d'oralité",
  },
  {
    metricId: "voice",
    minScore: 40,
    severity: "high",
    category: "Voix générique",
    issue: "Formulations passe-partout caractéristiques de l'IA",
    maxExamples: 6,
    examplesDataKey: "foundJson",
  },
  {
    metricId: "depth",
    minScore: 85,
    severity: "low",
    category: "Profondeur",
    issue: "Peu de détails concrets (chiffres, noms, exemples)",
  },
  {
    metricId: "structure",
    minScore: 50,
    severity: "high",
    category: "Structure IA",
    issue: "Structure trop parfaite, symétrie excessive ou énumération rigide",
  },
  {
    metricId: "structure",
    minScore: 25,
    severity: "medium",
    category: "Structure IA",
    issue: "Certaines marques de structure artificielle détectées",
  },
  {
    metricId: "semanticRepetition",
    conditionType: "dataAbove",
    conditionField: "pairs",
    minScore: 0,
    severity: "medium",
    category: "Répétition sémantique",
    issue: "",  // Construit dynamiquement avec le nombre de paires
    highThreshold: 2,
  },
  {
    metricId: "personalization",
    minScore: 80,
    severity: "high",
    category: "Personnalisation",
    issue: "Absence de marques de personnalisation",
  },
  {
    metricId: "personalization",
    minScore: 60,
    severity: "medium",
    category: "Personnalisation",
    issue: "Peu de marques de personnalisation détectées",
  },
  {
    metricId: "paraphrase",
    minScore: 50,
    severity: "high",
    category: "Paraphrase IA",
    issue: "Reformulations artificielles détectées",
  },
  {
    metricId: "paraphrase",
    minScore: 25,
    severity: "low",
    category: "Paraphrase IA",
    issue: "Quelques signaux de paraphrase artificielle",
  },
  {
    metricId: "paragraphBalance",
    minScore: 80,
    severity: "high",
    category: "Équilibre paragraphes",
    issue: "Paragraphes de taille trop uniforme (symétrie suspecte)",
  },
  {
    metricId: "paragraphBalance",
    minScore: 60,
    severity: "medium",
    category: "Équilibre paragraphes",
    issue: "Paragraphes de taille trop uniforme (symétrie suspecte)",
  },
];

// ── Règles de checklist ──────────────────────────────────────────────

export const CHECKLIST_RULES: ChecklistRule[] = [
  { label: "Aucune construction corrélative", type: "pattern", patternFlag: "Construction corrélative" },
  { label: "Pas de langage hésitant", type: "pattern", patternFlag: "Langage hésitant" },
  { label: "Pas de voix passive", type: "pattern", patternFlag: "Voix passive" },
  { label: "Pas de phrases rhétoriques interdites", type: "pattern", patternFlag: "Phrases rhétoriques interdites" },
  { label: "Score SUCKS > 70", type: "score", scoreMetric: "sucks", comparison: ">", value: 70 },
  { label: "Variété de longueur des phrases", type: "score", scoreMetric: "burstiness", comparison: "<", value: 70 },
  { label: "Pas de répétition sémantique", type: "score", scoreMetric: "semanticRepetition", comparison: "<", value: 30 },
  { label: "Personnalisation présente", type: "score", scoreMetric: "personalization", comparison: "<", value: 70 },
  { label: "Structure naturelle", type: "score", scoreMetric: "structure", comparison: "<", value: 40 },
];

// ── Configuration SUCKS ──────────────────────────────────────────────

export const SUCKS_CONFIG: Record<string, SucksDimension> = {
  specific: {
    weight: 0.6,
    bonus: 25,
    threshold: 3,
    field: "depth",
  },
  unique: {
    weight: 0.7,
    penalty: 25,
    flag: "Langage vague",
    field: "voice",
  },
  clear: {
    weight: 0.5,
    penalty: 25,
    flag: "Jargon corporate",
    field: "transition",
  },
  simple: {
    weight: 0.4,
    penalty: 25,
    avgLengthThreshold: 25,
    field: "vocabulary",
  },
  sticky: {
    weight: 0.5,
    penalty: 20,
    flag: "Phrases rhétoriques interdites",
    field: "perfection",
  },
};

// ── Configuration Pattern Engine ─────────────────────────────────────

export const PATTERN_ENGINE_CONFIG: PatternEngineConfig = {
  staccatoMinWords: 5,
  staccatoRunLength: 3,
  staccatoPointsPerHit: 5,
};

// ── Configuration globale ────────────────────────────────────────────

export const GLOBAL_CONFIG: GlobalConfig = {
  maxPatternPoints: 30,
  minAnalysisLength: 50,
  maxExamples: 6,
  sucks: SUCKS_CONFIG,
  patternEngine: PATTERN_ENGINE_CONFIG,
};