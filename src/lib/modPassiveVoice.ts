/**
 * Module PassiveVoice (AWPA — Voix passive)
 *
 * Détecte les constructions à la voix passive en FR et EN.
 * L'IA surutilise la voix passive (ton impersonnel, formel).
 *
 * FR : "est/été/sont/sera/seraient + participe passé"
 * EN : "is/are/was/were/been/being + past participle"
 *
 * Utilise FunctionWordAnalyzer pour les auxiliaires.
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// ── Patterns de voix passive ──────────────────────────────────────

// FR : auxiliaire + participe passé (mots se terminant par -é, -ée, -és, -ées, -i, -ie, -is, -it, -u, -ue, -us)
const FR_AUXILIARIES = /\b(est|était|sera|serait|sont|étaient|seront|seraient|a été|ont été|avait été|auront été|aient été)\b/gi;
const FR_PARTICIPLE = /\b\w+(é|ée|és|ées|is|it|ie|ies|u|ue|us|ues)\b/gi;

// EN : auxiliary + past participle
const EN_AUXILIARIES = /\b(is|are|was|were|be|been|being|has been|have been|had been)\b/gi;
const EN_PARTICIPLE = /\b\w+(ed|en|t|wn)\b/gi;

function detectPassive(text: string, lang: "fr" | "en"): { count: number; density: number } {
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

  // Vérifier la proximité : auxiliaire suivi d'un participe dans les 5 mots suivants
  let count = 0;
  const WORD_RE = /\b[\wàâäéèêëîïôöùûüç]+\b/gi;
  const allWords = [...text.matchAll(WORD_RE)].map((m) => ({
    word: m[0],
    index: m.index,
  }));

  for (const auxMatch of auxMatches) {
    const auxIndex = text.indexOf(auxMatch, 0);
    // Chercher un participe dans les 5 mots suivants
    const auxWordIdx = allWords.findIndex((w) => w.index >= auxIndex);
    if (auxWordIdx === -1) continue;

    for (let i = auxWordIdx + 1; i <= Math.min(auxWordIdx + 5, allWords.length - 1); i++) {
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
  weight: 0.0, // Observationnel

  execute(text: string, ctx: AnalysisContext): AnalysisModuleResult {
    const { words } = ctx;
    if (words.length < 15) {
      return { score: 0, data: { count: 0, density: 0 } };
    }

    const lang = quickLangDetect(words);
    const { count, density } = detectPassive(text, lang);

    // Score : densité de passive par phrase
    // < 0.1 : rare → score bas (humain)
    // 0.1-0.2 : normal → score moyen
    // > 0.2 : fréquent → score élevé (IA)
    const score = clamp(density * 300);

    return {
      score,
      data: { count, density: Math.round(density * 1000) / 1000, lang },
    };
  },
};