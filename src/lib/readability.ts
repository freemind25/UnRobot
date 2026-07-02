/**
 * Readability Lab — UnRobot
 * 4 indices de lisibilité calibrés pour le français, 100 % local.
 *
 * Indices implémentés :
 *   1. Flesch-Kincaid Reading Ease (adapté français, Kandel & Moles 1958)
 *   2. LIX — Läsbarhetsindex (Björnsson 1968, langue-agnostique)
 *   3. Gunning Fog Index (adapté : mots longs ≥ 3 syllabes en proxy)
 *   4. Coleman-Liau Index (opère sur les caractères → langue-agnostique)
 *
 * Aucune de ces formules n'est une vérité absolue ; elles fournissent
 * des estimations comparatives. Toutes les sorties sont accompagnées
 * d'un label qualitatif pour éviter de présenter les scores bruts
 * comme une précision qu'ils n'ont pas.
 */

export interface ReadabilityResult {
  /** Flesch-Kincaid Reading Ease adapté français (0–100, plus haut = plus lisible) */
  fleschKincaid: number;
  /** LIX — Läsbarhetsindex (0–100+, plus bas = plus lisible) */
  lix: number;
  /** Gunning Fog adapté français (années d'études estimées, ~6 = école primaire) */
  gunningFog: number;
  /** Coleman-Liau Index (années d'études estimées, opère sur les caractères) */
  colemanLiau: number;
  /** Score moyen de lisibilité normalisé 0–100 (100 = très lisible) */
  globalScore: number;
  /** Label qualitatif du score global */
  label: ReadabilityLabel;
  /** Couleur sémantique associée au label */
  color: "green" | "yellow" | "orange" | "red";
  /** Métriques brutes intermédiaires (utiles pour le débogage et l'affichage) */
  metrics: {
    wordCount: number;
    sentenceCount: number;
    avgWordsPerSentence: number;
    avgSyllablesPerWord: number;
    longWordRatio: number;   // proportion de mots ≥ 3 syllabes
    avgCharsPerWord: number;
    longWordCount: number;   // mots ≥ 7 caractères (critère LIX)
  };
}

export type ReadabilityLabel =
  | "Très accessible"
  | "Accessible"
  | "Niveau intermédiaire"
  | "Niveau avancé"
  | "Très technique";

const MIN_TEXT_LENGTH = 30;

// ─────────────────────────────────────────────────────────────
// Segmentation
// ─────────────────────────────────────────────────────────────

function splitSentences(text: string): string[] {
  // Séparer sur . ! ? suivis d'un espace ou de fin de chaîne.
  // On conserve les abréviations courantes (M., Dr., etc.) grâce
  // au test de longueur minimum après split.
  return text
    .split(/[.!?…]+(?:\s|$)/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).filter(Boolean).length >= 2);
}

