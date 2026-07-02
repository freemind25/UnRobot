import { describe, it, expect } from "vitest";
import { analyzeReadability } from "../readability";

// Texte simple : phrases courtes, mots courants
const SIMPLE_TEXT =
  "Le chat dort sur le tapis. Il fait beau dehors. Les enfants jouent dans le jardin. " +
  "La maison est grande. Le soleil brille. On mange à midi. La soupe est chaude.";

// Texte académique/technique : phrases longues, vocabulaire soutenu
const COMPLEX_TEXT =
  "La morphologie urbaine, entendue comme l'étude des formes de la ville et de leurs " +
  "transformations au cours du temps, constitue un champ disciplinaire à la croisée de " +
  "l'architecture, de l'urbanisme et de la géographie. Les analyses typo-morphologiques, " +
  "développées notamment par l'école italienne avec Saverio Muratori puis Gianfranco " +
  "Caniggia, permettent d'appréhender la structure des tissus urbains à travers la " +
  "combinaison des types architecturaux et des tracés parcellaires. La permanence des " +
  "infrastructures viaires constitue ainsi un invariant structurant dans l'évolution " +
  "diachronique des configurations spatiales.";

describe("analyzeReadability", () => {
  it("retourne null pour un texte trop court", () => {
    expect(analyzeReadability("Bonjour.")).toBeNull();
    expect(analyzeReadability("")).toBeNull();
  });

  it("retourne un résultat valide pour un texte suffisant", () => {
    const r = analyzeReadability(SIMPLE_TEXT);
    expect(r).not.toBeNull();
    expect(r!.metrics.wordCount).toBeGreaterThan(0);
    expect(r!.metrics.sentenceCount).toBeGreaterThan(0);
  });

  it("le texte simple obtient un score global plus élevé que le texte complexe", () => {
    const simple = analyzeReadability(SIMPLE_TEXT)!;
    const complex = analyzeReadability(COMPLEX_TEXT)!;
    expect(simple.globalScore).toBeGreaterThan(complex.globalScore);
  });

  it("Flesch-Kincaid est dans la plage 0–100", () => {
    const r = analyzeReadability(SIMPLE_TEXT)!;
    expect(r.fleschKincaid).toBeGreaterThanOrEqual(0);
    expect(r.fleschKincaid).toBeLessThanOrEqual(100);
  });

  it("LIX est plus faible pour le texte simple", () => {
    const simple = analyzeReadability(SIMPLE_TEXT)!;
    const complex = analyzeReadability(COMPLEX_TEXT)!;
    expect(simple.lix).toBeLessThan(complex.lix);
  });

  it("Gunning Fog est plus faible pour le texte simple", () => {
    const simple = analyzeReadability(SIMPLE_TEXT)!;
    const complex = analyzeReadability(COMPLEX_TEXT)!;
    expect(simple.gunningFog).toBeLessThan(complex.gunningFog);
  });

  it("le texte simple reçoit un label lisible", () => {
    const r = analyzeReadability(SIMPLE_TEXT)!;
    expect(["Très accessible", "Accessible"]).toContain(r.label);
  });

  it("le texte complexe reçoit un label avancé ou technique", () => {
    const r = analyzeReadability(COMPLEX_TEXT)!;
    expect(["Niveau avancé", "Très technique", "Niveau intermédiaire"]).toContain(r.label);
  });

  it("les métriques brutes sont cohérentes entre elles", () => {
    const r = analyzeReadability(SIMPLE_TEXT)!;
    expect(r.metrics.avgWordsPerSentence).toBeGreaterThan(0);
    expect(r.metrics.avgSyllablesPerWord).toBeGreaterThanOrEqual(1);
    expect(r.metrics.longWordRatio).toBeGreaterThanOrEqual(0);
    expect(r.metrics.longWordRatio).toBeLessThanOrEqual(100);
  });

  it("le score global est dans la plage 0–100", () => {
    const simple = analyzeReadability(SIMPLE_TEXT)!;
    const complex = analyzeReadability(COMPLEX_TEXT)!;
    expect(simple.globalScore).toBeGreaterThanOrEqual(0);
    expect(simple.globalScore).toBeLessThanOrEqual(100);
    expect(complex.globalScore).toBeGreaterThanOrEqual(0);
    expect(complex.globalScore).toBeLessThanOrEqual(100);
  });

  it("détecte la lisibilité d'un texte urbanistique réaliste", () => {
    const text =
      "Le plan local d'urbanisme intercommunal définit les règles générales d'utilisation " +
      "du sol applicables dans les zones urbaines et les zones à urbaniser. Les orientations " +
      "d'aménagement et de programmation précisent les conditions d'aménagement de certains " +
      "secteurs qui nécessitent une attention particulière.";
    const r = analyzeReadability(text)!;
    expect(r).not.toBeNull();
    // Un texte réglementaire doit être classé au moins intermédiaire
    expect(r.globalScore).toBeLessThan(75);
  });
});
