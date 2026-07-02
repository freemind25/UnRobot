/**
 * Module PassiveVoice (AWPA — Voix passive)
 *
 * Détecte les constructions à la voix passive en FR et EN.
 * Sprint 5 : minWords + multiplier + proximityWindow → LIC
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";
import { knowledge } from "./knowledge/registry";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// ── Patterns de voix passive ──────────────────────────────────────

const FR_AUXILIARIES = /\b(est|était|sera|serait|sont|étaient|seront|seraient|a été|ont été|avait été|auront été|aient été)\b/gi;
const FR_PARTICIPLE = /\b\w+(é|ée|és|ées|is|it|ie|ies|u|ue|us|ues)\b/gi;

// EN : auxiliary + past participle
const EN_AUXILIARIES = /\b(is|are|was|were|be|been|being|has been|have been|had been)\b/gi;
const EN_PARTICIPLE = /\b\w+(ed|en|t|wn)\b/gi;

function detectPassive(text: string, lang: "fr" | "en", proximityWindow: number): { count: number; density: number } {
  let auxMatches: string[] = [];
  let partMatches: string[] = [];
  let auxPattern: RegExp;
  let partPattern: RegExp;

  if (lang === "fr") {
    auxMatches = (text.match(FR_AUXILIARIES) || []).map(m => m[0]);
    partMatches = (text.match(FR_PARTICIPLE) || []).map(m => m[0]);
    auxPattern = FR_AUXILIARIES;
    partPattern = FR_PARTICIPLE;
  } else {
    auxMatches = (text.match(EN_AUXILIARIES) || []).map(m => m[0]);
    partMatches = (text.match(EN_PARTICIPLE) || []).map(m => m[0]);
    auxPattern = EN_AUXILIARIES;
    partPattern = EN_PARTICIPLE;
  }

  // Vérifier la proximité : auxiliaire suivi d'un participe dans les N mots suivants
  let count = 0;
  const WORD_RE = /\b[\wàâäéèêëîïôöùûüç]+\b/gi;
  const allWords = [...text.matchAll(WORD_RE)].map((m) => ({
    word: m[0],
    index: m.index,
  }));

  for (const auxMatch of auxMatches) {
    const auxIndex = text.indexOf(auxMatch, 0);
    const auxWordIdx = allWords.findIndex((w) => w.index >= auxIndex);
    if (auxWordIdx === -1) continue;

    for (let i = auxWordIdx + 1; i <= Math.min(auxWordIdx + proximityWindow, allWords.length - 1); i++) {
      const w = allWords[i].word.toLowerCase();
      if (lang === "fr") {
        if (/(é|ée|és|ées|is|it|ie|ies|u|ue|us|ues)$/.test(w)) {
          count++;
          break;
        }
      } else {
        if (/(ed|en|t|wn)$/.test(w)) {
          count++;
          break;
        }
      }
    }
  }

  // Estimer le nombre de phrases pour la densité
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const density = sentences.length > 0 ? count / sentences.length : 0;

  return { count, density };
}

// ── Détection de langue rapide ─────────────────────────────────────

const FR_MARKERS = new Set(["le", "la", "les", "de", "des", "un", "une", "et", "à", "en", "que", "qui", "est", "ce", "il", "elle", "dans", "pour", "ne", "pas", "se"]);
const EN_MARKERS = new Set(["the", "of", "and", "to", "in", "is", "a", "that", "it", "for", "on", "with", "as", "be", "are", "was", "were", "this", "from", "at"]);

function quickLangDetect(words: string[]): "fr" | "en" {
  let fr = 0, en = 0;
  for (const w of words) {
    if (FR_MARKERS.has(w)) fr++;
    if (EN_MARKERS.has(w)) en++;
  }
  return fr >= en ? "fr" : "en";
}

// ── Module ─────────────────────────────────────────────────────────

export const passiveVoiceModule: AnalysisModule = {
  id: "passiveVoice",
  label: "Voix passive",
  weight: knowledge.weight("passiveVoice"),

  execute(text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { words } = ctx;
    const cfg = knowledge.metric("passiveVoice");

    if (words.length < (cfg.minWords ?? 0)) {
      return { score: 0, data: { count: 0, density: 0 } };
    }

    const lang = quickLangDetect(words);
    const proximityWindow = cfg.params!.proximityWindow;
    const multiplier = knowledge.multiplier("passiveVoice");
    const { count, density } = detectPassive(text, lang, proximityWindow);

    const score = clamp(density * multiplier);

    return {
      score,
      data: { count, density: Math.round(density * 1000) / 1000, lang },
    };
  },
};