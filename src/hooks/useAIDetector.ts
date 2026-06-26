import { useCallback } from "react";
import { analyzeText as analyze } from "@/lib/textAnalysis";
import type { ScoreMode } from "@/lib/textAnalysis";

export type {
  AIAnalysisResult,
  AnalysisDetail,
  ChecklistItem,
  Severity,
  ScoreMode,
} from "@/lib/textAnalysis";

/** Hook fin qui expose le moteur d'analyse local (src/lib/textAnalysis). */
export const useAIDetector = () => {
  const analyzeText = useCallback(
    (text: string, mode: ScoreMode = "naturel") => analyze(text, mode),
    []
  );
  return { analyzeText };
};
