/**
 * Linguistic Intelligence Core (LIC) — Registre public.
 *
 * Point d'entrée unique pour toute la connaissance linguistique.
 * Aucune valeur métier (seuil, poids, recommandation) ne doit être
 * codée en dur dans les algorithmes — tout passe par ici.
 *
 * Usage :
 *   import { knowledge } from "./knowledge/registry";
 *   const config = knowledge.metric("entropy");   // MetricConfig
 *   const weight = knowledge.weight("burstiness"); // number
 *   const rules  = knowledge.details("voice");    // DetailRule[]
 *
 * Sprint 5 — Phase 0.
 */

import { METRIC_CONFIGS } from "./metrics";
import { DETAIL_RULES, CHECKLIST_RULES, GLOBAL_CONFIG } from "./evidence";
import type { MetricConfig, DetailRule, ChecklistRule, GlobalConfig } from "./types";

/**
 * API publique du Linguistic Intelligence Core.
 *
 * Design : objet singleton avec méthodes typées.
 * Pas de classe, pas de dépendance circulaire, pure lecture.
 */
export const knowledge = {
  // ── Métriques ──────────────────────────────────────────────────────

  /** Retourne la configuration complète d'une métrique. */
  metric(id: string): MetricConfig {
    const cfg = METRIC_CONFIGS[id];
    if (!cfg) throw new Error(`[LIC] Métrique inconnue : "${id}"`);
    return cfg;
  },

  /** Retourne le poids d'une métrique dans le score composite. */
  weight(id: string): number {
    return this.metric(id).weight;
  },

  /** Retourne un seuil nommé d'une métrique. */
  threshold(metricId: string, key: string): number {
    const thresholds = this.metric(metricId).thresholds;
    if (!thresholds || !(key in thresholds)) {
      throw new Error(`[LIC] Seuil inconnu : "${metricId}.${key}"`);
    }
    return thresholds[key];
  },

  /** Retourne un paramètre nommé d'une métrique. */
  param(metricId: string, key: string): number {
    const params = this.metric(metricId).params;
    if (!params || !(key in params)) {
      throw new Error(`[LIC] Paramètre inconnu : "${metricId}.${key}"`);
    }
    return params[key];
  },

  /** Retourne le multiplicateur d'une métrique (0 si non défini). */
  multiplier(id: string): number {
    return this.metric(id).multiplier ?? 0;
  },

  /** Toutes les configs métriques. */
  allMetrics(): Record<string, MetricConfig> {
    return METRIC_CONFIGS;
  },

  /** Poids composites (pour le score IA multi-signaux). */
  compositeWeights(): Record<string, number> {
    const weights: Record<string, number> = {};
    for (const [id, cfg] of Object.entries(METRIC_CONFIGS)) {
      if (cfg.weight > 0) weights[id] = cfg.weight;
    }
    return weights;
  },

  // ── Preuves et détails ─────────────────────────────────────────────

  /** Règles de détails pour une métrique donnée. */
  details(metricId: string): DetailRule[] {
    return DETAIL_RULES.filter((r) => r.metricId === metricId);
  },

  /** Toutes les règles de détails. */
  allDetails(): DetailRule[] {
    return DETAIL_RULES;
  },

  // ── Checklist ──────────────────────────────────────────────────────

  /** Toutes les règles de checklist. */
  checklist(): ChecklistRule[] {
    return CHECKLIST_RULES;
  },

  // ── Configuration globale ──────────────────────────────────────────

  /** Configuration globale (SUCKS, Pattern Engine, etc.). */
  global(): GlobalConfig {
    return GLOBAL_CONFIG;
  },
} as const;