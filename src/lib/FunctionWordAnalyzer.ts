/**
 * FunctionWordAnalyzer — 100% local, zéro dépendance.
 *
 * Analyse les mots fonctionnels (articles, prépositions, pronoms,
 * conjonctions, adverbes) dans un texte FR/EN.
 *
 * Décision 4 de la roadmap Sprint 2A révisée :
 * Remplace le POS Tagger lourd par une analyse basée sur des listes statiques.
 *
 * Utilisé par le module PassiveVoice (Sprint 2B) et disponible pour
 * les futurs modules.
 */

// ── Listes de mots fonctionnels ──────────────────────────────────────

const ARTICLES_FR = new Set(["le", "la", "les", "un", "une", "des", "du", "de", "d'", "l'", "au", "aux"]);
const ARTICLES_EN = new Set(["the", "a", "an", "some", "any", "no", "every", "each"]);

const PREPOSITIONS_FR = new Set([
  "de", "à", "en", "dans", "pour", "sur", "avec", "par", "sans", "entre",
  "vers", "contre", "chez", "avant", "après", "pendant", "depuis", "sous",
  "derrière", "devant", "dessus", "dessous", "auprès",
]);
const PREPOSITIONS_EN = new Set([
  "of", "in", "to", "for", "with", "on", "at", "by", "from", "into",
  "through", "between", "under", "over", "after", "before", "without",
  "during", "against", "among", "upon", "within",
]);

const PRONOUNS_FR = new Set([
  "je", "tu", "il", "elle", "nous", "vous", "ils", "elles", "on",
  "me", "te", "se", "le", "la", "les", "lui", "leur", "moi", "toi",
  "soi", "ce", "celui", "celle", "ceux", "celles", "qui", "que", "dont",
  "où", "lequel", "laquelle", "auxquels", "desquels",
]);
const PRONOUNS_EN = new Set([
  "i", "you", "he", "she", "it", "we", "they", "me", "him", "her",
  "us", "them", "myself", "yourself", "himself", "herself", "itself",
  "ourselves", "themselves", "this", "that", "these", "those", "who",
  "whom", "which", "whose", "what", "where", "when", "why", "how",
]);

const CONJUNCTIONS_FR = new Set([
  "et", "ou", "mais", "donc", "or", "ni", "car", "que", "si", "quand",
  "lorsque", "puisque", "parce", "bien", "quoique", "toutefois", "cependant",
  "néanmoins", "enfin", "ensuite", "sinon", "soit", "aussi",
]);
const CONJUNCTIONS_EN = new Set([
  "and", "or", "but", "so", "for", "nor", "yet", "because", "since",
  "although", "though", "while", "if", "when", "unless", "until",
  "whether", "however", "therefore", "moreover", "furthermore", "nevertheless",
  "meanwhile", "otherwise", "instead", "besides", "thus", "hence",
]);

const ADVERBS_FR = new Set([
  "très", "plus", "moins", "bien", "mal", "peu", "beaucoup", "tout",
  "aussi", "encore", "déjà", "jamais", "toujours", "souvent", "parfois",
  "rarement", "bientôt", "trop", "assez", "presque", "vraiment",
  "fortement", "clairement", "simplement", "naturellement", "généralement",
  "particulièrement", "effectivement", "actuellement", "réellement",
]);
const ADVERBS_EN = new Set([
  "very", "really", "quite", "also", "just", "still", "already", "never",
  "always", "often", "sometimes", "usually", "too", "enough", "almost",
  "particularly", "especially", "generally", "specifically", "certainly",
  "clearly", "simply", "naturally", "actually", "recently", "finally",
  "however", "therefore", "moreover", "furthermore",
]);

// ── Types ────────────────────────────────────────────────────────────

export interface FunctionWordResult {
  articleDensity: number;
  pronounDensity: number;
  prepositionDensity: number;
  conjunctionDensity: number;
  adverbDensity: number;
  functionWordRatio: number;
  counts: {
    articles: number;
    pronouns: number;
    prepositions: number;
    conjunctions: number;
    adverbs: number;
    totalFunction: number;
  };
}

// ── Analyse ──────────────────────────────────────────────────────────

/**
 * Analyse les mots fonctionnels dans une liste de mots (minuscules).
 * Retourne les densités (ratio par rapport au nombre total de mots)
 * et les comptages bruts.
 */
export function analyzeFunctionWords(words: string[]): FunctionWordResult {
  const wc = words.length;
  if (wc === 0) {
    return {
      articleDensity: 0, pronounDensity: 0, prepositionDensity: 0,
      conjunctionDensity: 0, adverbDensity: 0, functionWordRatio: 0,
      counts: { articles: 0, pronouns: 0, prepositions: 0, conjunctions: 0, adverbs: 0, totalFunction: 0 },
    };
  }

  // Fusion FR + EN
  const allArticles = new Set([...ARTICLES_FR, ...ARTICLES_EN]);
  const allPrepositions = new Set([...PREPOSITIONS_FR, ...PREPOSITIONS_EN]);
  const allPronouns = new Set([...PRONOUNS_FR, ...PRONOUNS_EN]);
  const allConjunctions = new Set([...CONJUNCTIONS_FR, ...CONJUNCTIONS_EN]);
  const allAdverbs = new Set([...ADVERBS_FR, ...ADVERBS_EN]);

  // Nettoyer les apostrophes pour le matching (l'homme → l')
  let articles = 0, pronouns = 0, prepositions = 0, conjunctions = 0, adverbs = 0;

  for (const w of words) {
    // Gérer les contractions : "l'", "d'", "qu'" etc.
    const clean = w.replace(/[''']/g, "'");
    if (allArticles.has(clean)) articles++;
    else if (allPrepositions.has(clean)) prepositions++;
    else if (allPronouns.has(clean)) pronouns++;
    else if (allConjunctions.has(clean)) conjunctions++;
    else if (allAdverbs.has(clean)) adverbs++;
  }

  const totalFunction = articles + pronouns + prepositions + conjunctions + adverbs;

  return {
    articleDensity: articles / wc,
    pronounDensity: pronouns / wc,
    prepositionDensity: prepositions / wc,
    conjunctionDensity: conjunctions / wc,
    adverbDensity: adverbs / wc,
    functionWordRatio: totalFunction / wc,
    counts: { articles, pronouns, prepositions, conjunctions, adverbs, totalFunction },
  };
}