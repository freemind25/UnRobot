/**
 * Module ParagraphBalance (AWPA — Équilibre des paragraphes)
 *
 * Mesure la régularité des tailles de paragraphes.
 * L'IA tend à produire des paragraphes de taille très uniforme,
 * tandis qu'un humain varie naturellement la longueur.
 *
 * Sprint 5 : thresholds → LIC
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";
import { clampScore as clamp } from "./utils";
import { knowledge } from "./knowledge/registry";


export const paragraphBalanceModule: AnalysisModule = {
  id: "paragraphBalance",
  label: "Équilibre des paragraphes",
  weight: knowledge.weight("paragraphBalance"),

  execute(text: string, _ctx: AnalysisContext): AnalysisModuleResult {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    if (paragraphs.length < 2) {
      return { score: 0, data: { paragraphCount: 0, cv: 0 } };
    }

    const cfg = knowledge.metric("paragraphBalance");
    const t = cfg.thresholds!;
    const p = cfg.params!;

    const paraLengths = paragraphs.map((pp) => pp.trim().split(/\s+/).length);
    const avg = paraLengths.reduce((a, b) => a + b, 0) / paraLengths.length;
    const variance = paraLengths.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / paraLengths.length;
    const stdDev = Math.sqrt(variance);
    const cv = avg > 0 ? stdDev / avg : 0;

    // Courbe de scoring via LIC
    let score: number;
    if (cv < t.cvCritical) score = p.criticalScore;
    else if (cv < t.cvWarning) score = p.warningBase + (t.cvWarning - cv) / (t.cvWarning - t.cvCritical) * p.warningRange;
    else if (cv < t.cvNormal) score = p.normalBase + (t.cvNormal - cv) / (t.cvNormal - t.cvWarning) * p.normalRange;
    else score = Math.max(0, p.naturalBase - (cv - t.cvNormal) * p.naturalSlope);

    return {
      score: clamp(score),
      data: {
        paragraphCount: paragraphs.length,
        cv: Math.round(cv * 1000) / 1000,
        avgParaLength: Math.round(avg * 10) / 10,
      },
    };
  },
};