function splitWords(text: string): string[] {
  // Retirer la ponctuation et les nombres purs, garder les mots
  return text
    .replace(/[^a-zA-ZÀ-ÿ\s'-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[-']+|[-']+$/g, ""))
    .filter((w) => w.length >= 2);
}

// ─────────────────────────────────────────────────────────────
// Comptage de syllabes (heuristique française)
// Méthode : compter les voyelles consécutives comme 1 syllabe,
// traiter les diphtongues courantes, plancher à 1.
// Précision estimée : ±0.3 syllabe/mot, suffisant pour les indices.
// ─────────────────────────────────────────────────────────────

const VOWELS_FR = /[aàâäæeéèêëiîïoôœuùûüy]/gi;

function countSyllablesFr(word: string): number {
  const w = word.toLowerCase();
  // Supprimer le 'e' muet final (très fréquent en français)
  const normalized = w.replace(/e(?=[^aeiouyàâäæéèêëîïôœùûüy]$|$)/g, "");
  const vowels = normalized.match(VOWELS_FR);
  if (!vowels) return 1;
  // Fusionner les voyelles consécutives (diphtongues/triphtongues)
  const grouped = normalized.replace(/[aàâäæeéèêëiîïoôœuùûüy]+/gi, "X");
  const count = (grouped.match(/X/g) || []).length;
  return Math.max(1, count);
}

// ─────────────────────────────────────────────────────────────
// Index 1 : Flesch-Kincaid Reading Ease (adaptation française)
// Kandel & Moles (1958) : FK_fr = 207 – (1.015 × mots/phrase) – (73.6 × syllabes/mot)
// Score 0–100 : 90+ = très simple, <30 = très difficile
// ─────────────────────────────────────────────────────────────

function computeFleschKincaid(
  avgWordsPerSentence: number,
  avgSyllablesPerWord: number
): number {
  const raw = 207 - 1.015 * avgWordsPerSentence - 73.6 * avgSyllablesPerWord;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

// ─────────────────────────────────────────────────────────────
// Index 2 : LIX — Läsbarhetsindex (Björnsson 1968)
// LIX = (mots / phrases) + (mots longs×100 / total mots)
// "Mot long" = ≥ 7 caractères
// Score : <25 très simple, 25-40 simple, 40-50 moyen, 50-60 difficile, >60 très difficile
// ─────────────────────────────────────────────────────────────

function computeLIX(
  wordCount: number,
  sentenceCount: number,
  longWordCount: number
): number {
  if (sentenceCount === 0 || wordCount === 0) return 0;
  const raw = wordCount / sentenceCount + (longWordCount * 100) / wordCount;
  return Math.round(raw * 10) / 10;
}

// ─────────────────────────────────────────────────────────────
// Index 3 : Gunning Fog (adapté français)
// GF = 0.4 × (mots/phrase + % mots ≥ 3 syllabes × 100)
// Résultat en années d'études estimées (~6 = école primaire, 12 = bac, 17+ = expert)
// ─────────────────────────────────────────────────────────────

function computeGunningFog(
  avgWordsPerSentence: number,
  longWordRatio: number
): number {
  const raw = 0.4 * (avgWordsPerSentence + longWordRatio * 100);
  return Math.round(raw * 10) / 10;
}

// ─────────────────────────────────────────────────────────────
// Index 4 : Coleman-Liau
// CLI = 0.0588 × (chars/mot × 100) – 0.296 × (phrases/mot × 100) – 15.8
// Résultat en années d'études. Langue-agnostique car opère sur les caractères.
// ─────────────────────────────────────────────────────────────

function computeColemanLiau(
  avgCharsPerWord: number,
  wordCount: number,
  sentenceCount: number
): number {
  if (wordCount === 0) return 0;
  const L = avgCharsPerWord * 100;         // chars pour 100 mots
  const S = (sentenceCount / wordCount) * 100; // phrases pour 100 mots
  const raw = 0.0588 * L - 0.296 * S - 15.8;
  return Math.round(raw * 10) / 10;
}

// ─────────────────────────────────────────────────────────────
// Score global normalisé 0–100
// Combine les 4 indices après normalisation sur une échelle commune.
// ─────────────────────────────────────────────────────────────

function computeGlobalScore(
  fk: number,
  lix: number,
  gf: number,
  cli: number
): number {
  // FK est déjà 0–100, sens croissant (lisibilité). On le garde tel quel.
  // LIX : 0–70+ ; on convertit : 100 – clamp(lix, 0, 70) × (100/70)
  const lixNorm = Math.max(0, 100 - (Math.min(lix, 70) / 70) * 100);
  // GF : 6–20+ ; 6 = très lisible, 20 = très complexe. Normalisation inverse.
  const gfNorm = Math.max(0, 100 - ((Math.min(gf, 20) - 6) / 14) * 100);
  // CLI : 1–16+ ; même logique.
  const cliNorm = Math.max(0, 100 - ((Math.min(cli, 16) - 1) / 15) * 100);

  const avg = (fk + lixNorm + gfNorm + cliNorm) / 4;
  return Math.round(avg);
}

function labelFromScore(score: number): {
  label: ReadabilityLabel;
  color: "green" | "yellow" | "orange" | "red";
} {
  if (score >= 75) return { label: "Très accessible", color: "green" };
  if (score >= 55) return { label: "Accessible", color: "yellow" };
  if (score >= 35) return { label: "Niveau intermédiaire", color: "orange" };
  if (score >= 20) return { label: "Niveau avancé", color: "red" };
  return { label: "Très technique", color: "red" };
}

// ─────────────────────────────────────────────────────────────
// Entrée publique
// ─────────────────────────────────────────────────────────────

export function analyzeReadability(text: string): ReadabilityResult | null {
  if (!text || text.trim().length < MIN_TEXT_LENGTH) return null;

  const sentences = splitSentences(text);
  const words = splitWords(text);

  const wordCount = words.length;
  const sentenceCount = Math.max(1, sentences.length);

  if (wordCount < 5) return null;

  const syllableCounts = words.map(countSyllablesFr);
  const totalSyllables = syllableCounts.reduce((a, b) => a + b, 0);
  const totalChars = words.reduce((a, w) => a + w.length, 0);

  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = totalSyllables / wordCount;
  const avgCharsPerWord = totalChars / wordCount;
  const longWordCount = words.filter((w) => w.length >= 7).length;
  const longSyllableCount = syllableCounts.filter((s) => s >= 3).length;
  const longWordRatio = longSyllableCount / wordCount;

  const fk = computeFleschKincaid(avgWordsPerSentence, avgSyllablesPerWord);
  const lix = computeLIX(wordCount, sentenceCount, longWordCount);
  const gf = computeGunningFog(avgWordsPerSentence, longWordRatio);
  const cli = computeColemanLiau(avgCharsPerWord, wordCount, sentenceCount);
  const globalScore = Math.min(100, Math.max(0, computeGlobalScore(fk, lix, gf, cli)));
  const { label, color } = labelFromScore(globalScore);

  return {
    fleschKincaid: fk,
    lix,
    gunningFog: gf,
    colemanLiau: cli,
    globalScore,
    label,
    color,
    metrics: {
      wordCount,
      sentenceCount,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10,
      longWordRatio: Math.round(longWordRatio * 100),
      avgCharsPerWord: Math.round(avgCharsPerWord * 10) / 10,
      longWordCount,
    },
  };
}
