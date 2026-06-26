import { describe, it, expect, vi } from "vitest";
import { analyzeText } from "../textAnalysis";
import { performClean } from "../cleaner";
import { performHumanize } from "../humanizer";
import { buildProfile, applyProfile, serializeProfile, parseProfile } from "../writerProfile";
import { loadProfiles, saveProfiles, generateProfileId } from "../profileStore";

const AI_TEXT =
  "In today's fast-paced world, AI isn't just about automation - it's about transformation. Many people think that leveraging these tools might help optimize engagement metrics. Let that sink in. The secret? It's not just about technology, it's about people.";

describe("cleaner", () => {
  it("removes invisible characters", () => {
    const { cleanedText, stats } = performClean("a\u00A0b\u202Fc");
    expect(cleanedText).toBe("a b c");
    expect(stats.totalCleaned).toBe(2);
  });
});

describe("analyzeText", () => {
  it("returns empty result for short text", () => {
    expect(analyzeText("court").score).toBe(0);
  });
  it("flags AI-heavy text with a high score", () => {
    const r = analyzeText(AI_TEXT);
    expect(r.score).toBeGreaterThan(40);
    expect(r.patternCount).toBeGreaterThan(0);
  });
});

describe("analyzeText — pondération par mode (Phase 0.1)", () => {
  // Texte riche en connecteurs formels et dépourvu de toute marque d'oralité :
  // normal en registre académique, plus suspect en registre naturel/personnel.
  const FORMAL_TEXT =
    "Le système présente plusieurs limites. Cependant, ces limites sont surmontables. Par ailleurs, de nombreux travaux confirment ce constat. En outre, les résultats obtenus restent cohérents avec les hypothèses initiales formulées en amont de l'étude menée sur le terrain.";

  it("pénalise davantage un texte trop formel en mode naturel qu'en mode académique", () => {
    const naturel = analyzeText(FORMAL_TEXT, "naturel").score;
    const academique = analyzeText(FORMAL_TEXT, "academique").score;
    expect(naturel).toBeGreaterThan(academique);
  });

  it("ne modifie jamais les sous-scores bruts affichés à l'utilisateur", () => {
    const naturel = analyzeText(FORMAL_TEXT, "naturel");
    const academique = analyzeText(FORMAL_TEXT, "academique");
    // Les diagnostics bruts restent identiques quel que soit le mode :
    // seule l'agrégation finale (score) doit varier.
    expect(naturel.transitionScore).toBe(academique.transitionScore);
    expect(naturel.perfectionScore).toBe(academique.perfectionScore);
  });

  it("utilise le mode 'naturel' par défaut si aucun mode n'est fourni", () => {
    const withDefault = analyzeText(FORMAL_TEXT);
    const explicitNaturel = analyzeText(FORMAL_TEXT, "naturel");
    expect(withDefault.score).toBe(explicitNaturel.score);
  });
});

describe("humanizer pipeline", () => {
  it("rewrites and lowers the AI score", () => {
    const r = performHumanize(AI_TEXT, { intensity: "aggressive", mode: "naturel" });
    expect(r.modificationsCount).toBeGreaterThan(0);
    expect(r.scoreAfter).toBeLessThanOrEqual(r.scoreBefore);
  });
  it("humanize until natural loops several passes", () => {
    const r = performHumanize(AI_TEXT, { intensity: "aggressive", mode: "naturel", targetScore: 30, maxPasses: 5 });
    expect(r.passes).toBeGreaterThanOrEqual(1);
    expect(r.passes).toBeLessThanOrEqual(5);
  });
});

describe("humanizer — variations lexicales (Phase 0.4)", () => {
  it("peut varier un intensificateur surutilisé en intensité aggressive (mode naturel)", () => {
    // Math.random fixé pour forcer un choix différent du mot d'origine
    // (déterministe, pour éviter un test qui échoue aléatoirement une fois sur quatre).
    const spy = vi.spyOn(Math, "random").mockReturnValue(0.3);
    const r = performHumanize("Ce résultat est très important et très clair.", {
      intensity: "aggressive",
      mode: "naturel",
    });
    expect(r.changeLog.some((c) => c.type === "variation_lexicale")).toBe(true);
    spy.mockRestore();
  });

  it("n'applique pas la variation lexicale en intensité 'light' ou 'moderate'", () => {
    const spy = vi.spyOn(Math, "random").mockReturnValue(0.3);
    const r = performHumanize("Ce résultat est très important.", {
      intensity: "light",
      mode: "naturel",
    });
    expect(r.changeLog.some((c) => c.type === "variation_lexicale")).toBe(false);
    spy.mockRestore();
  });
});

describe("writer profile", () => {
  const sample =
    "Je pense que ce truc est génial. D'ailleurs, j'ai testé plein d'outils. Du coup, je préfère celui-ci. Franchement, c'est simple et rapide !";
  it("builds a profile with metrics", () => {
    const p = buildProfile(sample, "Test");
    expect(p.name).toBe("Test");
    expect(p.metrics.avgSentenceLength).toBeGreaterThan(0);
    expect(p.language).toBe("fr");
  });
  it("round-trips through JSON", () => {
    const p = buildProfile(sample);
    const back = parseProfile(serializeProfile(p));
    expect(back.metrics.avgSentenceLength).toBe(p.metrics.avgSentenceLength);
  });
  it("applies profile transformations", () => {
    const p = buildProfile(sample);
    const { text } = applyProfile("Il est important de tester. De plus, il faut documenter.", p);
    expect(text).not.toContain("Il est important de");
  });
});

describe("profileStore — persistance multi-profils (Phase 0.2/0.3)", () => {
  it("génère des identifiants de profil uniques", () => {
    const a = generateProfileId();
    const b = generateProfileId();
    expect(a).not.toBe(b);
  });

  it("se dégrade sans erreur quand localStorage est indisponible (environnement de test Node)", () => {
    // En environnement de test (sans DOM), window/localStorage n'existent pas :
    // le module doit rester silencieux et ne jamais planter l'application.
    expect(() => saveProfiles({ x: buildProfile("Texte de test pour le profil.", "X") })).not.toThrow();
    expect(loadProfiles()).toEqual({});
  });
});