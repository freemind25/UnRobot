/**
 * Module TransitionDensity (AWPA — Connecteurs pondérés)
 *
 * Mesure la densité de connecteurs logiques pondérés dans le texte.
 * L'IA surutilise les connecteurs ("en outre", "par conséquent", etc.)
 * pour donner une fausse cohésion.
 *
 * Sprint 5 : weight + multiplier → LIC
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";
import { WEIGHTED_CONNECTORS } from "./connectors";
import { knowledge } from "./knowledge/registry";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const transitionDensityModule: AnalysisModule = {
  id: "transition",
  label: "Transitions mécaniques",
  weight: knowledge.weight("transition"),

  execute(text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { sentences } = ctx;
    const multiplier = knowledge.multiplier("transition");
    let transCount = 0;
    let transWeightedCount = 0;
    const transFound: string[] = [];

    WEIGHTED_CONNECTORS.forEach(({ connector, weight }) => {
      const escaped = connector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const m = text.match(new RegExp(escaped, "gi")) || [];
      if (m.length) {
        transFound.push(connector);
        transCount += m.length;
        transWeightedCount += m.length * weight;
      }
    });

    const connectorDensity = sentences.length > 0 ? transWeightedCount / sentences.length : 0;
    const score = clamp(connectorDensity * multiplier);

    return {
      score,
      data: { transCount, connectorDensity: Math.round(connectorDensity * 1000) / 1000, transFoundJson: JSON.stringify(transFound.slice(0, knowledge.global().maxExamples)) },
    };
  },
};