/**
 * Registre des modules d'analyse.
 *
 * Pour ajouter un module :
 * 1. Créer un fichier src/lib/mod<X>.ts exportant un AnalysisModule
 * 2. L'importer ici
 * 3. L'inscrire dans le tableau analysisModules
 *
 */

import type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";

export type { AnalysisModule, AnalysisContext, AnalysisModuleResult } from "./AnalysisModule";

import { sentenceVariationModule } from "./modSentenceVariation";
import { lexicalRichnessModule } from "./modLexicalRichness";
import { repetitionModule } from "./modRepetition";
import { paragraphBalanceModule } from "./modParagraphBalance";
import { transitionDensityModule } from "./modTransitionDensity";

/**
 * Registre ordonné des modules d'analyse.
 * L'ordre n'a pas d'importance pour le score composite,
 * mais il détermine l'ordre d'exécution.
 */
export const analysisModules: AnalysisModule[] = [
  sentenceVariationModule,
  lexicalRichnessModule,
  repetitionModule,
  paragraphBalanceModule,
  transitionDensityModule,
];

/**
 * Exécute un module par son id et retourne son résultat.
 * Retourne null si le module n'est pas trouvé.
 */
export function runModule(
  id: string,
  text: string,
  ctx: AnalysisContext,
): AnalysisModuleResult | null {
  const mod = analysisModules.find((m) => m.id === id);
  if (!mod) return null;
  return mod.execute(text, ctx);
}

/**
 * Exécute tous les modules enregistrés.
 * Retourne un Map id → score et le total pondéré.
 */
export function runAllModules(
  text: string,
  ctx: AnalysisContext,
): { scores: Map<string, number>; weightedSum: number } {
  const scores = new Map<string, number>();
  let weightedSum = 0;

  for (const mod of analysisModules) {
    const result = mod.execute(text, ctx);
    scores.set(mod.id, result.score);
    weightedSum += result.score * mod.weight;
  }

  return { scores, weightedSum };
}