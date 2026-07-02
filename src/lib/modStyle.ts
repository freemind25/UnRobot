/**
 * Module Style (AWPA — Style Fingerprint + Style Score)
 *
 * Crée une empreinte de style multidimensionnelle et un score
 * comparant le texte à un profil LLM typique.
 *
 * Sprint 5 : magic numbers → LIC
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";
import { clampScore as clamp } from "./utils";
import type { StyleFingerprint } from "./textAnalysis";
import { knowledge } from "./knowledge/registry";


const PERSONAL_RE = /\b(je|nous|notre|nos|mon|ma|mes|moi)\b/gi;

// Copie locale des connecteurs (pour éviter import circulaire avec textAnalysis.ts)
const CONNECTOR_STRINGS = [
  "en outre", "il convient de noter que", "cette approche permet de",
  "il est important de souligner", "par conséquent", "en effet", "cependant",
  "de plus", "par ailleurs", "néanmoins", "toutefois", "de surcroît",
  "en conclusion", "however", "moreover", "furthermore", "therefore",
  "consequently", "in conclusion",
];

function computeTransCount(text: string): number {
  let count = 0;
  for (const c of CONNECTOR_STRINGS) {
    const re = new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    const matches = text.match(re);
    if (matches) count += matches.length;
  }
  return count;
}

export const styleModule: AnalysisModule = {
  id: "style",
  label: "Style",
  weight: knowledge.weight("style"),

  execute(text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { words, sentences, wordFreq } = ctx;
    const wc = words.length;
    const sc = sentences.length;

    if (wc === 0 || sc === 0) {
      const emptyFP: StyleFingerprint = { sentenceLength: 0, vocabularyDensity: 0, connectorRate: 0, repetitionRate: 0, complexity: 0, personalMarkers: 0 };
      return { score: 0, data: { fingerprint: JSON.stringify(emptyFP) } };
    }

    const cfg = knowledge.metric("style");
    const t = cfg.thresholds!;
    const p = cfg.params!;

    // Transition density
    const transCount = computeTransCount(text);
    const transDensity = wc > 0 ? transCount / wc : 0;

    // sentenceLength
    const avgSentLen = wc / sc;

    // vocabularyDensity (TTR)
    const ttr = wc > 0 ? ctx.uniqueWords.size / wc : 0;

    // repetitionRate (hapax ratio inverse)
    const hapaxCount = [...wordFreq.values()].filter((v) => v === 1).length;
    const repetitionRate = wc > 0 ? 1 - hapaxCount / wc : 0;

    // complexity (avg word length)
    const avgWordLen = words.reduce((s, w) => s + w.length, 0) / wc;

    // personalMarkers
    const personalPronouns = (text.match(PERSONAL_RE) || []).length;
    const personalMarkers = personalPronouns / sc;

    const fingerprint: StyleFingerprint = {
      sentenceLength: Math.round(avgSentLen * 10) / 10,
      vocabularyDensity: Math.round(ttr * 1000) / 1000,
      connectorRate: Math.round(transDensity * 1000) / 1000,
      repetitionRate: Math.round(repetitionRate * 1000) / 1000,
      complexity: Math.round(avgWordLen * 10) / 10,
      personalMarkers: Math.round(personalMarkers * 1000) / 1000,
    };

    // Style score : seuils et points via LIC
    const score = clamp(
      (fingerprint.sentenceLength > t.sentLenMin && fingerprint.sentenceLength < t.sentLenMax ? p.sentLenPoints : 0) +
      (fingerprint.connectorRate > t.connectorRateMin ? p.connectorPoints : 0) +
      (fingerprint.personalMarkers < t.personalMarkersMax ? p.personalPoints : 0) +
      (fingerprint.vocabularyDensity < t.vocabDensityMax ? p.vocabPoints : 0)
    );

    return {
      score,
      data: {
        fingerprint: JSON.stringify(fingerprint),
        transCount,
      },
    };
  },
};