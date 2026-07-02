/**
 * Linguistic Intelligence Core (LIC) — Types.
 *
 * Toute la connaissance linguistique d'UnRobot est typée ici.
 * Aucune valeur métier (seuil, poids, recommandation) ne doit être
 * codée en dur dans les algorithmes — elle réside dans le LIC.
 *
 * Sprint 5 — Phase 0.
 */

/** Configuration complète d'une métrique. */
export interface MetricConfig {
  /** Identifiant unique (ex: "burstiness", "entropy"). */
  id: string;
  /** Label lisible en français. */
  label: string;
  /** Poids dans le score composite (0-1). */
  weight: number;
  /** Multiplicateur pour convertir une valeur brute en score 0-100. */
  multiplier?: number;
  /** Nombre minimum de mots pour exécuter la métrique. */
  minWords?: number;
  /** Nombre minimum de phrases. */
  minSentences?: number;
  /** Nombre minimum de mots uniques. */
  minUniqueWords?: number;
  /** Seuils nommés (ex: { cvLow: 0.15, cvMid: 0.25 }). */
  thresholds?: Record<string, number>;
  /** Paramètres nommés (ex: { betweenWeight: 0.7, withinWeight: 0.3 }). */
  params?: Record<string, number>;
}

/** Type de condition pour une règle de détail. */
export type DetailConditionType = "score" | "dataAbove" | "dataBelow";

/** Règle de déclenchement d'un détail dans le rapport. */
export interface DetailRule {
  /** Identifiant de la métrique concernée. */
  metricId: string;
  /** Type de condition (défaut : "score"). */
  conditionType?: DetailConditionType;
  /**
   * Seuil principal.
   * - conditionType="score" : score >= minScore déclenche
   * - conditionType="dataBelow" : data[field] < minScore déclenche
   */
  minScore: number;
  /** Sévérité du détail (par défaut). */
  severity: "low" | "medium" | "high";
  /** Catégorie affichée dans le rapport. */
  category: string;
  /** Description du problème détecté. */
  issue: string;
  /** Nombre maximum d'exemples à afficher (0 = pas d'exemples). */
  maxExamples?: number;
  /** Clé dans `data` du module pour les exemples (ex: "transFoundJson"). */
  examplesDataKey?: string;
  /**
   * Pour les règles basées sur un champ data (pas le score).
   * Requis quand conditionType != "score".
   */
  conditionField?: string;
  /**
   * Seuil secondaire pour basculer en sévérité haute.
   * - "dataAbove" : data[field] > highThreshold → high
   * - "dataBelow" : inutilisé
   */
  highThreshold?: number;
}

/** Règle de checklist. */
export interface ChecklistRule {
  /** Label affiché dans la checklist. */
  label: string;
  /** Type de vérification. */
  type: "pattern" | "score";
  /** Pour type="pattern" : clé dans patternHits à vérifier (doit être false). */
  patternFlag?: string;
  /** Pour type="score" : identifiant de la métrique. */
  scoreMetric?: string;
  /** Pour type="score" : opérateur de comparaison. */
  comparison?: ">" | "<";
  /** Pour type="score" : valeur de seuil. */
  value?: number;
}

/** Configuration d'une dimension SUCKS. */
export interface SucksDimension {
  weight: number;
  bonus?: number;
  penalty?: number;
  threshold?: number;
  flag?: string;
  avgLengthThreshold?: number;
  field: string;
}

/** Configuration du Pattern Engine. */
export interface PatternEngineConfig {
  /** Nombre max de mots dans une phrase staccato. */
  staccatoMinWords: number;
  /** Nombre de phrases consécutives pour déclencher. */
  staccatoRunLength: number;
  /** Points par hit staccato. */
  staccatoPointsPerHit: number;
}

/* ── Humanization Detection (#39-#50) ──────────────────────────── */

/** Classification 4 classes du détecteur d'humanisation. */
export type TextClassification = "human" | "ai" | "ai_humanized" | "ai_paraphrased";

/** Condition de classification. */
export interface ClassificationCondition {
  score: string;
  op: ">" | "<" | ">=" | "<=";
  value: number;
}

/** Règle de classification (évaluée en ordre, première correspondance gagne). */
export interface ClassificationRule {
  name: string;
  /** Toutes les conditions doivent correspondre (AND). */
  conditions: ClassificationCondition[];
  /** Si présent, au moins une doit correspondre (OR). */
  confirmConditions?: ClassificationCondition[];
  classification: TextClassification;
  label: string;
}

/** Configuration d'un sous-score d'humanization (#39-#50). */
export interface HumanizationScoreConfig {
  minItems: number;
  thresholds: Record<string, number>;
  params: Record<string, number>;
}

/** Configuration de la vraisemblance d'humanisation (#50). */
export interface LikelihoodConfig {
  positiveWeights: Record<string, number>;
  negativeWeights: Record<string, number>;
  nuanceWeights: Record<string, number>;
  negativeDampening: number;
}

/** Listes de mots/patterns pour la détection d'humanisation. */
export interface HumanizationLists {
  humanizerConnectors: string[];
  humanizerPhrases: string[];
  paraphraseSignals: string[];
  aiPhrases: string[];
  formalMarkers: string[];
  informalMarkers: string[];
  additionalConnectors: string[];
  structureConnectors: string[];
  approximations: string[];
  temporalMarkers: string[];
}

/** Configuration complète de la détection d'humanisation. */
export interface HumanizationKnowledge {
  minTextLength: number;
  scores: Record<string, HumanizationScoreConfig>;
  likelihood: LikelihoodConfig;
  classificationRules: ClassificationRule[];
  lists: HumanizationLists;
}

/** Configuration globale (composite + SUCKS + pattern engine). */
export interface GlobalConfig {
  /** Points max contribuable par les patterns. */
  maxPatternPoints: number;
  /** Longueur minimale du texte pour analyse (caractères). */
  minAnalysisLength: number;
  /** Nombre max d'exemples par défaut dans les détails. */
  maxExamples: number;
  /** Configuration SUCKS. */
  sucks: Record<string, SucksDimension>;
  /** Configuration du Pattern Engine. */
  patternEngine: PatternEngineConfig;
}