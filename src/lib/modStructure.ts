/**
 * Module Structure (AWPA — Structure IA)
 *
 * Détecte les structures trop parfaites :
 * - Plans rigides (premièrement, deuxièmement...)
 * - Symétrie excessive des paragraphes
 * - Transitions artificielles systématiques
 * - Headers génériques (Introduction, Conclusion, etc.)
 *
 * Sprint 5 : magic numbers → LIC
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";
import { clampScore as clamp } from "./utils";
import { knowledge } from "./knowledge/registry";


const ENUMERATION_RE = /\b(premi[eè]rement|deuxi[eè]mement|troisi[eè]mement|ensuite|enfin)\b/gi;
const GENERIC_HEADERS_RE = /^##\s*(Introduction|Points clés|Avantages|Inconvénients|Défis|Conclusion|Développement|Résumé|Summary|Conclusion)$/gim;
const CONNECTOR_START_RE = /^\s*(en effet|cependant|de plus|par ailleurs|en outre|par conséquent|néanmoins|toutefois|however|moreover|furthermore|therefore|firstly|secondly|finally|ensuite)/i;

export const structureModule: AnalysisModule = {
  id: "structure",
  label: "Structure IA",
  weight: knowledge.weight("structure"),

  execute(text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { sentences } = ctx;
    if (sentences.length === 0) return { score: 0 };

    const cfg = knowledge.metric("structure");
    const t = cfg.thresholds!;
    const p = cfg.params!;

    let structPoints = 0;

    // 1. Énumération ordonnée
    const enumerations = (text.match(ENUMERATION_RE) || []).length;
    structPoints += enumerations * p.enumPoints;

    // 2. Symétrie des paragraphes
    const paragraphs = text.split(/\n\s*\n/).filter((pp) => pp.trim().length > 0);
    let paraCV = 0;
    if (paragraphs.length >= 3) {
      const paraLengths = paragraphs.map((pp) => pp.trim().split(/\s+/).length);
      const avgPara = paraLengths.reduce((a, b) => a + b, 0) / paraLengths.length;
      const paraVariance = paraLengths.reduce((a, b) => a + Math.pow(b - avgPara, 2), 0) / paraLengths.length;
      paraCV = avgPara > 0 ? Math.sqrt(paraVariance) / avgPara : 0;
      if (paraCV < t.paraCVLow) structPoints += p.symmetryHighPoints;
      else if (paraCV < t.paraCVMid) structPoints += p.symmetryMidPoints;
    }

    // 3. Headers génériques
    const genericHeaders = (text.match(GENERIC_HEADERS_RE) || []).length;
    structPoints += genericHeaders * p.headerPoints;

    // 4. Connecteurs en début de phrase
    const sentencesWithConnector = sentences.filter((s) =>
      CONNECTOR_START_RE.test(s.trim())
    ).length;
    const connectorStartRatio = sentences.length > 0 ? sentencesWithConnector / sentences.length : 0;
    if (connectorStartRatio > t.connectorHigh) structPoints += p.connectorHighPoints;
    else if (connectorStartRatio > t.connectorMid) structPoints += p.connectorMidPoints;

    const score = clamp(structPoints);

    return {
      score,
      data: {
        enumerationCount: enumerations,
        paragraphCV: Math.round(paraCV * 1000) / 1000,
        genericHeaderCount: genericHeaders,
        connectorStartRatio: Math.round(connectorStartRatio * 1000) / 1000,
      },
    };
  },
};