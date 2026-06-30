# Algorithmes clés

## 1. Nettoyage (`cleaner.ts` - performClean)
Supprime les caractères invisibles hérités de copier-coller :
- U+00A0 (espace insécable) → espace normal
- U+202F (espace fine insécable) → espace normal
- Zero-width space/joiner/non-joiner (U+200B, U+200C, U+200D)
- BOM (U+FEFF)
- Marques directionnelles (U+200E, U+200F, U+061C)
- Soft hyphen, word joiner (U+00AD, U+2060, U+180E)

Retourne le nombre d'occurrences de chaque type et le total remplacé.

## 2. Humanisation (`humanizer.ts` - performHumanize)
Transformations locales pilotées par un niveau d'intensité
(`light`, `moderate`, `aggressive`) et un mode (`naturel`, `professionnel`, `académique`, `expert`, `personnel`) :

- Variation des transitions mécaniques (En effet, Cependant, De plus...)
- Suppression des artefacts de chatbot
- Remplacement du vocabulaire IA typique
- **Module 3** : Variation structurelle (remplacement des énumérations rigides : premièrement, deuxièmement...)
- **Module 4** : Suppression des connecteurs à fort risque (En outre, Il convient de noter que...)
- **Module 5** : Remplacement des phrases génériques IA (approche innovante, solution pertinente, enjeux majeurs...)
- **Module 7** : Ajout de contexte concret pour les formulations impersonnelles
- **Module 8** : Simplification des paraphrases artificielles (nominalisations, verbes faibles)
- Conversion ponctuelle de chiffres en lettres.

Chaque modification est tracée dans un `changeLog`
(type, original, remplacement, raison) exportable en JSON ou PDF.

Pipeline : Analyse → Réécriture → Vérification → Correction (boucle).

## 3. Détection IA (`textAnalysis.ts` - analyzeText)
Score global pondéré multi-signaux (conforme AWPA) :

| Module | Score | Mesure |
| :--- | :--- | :--- |
| **1. Prévisibilité** | `perplexityScore` | Ratio de mots très courants (proxy de perplexité) |
| **2. Burstiness** | `burstinessScore` | Uniformité de longueur des phrases (écart-type) |
| **3. Structure IA** | `structureScore` | Énumération rigide, symétrie des paragraphes, headers génériques, transitions systématiques |
| **4. Connecteurs** | `transitionScore` | Densité de connecteurs pondérés (`WEIGHTED_CONNECTORS`) |
| **5. Vocabulaire générique** | `voiceScore` + patterns | Dictionnaire `AI_PHRASES` avec poids de risque |
| **6. Répétition sémantique** | `semanticRepetitionScore` | Chevauchement de bigrammes entre phrases consécutives (proxy embeddings locaux) |
| **7. Personnalisation** | `personalizationScore` | Présence de références concrètes, expériences, exemples, chiffres |
| **8. Paraphrase IA** | `paraphraseScore` | Nominalisations artificielles, verbes faibles, reformulations inutiles |
| **9. Style Fingerprint** | `styleScore` + `styleFingerprint` | Empreinte multidimensionnelle comparée aux profils LLM vs humain |

Formule multi-signaux :
```
AI_SCORE = somme(poids_i × score_i) + min(maxPatternPoints, patternPoints)
```

Le score final est une probabilité, jamais un jugement.
Le rapport produit : « Ce texte présente des caractéristiques compatibles avec une génération IA ».

## 4. Anti-AI Writing Engine (AI_PATTERNS)
Base de données de ~45 motifs textuels (FR + EN) détectés par regex :
- Emphase artificielle, notoriété excessive, gérondifs superficiels
- Langage promotionnel, attributions vagues, squelette stéréotypé
- Équilibre forcé, vocabulaire IA, titre Case, emojis décoratifs
- Artefacts chatbot, conclusions génériques, parallèles négatifs
- Phrases génériques IA (Module 5), paraphrase IA (Module 8), absence de personnalisation (Module 7)

Chaque motif a : catégorie, sévérité (low/medium/high), points, regex, issue, suggestion.

## 5. Style Fingerprint (Module 9)
Vecteur multidimensionnel :
```
STYLE_VECTOR = {
  sentenceLength,        // longueur moyenne des phrases
  vocabularyDensity,     // TTR (type-token ratio)
  connectorRate,         // densité de connecteurs
  repetitionRate,        // 1 - ratio hapax
  complexity,            // longueur moyenne des mots
  personalMarkers        // pronoms personnels / phrase
}
```

## 6. ML Feature Extraction (`featureExtractor.ts`)
38 dimensions normalisées [0,1] :
- 7 scores heuristiques
- 7 features syntaxiques (longueur phrases, questions, voix passive...)
- 6 features lexicales (TTR, hapax, stopwords, bigrammes, chiffres)
- 4 features de patterns (connecteurs pondérés, phrases génériques, certitudes, énumérations)
- 4 features de structure (CV paragraphes, ratio connecteurs début, énumérations, nb paragraphes)
- 3 features sémantiques (répétition sémantique bigrammes)
- 3 features de personnalisation (densité références, pronoms, exemples)
- 2 features de paraphrase (nominalisations, verbes faibles)
- 2 features de style (répétition, TTR)

Toutes les analyses sont effectuées dans le navigateur, sans appel réseau.