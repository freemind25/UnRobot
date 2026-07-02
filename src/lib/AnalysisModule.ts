/**
 * Contrat du registre de modules d'analyse.
 *
 * Le registre permet d'extraire progressivement les calculs de textAnalysis.ts
 * dans des fichiers indépendants, sans changer le flux principal.
 *
 * Sprint 2A — PR1 : interfaces uniquement, aucun comportement modifié.
 */

/** Contexte partagé pré-calculé par analyzeText, passé à chaque module. */
export interface AnalysisContext {
  /** Phrases découpées (via splitSentences). */
  sentences: string[];
  /** Mots du texte en minuscules. */
  words: string[];
  /** Longueur en mots de chaque phrase. */
  sentenceLengths: number[];
  /** Fréquence d'apparition de chaque mot (minuscule → compteur). */
  wordFreq: Map<string, number>;
  /** Ensemble des mots uniques (minuscule). */
  uniqueWords: Set<string>;
  /** Nombre de caractères du texte brut. */
  textLength: number;
}

/** Résultat retourné par un module d'analyse. */
export interface AnalysisModuleResult {
  /** Score principal 0-100 (plus élevé = plus probablement IA). */
  score: number;
  /** Données supplémentaires pour les autres modules ou l'orchestrateur. */
  data?: Record<string, number | string | boolean>;
}

/** Contrat d'un module d'analyse enregistré dans le registre. */
export interface AnalysisModule {
  /** Identifiant unique (ex: "burstiness", "vocabulary"). */
  id: string;
  /** Label lisible en français (ex: "Variation des phrases"). */
  label: string;
  /** Poids dans le score composite (0-1). La somme des poids doit ≈ 1.0. */
  weight: number;
  /** Exécute l'analyse et retourne le score. Pure, déterministe. */
  execute(text: string, ctx: AnalysisContext): AnalysisModuleResult;
}