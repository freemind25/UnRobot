/**
 * Patterns IA — Anti-AI Writing Engine.
 *
 * Motifs textuels typiques de l'IA (FR + EN), 100% local.
 * Basé sur le guide Wikipedia « Signs of AI writing » + extensions locales.
 *
 * Extrait de textAnalysis.ts (Sprint 4 PR1).
 */

import type { Severity } from "./textAnalysis";

export interface PatternDef {
  category: string;
  severity: Severity;
  points: number;
  regex: RegExp;
  issue: string;
  suggestion: string;
}

export const AI_PATTERNS: PatternDef[] = [  {
    category: "Emphase artificielle",
    severity: "high",
    points: 8,
    regex: /\b(constitue un témoignage|joue un rôle (vital|significatif|crucial|déterminant)|met en lumière son importance|reflète une tendance plus large|ouvrant la voie à|marquant un tournant|façonnant le|point central|marque indélébile|profondément ancré|contribuant à)\b/gi,
    issue: "L'importance est gonflée artificiellement avec des formules vides.",
    suggestion: "Énoncez les faits directement, sans affirmer leur importance.",
  },

  // #2 Emphase sur la notoriété
  {
    category: "Notoriété excessive",
    severity: "medium",
    points: 5,
    regex: /\b(couverture (indépendante|média)|rédigé par un expert reconnu|présence active sur les réseaux| largement cité)\b/gi,
    issue: "L'IA assomme le lecteur avec des affirmations de notoriété sans contexte.",
    suggestion: "Citez la source, le média et la date précisément, ou supprimez.",
  },

  // #3 Analyses superficielles en « -ant »
  {
    category: "Gérondifs superficiels",
    severity: "high",
    points: 7,
    regex: /\b(soulignant|mettant en (évidence|avant)|reflétant|symbolisant|contribuant à|cultivant|favorisant|englobant|illustrant)\s+/gi,
    issue: "Participes présents accrochés en fin de phrase pour donner une fausse profondeur.",
    suggestion: "Réécrivez avec un verbe conjugué ou supprimez la proposition.",
  },

  // #4 Langage promotionnel
  {
    category: "Langage promotionnel",
    severity: "high",
    points: 7,
    regex: /\b(vibrant|au riche patrimoine|beauté naturelle|somptueux|à couper le souffle|incontournable|révolutionnaire|réputé|niché|au cœur de|illustre parfaitement)\b/gi,
    issue: "Ton promotionnel et publicitaire incompatible avec un texte neutre ou informatif.",
    suggestion: "Remplacez par des descriptions factuelles.",
  },

  // #5 Attributions vagues
  {
    category: "Attributions vagues",
    severity: "medium",
    points: 5,
    regex: /\b(des (rapports sectoriels|observateurs ont relevé|experts estiment|critiques avancent|sources|publications))\b/gi,
    issue: "Opinions attribuées à des autorités vagues sans source précise.",
    suggestion: "Nommez l'auteur, l'étude ou le média précisément.",
  },

  // #6 Section « Défis et perspectives »
  {
    category: "Squelette stéréotypé",
    severity: "high",
    points: 8,
    regex: /(?:malgré (son|sa|ces|les)\s+\w+.*(?:fait face à|rencontre|doit faire face à)\s+(?:plusieurs\s+)?défis|(?:défis et|perspectives d'avenir|malgré ces défis))/gi,
    issue: "Section « Défis » stéréotypée typique des textes IA.",
    suggestion: "Remplacez par des faits précis : quels problèmes, quelles dates, quelles réponses.",
  },

  // ── MOTIFS DE LANGUE ET GRAMMAIRE ──────────────────────────────────

  // #8 Équilibre forcé
  {
    category: "Équilibre forcé",
    severity: "high",
    points: 8,
    regex: /\bd'un côté[^.]+de l'autre côté/gi,
    issue: "Fausse symétrie « d'un côté... de l'autre » imposée même quand unjustifiée.",
    suggestion: "Prenez position au lieu de tout équilibrer artificiellement.",
  },

  // #9 Vocabulaire typique IA
  {
    category: "Vocabulaire IA",
    severity: "high",
    points: 6,
    regex: /\b(par ailleurs|s'aligner sur|explorer en profondeur|durable|pérenne|renforcer|favoriser|susciter|mettre en lumière|déterminant|tapisserie|témoignage|souligner|précieux|vibrant|paysage (en constante évolution|technologique|numérique))\b/gi,
    issue: "Mots qui apparaissent bien plus fréquemment dans les textes post-2023.",
    suggestion: "Utilisez des synonymes courants ou reformulez.",
  },

  // #10 Vocabulaire trop soutenu
  {
    category: "Vocabulaire soutenu",
    severity: "medium",
    points: 4,
    regex: /\b(s'avérer nécessaire|s'efforcer de|à proximité immédiate de|préalablement à|postérieurement à|procéder au commencement de)\b/gi,
    issue: "Tournures multi-syllabiques là où un mot court dirait la même chose.",
    suggestion: "Utilisez : falloir, essayer, près de, avant, après, démarrer.",
  },

  // #11 Évitement du verbe « être »
  {
    category: "Contournement de « être »",
    severity: "medium",
    points: 4,
    regex: /\b(se présente comme|constitue (un|une)|représente (un|une)|offre un(e?)\s)/gi,
    issue: "L'IA remplace « être » par des tournures élaborées.",
    suggestion: "Utilisez simplement « est » ou « sont ».",
  },

  // #12 Parallélismes négatifs
  {
    category: "Parallélisme négatif",
    severity: "high",
    points: 9,
    regex: /(?:il ne s'agit pas (seulement|juste) de[^.,;]+?[-–—,]\s*(c'est|il s'agit)|n'est pas (seulement|juste) un[^.,;]+?[-–—,]\s*(c'est|c'est une)|isn't just[^.,;]+?[-–—,]\s*(it's|they're))/gi,
    issue: "Structure « Il ne s'agit pas seulement de X — c'est Y » surutilisée par l'IA.",
    suggestion: "Affirmez l'idée directement.",
  },

  // #13 Formule du trois
  {
    category: "Formule du trois",
    severity: "medium",
    points: 5,
    regex: /(?:\w+(?:e|ent|ons|ez),\s*\w+(?:e|ent|ons|ez)\s+et\s+\w+(?:e|ent|ons|ez)){2,}/gi,
    issue: "Regroupements artificiels en trois pour paraître exhaustif.",
    suggestion: "Ne listez que ce qui est nécessaire.",
  },

  // #14 Variation élégante (cycle de synonymes)
  // (détecté via le voiceScore et la TTR, pas de regex simple)

  // #15 Fausses échelles
  {
    category: "Fausse échelle",
    severity: "medium",
    points: 5,
    regex: /de\s+.+?\s+à\s+.+?,\s*de\s+.+?\s+à\s+/gi,
    issue: "Construction « de X à Y, de A à B » où les éléments ne forment pas une échelle cohérente.",
    suggestion: "Énumérez directement les éléments sans forcer une progression.",
  },

  // ── MOTIFS DE STYLE ────────────────────────────────────────────────

  // #16 Abus des tirets cadratins
  {
    category: "Tirets cadratins abusifs",
    severity: "medium",
    points: 3,
    regex: /[^—\n]*—[^—\n]*—/g,
    issue: "Plusieurs tirets cadratins dans une même phrase, imitant un style « percutant ».",
    suggestion: "Remplacez par des virgules ou séparez en deux phrases.",
  },

  // #17 Abus du gras
  {
    category: "Gras abusif",
    severity: "low",
    points: 2,
    regex: /\*\*[^*]+\*\*/g,
    issue: "Mise en gras mécanique de passages entiers.",
    suggestion: "Ne mettez en gras que les termes vraiment essentiels.",
  },

  // #19 Title Case en français
  {
    category: "Title Case",
    severity: "medium",
    points: 4,
    regex: /##?\s+[A-ZÀÂÉÈÊÏÔÙÛÜŒ][a-zàâéèêëîïôöùûüçÿ]+(?:\s+[A-ZÀÂÉÈÊÏÔÙÛÜŒ][a-zàâéèêëîïôöùûüçÿ]+){2,}/g,
    issue: "Tous les mots importants capitalisés (calque de l'anglais « Title Case »).",
    suggestion: "En français, seul le premier mot et les noms propres prennent une majuscule dans les titres.",
  },

  // #20 Émojis décoratifs
  {
    category: "Émojis décoratifs",
    severity: "low",
    points: 2,
    regex: /(?:^|\n|\s)[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*\*\*/u,
    issue: "Émojis utilisés comme puces décoratives, caractéristiques de l'IA.",
    suggestion: "Supprimez les émojis et utilisez des puces simples.",
  },

  // #21 Squelette de document rigide
  {
    category: "Squelette rigide",
    severity: "high",
    points: 8,
    regex: /##\s*(Introduction|Points clés|Avantages|Inconvénients|Défis|Conclusion)\b/gi,
    issue: "Structure en sections génériques (Intro/Points clés/Avantages/Défis/Conclusion).",
    suggestion: "Laissez le contenu dicter la structure, pas l'inverse.",
  },

  // ── MOTIFS DE COMMUNICATION ────────────────────────────────────────

  // #23 Artefacts de chatbot
  {
    category: "Artefacts de chatbot",
    severity: "high",
    points: 10,
    regex: /\b(j'?espère que (ça|cela) (vous )?aide|bien sûr !?|certainement !?|vous avez tout à fait raison|souhaitez-vous|n'?hésitez pas (à me le faire savoir|à me dire)|voici (un|une))\b/gi,
    issue: "Phrases d'interaction chatbot collées dans le contenu final.",
    suggestion: "Supprimez tous les artefacts de conversation avec l'IA.",
  },

  // #24 Avertissements date limite
  {
    category: "Avertissements temporels",
    severity: "medium",
    points: 4,
    regex: /\b(à la date de|jusqu'à (ma|la )?(dernière mise à jour|mes connaissances)|les informations (spécifiques|disponibles) sont (limitées|rares)|d'?après les informations disponibles)\b/gi,
    issue: "Avertissements de l'IA sur ses limites temporelles, collés dans le texte.",
    suggestion: "Supprimez ou remplacez par une vérification factuelle.",
  },

  // #25 Ton servile
  {
    category: "Ton servile",
    severity: "medium",
    points: 5,
    regex: /\b(excellente question|remarquable|point (très )?intéressant|vous avez (tout à fait )?raison (de|de dire que))\b/gi,
    issue: "Langage excessivement positif et complaisant envers le lecteur.",
    suggestion: "Répondez directement sans flatter.",
  },

  // #28 Conclusions positives génériques
  {
    category: "Conclusion générique",
    severity: "high",
    points: 8,
    regex: /\b(l'?avenir s'?annonce (radieux|prometteur)|des temps passionnants nous attendent|chemin vers l'?excellence|avancée majeure dans la bonne direction|poursuit (sa|son) chemin|continu(?:e|era) de (prospérer|croître|s'?améliorer))\b/gi,
    issue: "Fin vague et enjouée, typique des textes générés.",
    suggestion: "Terminez par un fait concret ou une action spécifique.",
  },

  // #29 Mots composés avec trait d'union excessif
  {
    category: "Traits d'union abusifs",
    severity: "low",
    points: 3,
    regex: /\b(multi-fonctionnel|en temps-réel|à long-terme|de bout-en-bout|bien-connu|haute-qualité|orienté-détail|axé-sur)\b/gi,
    issue: "Traits d'union réguliers là où les humains sont inconsistants ou n'en mettent pas.",
    suggestion: "Écrivez sans trait d'union : pluridisciplinaire, en temps réel, à long terme, etc.",
  },

  // ── MOTIFS EXISTANTS (conservés) ───────────────────────────────────

  {
    category: "Construction corrélative",
    severity: "high",
    points: 10,
    regex: /(?:aren't|isn't|wasn't|weren't|n'est pas|ne sont pas)\s+just\s+.+?\s*[-–—]\s*(?:they're|it's|they were|c'est|ce sont)/gi,
    issue: "Structure « X n'est pas juste Y - c'est Z », tic d'écriture IA très courant.",
    suggestion: "Affirmez l'idée directement, sans l'opposition « pas juste... mais ».",
  },
  {
    category: "Langage hésitant",
    severity: "medium",
    points: 3,
    regex: /\b(might|could|perhaps|possibly|maybe|somewhat|peut-être|sans doute|il semblerait)\b/gi,
    issue: "Formulations qui hésitent alors que l'auteur est sûr de lui.",
    suggestion: "Supprimez les atténuateurs quand l'affirmation est certaine.",
  },
  {
    category: "Adoucisseurs",
    severity: "low",
    points: 2,
    regex: /\b(just|actually|en fait|tout simplement)\b/gi,
    issue: "Usage répété de « just » / « actually » qui affaiblit le propos.",
    suggestion: "Retirez l'adoucisseur sauf s'il signifie réellement « seulement ».",
  },
  {
    category: "Voix passive",
    severity: "medium",
    points: 4,
    regex: /\b(was|were|been|being)\s+\w+ed\b/gi,
    issue: "Voix passive qui masque qui fait l'action.",
    suggestion: "Réécrivez avec un sujet explicite qui agit.",
  },
  {
    category: "Phrases rhétoriques interdites",
    severity: "high",
    points: 8,
    regex: /\b(let that sink in|now more than ever|the best part\??|the secret\??|here's the thing|let's be honest|at the end of the day|soyons honnêtes|au final)\b/gi,
    issue: "Tournures rhétoriques passe-partout caractéristiques de l'IA.",
    suggestion: "Supprimez la formule et entrez directement dans le vif du sujet.",
  },
  {
    category: "Ouvertures interdites",
    severity: "high",
    points: 7,
    regex: /(in the ever-evolving|in today's fast-paced|gone are the days|this underscores|in an era where|dans un monde en constante évolution|à l'ère du)/gi,
    issue: "Phrase d'accroche générique typique des textes générés.",
    suggestion: "Commencez par un fait concret ou une idée spécifique.",
  },
  {
    category: "Jargon corporate",
    severity: "low",
    points: 2,
    regex: /\b(leveraging|synergies?|stakeholder|ecosystem|synergie|optimiser l'engagement)\b/gi,
    issue: "Jargon d'entreprise vide de sens concret.",
    suggestion: "Remplacez par des mots simples et concrets.",
  },
  {
    category: "Langage vague",
    severity: "low",
    points: 3,
    regex: /(many people think|various studies show|significant improvements|beaucoup de gens pensent|de nombreuses études|améliorations significatives)\b/gi,
    issue: "Affirmations vagues sans chiffres ni source.",
    suggestion: "Remplacez par des données précises (chiffres, exemples, sources).",
  },
  // #27 Atténuation excessive
  {
    category: "Atténuation excessive",
    severity: "medium",
    points: 5,
    regex: /\b(potentiellement\s+avancer|pourrait\s+éventuellement|il\s+est\s+possible\s+que|on\s+pourrait\s+penser\s+que)\b/gi,
    issue: "Sur-qualification permanente des affirmations.",
    suggestion: "Affirmez directement ou dites que vous ne savez pas.",
  },
  // #26 Locutions de remplissage
  {
    category: "Locutions de remplissage",
    severity: "medium",
    points: 4,
    regex: /\b(afin d'atteindre cet objectif|à l'heure actuelle|dans l'éventualité où|il convient de noter que|il est (important|essentiel) de (souligner|noter|retenir)|au (cœur|sein) du sujet)\b/gi,
    issue: "Locutions qui allongent les phrases sans apporter d'information.",
    suggestion: "Supprimez ou remplacez par une formulation directe.",
  },

  // ── ENGLISH-SPECIFIC AI PATTERNS (Originality.ai / Copyleaks level) ─

  // EN-1: "Delve into" — the #1 most overused AI phrase
  {
    category: "EN: Overused AI Phrases",
    severity: "high",
    points: 8,
    regex: /\b(delve (into|deeper)|delving (into|deeper))\b/gi,
    issue: "\"Delve into\" is the single most overused phrase in AI-generated text.",
    suggestion: "Use: explore, examine, look at, dig into, analyze.",
  },
  // EN-2: "It's worth noting" / "It is important to note"
  {
    category: "EN: Filler Phrases",
    severity: "medium",
    points: 5,
    regex: /\b(it'?s? worth (noting|mentioning|pointing out)|it is worth (noting|mentioning))\b/gi,
    issue: "Filler phrase that adds no information — classic AI padding.",
    suggestion: "Delete it. State the fact directly.",
  },
  // EN-3: "Tapestry" metaphor
  {
    category: "EN: Overblown Metaphors",
    severity: "high",
    points: 7,
    regex: /\b(a rich tapestry|tapestry of|a symphony of)\b/gi,
    issue: "Overblown metaphor AI uses to sound poetic.",
    suggestion: "Describe what you mean literally.",
  },
  // EN-4: "Testament to"
  {
    category: "EN: Overblown Metaphors",
    severity: "medium",
    points: 5,
    regex: /\b(a testament to|serves? as a testament|stands? as a testament)\b/gi,
    issue: "AI loves calling things \"a testament to\" something.",
    suggestion: "Use: shows, proves, demonstrates, reflects.",
  },
  // EN-5: "Navigating the landscape/complexities"
  {
    category: "EN: Corporate Jargon",
    severity: "high",
    points: 7,
    regex: /\b(navigat(?:e|ing) (the|a|our|their) (?:complexities?|landscape|terrain|world)|navigat(?:e|ing) (?:through|across|these))\b/gi,
    issue: "Overused AI metaphor for dealing with something complex.",
    suggestion: "Use: handling, dealing with, addressing, managing.",
  },
  // EN-6: "A myriad of" / "myriad"
  {
    category: "EN: Filler Phrases",
    severity: "low",
    points: 3,
    regex: /\b(a myriad of|an array of|a multitude of|a plethora of)\b/gi,
    issue: "AI overuses these to sound sophisticated when \"many\" or \"lots of\" would work.",
    suggestion: "Use: many, various, dozens of, or just list them.",
  },
  // EN-7: "Sheds light on" / "sheds insight"
  {
    category: "EN: Overused AI Phrases",
    severity: "medium",
    points: 5,
    regex: /\b(sheds? (?:light|insight|clarity) on)\b/gi,
    issue: "AI cliché for explaining or revealing something.",
    suggestion: "Use: explains, reveals, shows, clarifies.",
  },
  // EN-8: "Paramount" / "Paramount importance"
  {
    category: "EN: Vocab IA EN",
    severity: "medium",
    points: 5,
    regex: /\b(paramount (?:importance|concern)|of paramount)\b/gi,
    issue: "AI consistently overuses \"paramount\" instead of \"important\" or \"critical\".",
    suggestion: "Use: crucial, essential, vital, or simply important.",
  },
  // EN-9: "Foster" / "Cultivate" / "Nurture"
  {
    category: "EN: Vocab IA EN",
    severity: "medium",
    points: 5,
    regex: /\b(fostering?|cultivating?|nurturing?)\s+\w+(?:\s+\w+){0,3}\b/gi,
    issue: "AI loves these verbs for \"encouraging/growing\" something abstract.",
    suggestion: "Use: support, build, grow, help, encourage.",
  },
  // EN-10: "In an era where" / "In a world where"
  {
    category: "EN: Cliché Openings",
    severity: "high",
    points: 8,
    regex: /\b(in (?:an|this) (?:era|age|world|landscape) (?:where|of|characterized by))\b/gi,
    issue: "One of the most clichéd AI opening formulas.",
    suggestion: "Start with a specific fact, not a vague era description.",
  },
  // EN-11: "Underscores" / "Highlights" used as verbs excessively
  {
    category: "EN: Overused AI Phrases",
    severity: "medium",
    points: 4,
    regex: /\b(underscores?|highlights?|brings? to the forefront)\b/gi,
    issue: "AI overuses these verbs for \"shows\" or \"emphasizes\".",
    suggestion: "Use: shows, emphasizes, proves, makes clear.",
  },
  // EN-12: "Transformative" / "Revolutionary" / "Groundbreaking"
  {
    category: "EN: Promotional Language",
    severity: "high",
    points: 7,
    regex: /\b(transformative|revolutionary|groundbreaking|game-changing|paradigm-shift(?:ing)?)\b/gi,
    issue: "Hyperbolic adjectives AI inserts to make things sound impressive.",
    suggestion: "Use: new, significant, important, or cite specific improvements.",
  },
  // EN-13: "Holistic approach" / "Comprehensive solution"
  {
    category: "EN: Corporate Jargon",
    severity: "medium",
    points: 5,
    regex: /\b((?:a\s+)?holistic (?:approach|view|perspective|strategy)|comprehensive (?:solution|approach|framework|strategy))\b/gi,
    issue: "Buzzwords that sound professional but mean nothing specific.",
    suggestion: "Describe what the approach actually does.",
  },
  // EN-14: "Seamless" / "Seamlessly"
  {
    category: "EN: Corporate Jargon",
    severity: "medium",
    points: 4,
    regex: /\b(seamless(?:ly)?)\b/gi,
    issue: "AI's favorite adjective for anything that works smoothly.",
    suggestion: "Use: smooth, easy, integrated, or describe what actually happens.",
  },
  // EN-15: "Demystify" / "Unpack"
  {
    category: "EN: Overused AI Phrases",
    severity: "low",
    points: 3,
    regex: /\b(demystif(?:y|ying)|unpack(?:ing|s)?)\b/gi,
    issue: "AI uses these meta-verbs to announce it's about to explain something.",
    suggestion: "Just explain it directly without the announcement.",
  },
  // EN-16: "It goes without saying" / "Needless to say"
  {
    category: "EN: Filler Phrases",
    severity: "medium",
    points: 4,
    regex: /\b(it goes without saying|needless to say|as one might expect|it stands to reason)\b/gi,
    issue: "If it goes without saying, don't say it.",
    suggestion: "Delete the phrase entirely.",
  },
  // EN-17: "Resonate" / "Strikes a chord"
  {
    category: "EN: Overblown Metaphors",
    severity: "low",
    points: 3,
    regex: /\b(resonat(?:es?|ing)|strikes? a chord (?:with)?)\b/gi,
    issue: "AI uses emotional metaphors to add false depth.",
    suggestion: "Use: appeals to, connects with, or describe the actual effect.",
  },
  // EN-18: "Paving the way" / "Charting a course"
  {
    category: "EN: Cliché Metaphors",
    severity: "medium",
    points: 5,
    regex: /\b(paving? the way (?:for|forward|to)|charting? (?:a|its|the) (?:course|path|way))\b/gi,
    issue: "AI's go-to metaphor for any kind of progress.",
    suggestion: "Describe the specific progress being made.",
  },
  // EN-19: "Stark contrast" / "Stark reminder"
  {
    category: "EN: Overused AI Phrases",
    severity: "low",
    points: 3,
    regex: /\b(stark (?:contrast|reminder|difference|reality))\b/gi,
    issue: "AI loves \"stark\" as an intensifier.",
    suggestion: "Use: sharp, clear, strong, or drop the intensifier.",
  },
  // EN-20: "In conclusion" / "To sum up" / "Wrapping up"
  {
    category: "EN: Formulaic Endings",
    severity: "high",
    points: 6,
    regex: /\b(in conclusion|to sum up|to summarize|wrapping up|bringing it all together|as we've (?:seen|explored|discussed))\b/gi,
    issue: "AI insists on formally announcing the end of its text.",
    suggestion: "End with your final point. No announcement needed.",
  },
  // EN-21: "Both X and Y" overuse
  {
    category: "EN: Structural Patterns",
    severity: "medium",
    points: 4,
    regex: /(?:both)\s+\w+\s+and\s+\w+\s+(?:and|are|is|have|can|will).*(?:both)\s+\w+\s+and\s+\w+/gi,
    issue: "AI overuses the \"both X and Y\" parallel structure.",
    suggestion: "Vary your sentence structure. Not everything needs to be \"both...and\".",
  },
  // EN-22: "In essence" / "At its core" / "Fundamentally"
  {
    category: "EN: Filler Phrases",
    severity: "medium",
    points: 4,
    regex: /\b(in essence|at its (?:core|heart)|fundamentally|ultimately)\b/gi,
    issue: "AI pads summaries and transitions with these empty intensifiers.",
    suggestion: "State the point directly without the preface.",
  },
  // EN-23: "Key takeaway" / "Takeaway"
  {
    category: "EN: Corporate Jargon",
    severity: "low",
    points: 3,
    regex: /\b(key takeaways?|the (?:main|primary|key) takeaway)\b/gi,
    issue: "Corporate speak that AI inserts before lists.",
    suggestion: "Use: main points, important points, or just list them.",
  },
  // EN-24: "Elevate" / "Elevating"
  {
    category: "EN: Corporate Jargon",
    severity: "low",
    points: 3,
    regex: /\belevat(?:e|es|ed|ing)\s/gi,
    issue: "AI uses \"elevate\" as a fancy verb for \"improve\".",
    suggestion: "Use: improve, enhance, upgrade, or be specific.",
  },
  // EN-25: "Space" / "Realm" used metaphorically
  {
    category: "EN: Corporate Jargon",
    severity: "medium",
    points: 4,
    regex: /\b(in (?:this|the|that) (?:space|realm)|the \w+ space)\b/gi,
    issue: "Vague \"space\" and \"realm\" instead of naming the actual field.",
    suggestion: "Name the specific field: industry, market, domain, area.",
  },
  // EN-26: "Drive" used as causative verb excessively
  {
    category: "EN: Corporate Jargon",
    severity: "medium",
    points: 4,
    regex: /\b(driv(?:e|es|en|ing)\s+(?:innovation|growth|engagement|success|results|change|value|adoption|efficiency|impact))\b/gi,
    issue: "AI overuses \"drive X\" as a verb-noun collocation.",
    suggestion: "Use: cause, lead to, produce, create, or rephrase.",
  },
  // EN-27: "Leverage" / "Utilize"
  {
    category: "EN: Corporate Jargon",
    severity: "medium",
    points: 4,
    regex: /\b(leverage|utilize|utilise)\b/gi,
    issue: "Fancy words for \"use\" that AI inserts to sound professional.",
    suggestion: "Use: use, apply, work with.",
  },
  // EN-28: "Robust" / "Scalable" / "Extensible"
  {
    category: "EN: Corporate Jargon",
    severity: "low",
    points: 2,
    regex: /\b(robust|scalable|extensible)\b/gi,
    issue: "Technical buzzwords used outside of technical contexts.",
    suggestion: "Use: strong, reliable, expandable, or be specific.",
  },
  // EN-29: "Embody" / "Embodies"
  {
    category: "EN: Overblown Metaphors",
    severity: "low",
    points: 3,
    regex: /\b(embod(?:y|ies|ied|ying))\b/gi,
    issue: "AI uses \"embody\" to make things sound more profound than they are.",
    suggestion: "Use: represent, show, express, or describe concretely.",
  },
  // EN-30: "Not only... but also" overuse
  {
    category: "EN: Structural Patterns",
    severity: "medium",
    points: 5,
    regex: /\bnot only\s+.{5,50}?\s+but\s+(also\s+|even\s+|it\s+)/gi,
    issue: "AI overuses this correlative conjunction to add emphasis.",
    suggestion: "Use separate sentences or simpler constructions.",
  },

  // ── MODULE 3 : DÉTECTION DE STRUCTURE IA ──────────────────────────

  // STRUCT-1: Énumération ordonnée artificielle
  {
    category: "Structure énumérative",
    severity: "high",
    points: 8,
    regex: /\b(premi[eè]rement|deuxi[eè]mement|troisi[eè]mement|quatri[eè]mement|cinqi[eè]mement|ensuite|enfin)\b/gi,
    issue: "Énumération ordonnée rigide (premièrement, deuxièmement...), typique des textes IA.",
    suggestion: "Utilisez des transitions naturelles ou supprimez les marqueurs d'ordre.",
  },
  // STRUCT-2: Symétrie paragraphe (paragraphes de taille quasi-identique)
  // Détecté par calcul dans analyzeText, pas par regex.

  // ── MODULE 5 : VOCABULAIRE GÉNÉRIQUE (AI_PHRASES) ────────────────

  {
    category: "Phrases génériques IA",
    severity: "high",
    points: 6,
    regex: /\b(approche innovante|solution pertinente|enjeux majeurs|impact significatif|contexte en constante évolution|perspectives prometteuses|avancée majeure|potentiel considérable|défis (majeurs|importants)|progrès (significatifs|remarquables))\b/gi,
    issue: "Formulation générique vide de sens concret, caractéristique des textes IA.",
    suggestion: "Remplacez par des descriptions factuelles avec des chiffres ou exemples précis.",
  },
  // PHRASES-2: Connecteurs à fort risque (Module 4)
  {
    category: "Connecteurs à fort risque",
    severity: "medium",
    points: 5,
    regex: /\b(en outre|cette approche permet|il convient de noter que)\b/gi,
    issue: "Connecteur logique fortement associé aux textes générés par IA.",
    suggestion: "Supprimez ou remplacez par une transition plus naturelle.",
  },

  // ── MODULE 8 : DÉTECTION PARAPHRASE IA ───────────────────────────

  {
    category: "Paraphrase IA",
    severity: "medium",
    points: 5,
    regex: /\b(contribue(?:nt)? à optimiser|permet(?:tent)? d'améliorer|vise(?:nt)? à renforcer|aident à maximiser|facilite(?:nt)? la mise en œuvre)\b/gi,
    issue: "Reformulation artificielle : phrase complexe sans gain d'information par rapport au verbe simple.",
    suggestion: "Utilisez un verbe direct : améliorer, renforcer, maximiser, appliquer.",
  },
  {
    category: "Paraphrase IA",
    severity: "medium",
    points: 4,
    regex: /\b(le système robotisé|la solution proposée|le dispositif mis en place|l'outil développé)\s+(contribue à|permet d'|vise à|aide à)\s+(optimiser|améliorer|renforcer)\s+(les performances?|les résultats?|la productivité|l'efficacité)\b/gi,
    issue: "Paraphrase typique IA : nominalisation + verbe faible + complément abstrait.",
    suggestion: "Exemple : « Le robot améliore la production. » au lieu de « Le système robotisé contribue à optimiser les performances productives. »",
  },

  // ── MODULE 7 : ABSENCE DE PERSONNALISATION ───────────────────────

  {
    category: "Absence de personnalisation",
    severity: "medium",
    points: 5,
    regex: /\b(cette technologie (améliore|transforme|révolutionne)|ces outils (permettent|aident)|cette méthode (améliore|optimise))\s+(les entreprises|les organisations|les processus|les résultats)\b/gi,
    issue: "Formulation impersonnelle sans exemple concret, contexte ni référence précise.",
    suggestion: "Ajoutez un contexte spécifique : « Dans notre étude du laboratoire X, cette technologie a réduit le temps de traitement de 40%. »",
  },

  // ── MODULE 1 : FORMULATIONS COMMUNES (prévisibilité) ─────────────

  {
    category: "Formulations prévisibles",
    severity: "medium",
    points: 5,
    regex: /\b(l'intelligence artificielle joue un rôle (important|croissant|majeur)|dans le monde actuel|à l'ère (du|de la) (numérique|intelligence artificielle)|les avancées technologiques (permettent|offrent|ouvrent))\b/gi,
    issue: "Phrase trop prévisible et attendue, signe d'un texte généré.",
    suggestion: "Commencez par un fait précis ou une observation spécifique plutôt qu'une généralité.",
  },
];
