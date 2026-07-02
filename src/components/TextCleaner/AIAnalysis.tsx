import React from "react";
import { AIAnalysisResult } from "@/hooks/useAIDetector";
import { HybridAnalysis, ModelInfo, ModelState } from "@/lib/ml/types";
import { MLStatus } from "./MLStatus";
import { AlertTriangle, CheckCircle, XCircle, Bot, Brain, Sparkles, MessageSquare, Gauge, BookOpen, Layers, Wand2, Check, X, Shield, Eye, Fingerprint } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/* ── Classification badge ──────────────────────────────── */

const CLASSIFICATION_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  human: {
    label: "Humain",
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
    icon: <CheckCircle className="w-4 h-4 text-success" />,
  },
  ai: {
    label: "IA brute",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    icon: <XCircle className="w-4 h-4 text-destructive" />,
  },
  ai_humanized: {
    label: "IA humanisée",
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
    icon: <Shield className="w-4 h-4 text-warning" />,
  },
  ai_paraphrased: {
    label: "IA paraphrasée",
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
    icon: <Eye className="w-4 h-4 text-warning" />,
  },
};

interface AIAnalysisProps {
  result: AIAnalysisResult | null;
  isAnalyzing: boolean;
  hybrid?: HybridAnalysis | null;
  modelState?: ModelState;
  modelInfo?: ModelInfo | null;
  isMLInitializing?: boolean;
}

const getScoreLabel = (score: number): { label: string; color: string; bgColor: string; icon: React.ReactNode } => {
  if (score < 30) {
    return {
      label: "Caractéristiques d'écriture humaine",
      color: "text-success",
      bgColor: "bg-success",
      icon: <CheckCircle className="w-5 h-5 text-success" />,
    };
  }
  if (score < 60) {
    return {
      label: "Caractéristiques mixtes",
      color: "text-warning",
      bgColor: "bg-warning",
      icon: <AlertTriangle className="w-5 h-5 text-warning" />,
    };
  }
  return {
    label: "Caractéristiques compatibles avec une génération IA",
    color: "text-destructive",
    bgColor: "bg-destructive",
    icon: <XCircle className="w-5 h-5 text-destructive" />,
  };
};

const getProgressColor = (score: number): string => {
  if (score < 30) return "bg-success";
  if (score < 60) return "bg-warning";
  return "bg-destructive";
};

const getSeverityColor = (severity: "low" | "medium" | "high"): string => {
  switch (severity) {
    case "low": return "border-success/30 bg-success/10";
    case "medium": return "border-warning/30 bg-warning/10";
    case "high": return "border-destructive/30 bg-destructive/10";
  }
};

const getSeverityIconColor = (severity: "low" | "medium" | "high"): string => {
  switch (severity) {
    case "low": return "text-success";
    case "medium": return "text-warning";
    case "high": return "text-destructive";
  }
};

const ScoreBar: React.FC<{ label: string; score: number; icon: React.ReactNode }> = ({ label, score, icon }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium">{score}%</span>
    </div>
    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-500 ${getProgressColor(score)}`}
        style={{ width: `${score}%` }}
      />
    </div>
  </div>
);

const AnalysisSkeleton: React.FC = () => (
  <div className="space-y-4 p-6 rounded-lg border border-border bg-card/80">
    <div className="flex items-center gap-3">
      <Skeleton className="w-5 h-5 rounded-full" />
      <Skeleton className="h-5 w-40" />
      <div className="ml-auto">
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
    <Skeleton className="h-2 w-full rounded-full" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ result, isAnalyzing, hybrid, modelState, modelInfo, isMLInitializing }) => {
  if (isAnalyzing) {
    return <AnalysisSkeleton />;
  }

  if (!result || result.score === 0) {
    return null;
  }

  const { label, color, bgColor, icon } = getScoreLabel(result.score);
  const cls = CLASSIFICATION_CONFIG[result.classification] || CLASSIFICATION_CONFIG.human;

  return (
    <div className="space-y-4 p-6 rounded-lg border border-border bg-card/80 animate-fade-in" role="region" aria-label="Résultats de l'analyse IA" aria-live="polite">
      {/* Main score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h3 className="font-semibold">Analyse de détection IA</h3>
            <p className={`text-sm font-medium ${color}`}>{label}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${color}`}>{result.score}%</div>
          <p className="text-xs text-muted-foreground">Score de détection</p>
        </div>
      </div>

      {/* Overall progress */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-700 ${bgColor}`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      {/* Classification badge + humanization probability */}
      <div className={`flex items-center gap-3 p-3 rounded-md border ${cls.borderColor} ${cls.bgColor}`}>
        {cls.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${cls.color}`}>{cls.label}</span>
            <span className="text-xs text-muted-foreground">—</span>
            <span className="text-xs text-muted-foreground truncate">{result.classificationLabel}</span>
          </div>
          {result.humanizationDetection && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Probabilité d'humanisation : {result.humanizationDetection.humanizationProbability}%
            </p>
          )}
        </div>
        {result.humanizationDetection && result.humanizationDetection.humanizationProbability > 0 && (
          <div className="text-right shrink-0">
            <Fingerprint className="w-4 h-4 text-primary mb-0.5" />
            <div className="text-xs font-medium">{result.humanizationDetection.humanizationLikelihood}%</div>
          </div>
        )}
      </div>

      {/* Advanced humanization scores (if available) */}
      {result.humanizationDetection && (
        <div className="space-y-3 pt-1">
          <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> Analyse d'humanisation avancée (modules 39-50)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <ScoreBar label="Variation syntaxique" score={result.humanizationDetection.syntacticVariationScore} icon={<Layers className="w-3 h-3" />} />
            <ScoreBar label="Diversité lexicale" score={result.humanizationDetection.lexicalDiversityScore} icon={<BookOpen className="w-3 h-3" />} />
            <ScoreBar label="Rythme phrases" score={result.humanizationDetection.sentenceRhythmScore} icon={<Gauge className="w-3 h-3" />} />
            <ScoreBar label="Variance paragraphes" score={result.humanizationDetection.paragraphVarianceScore} icon={<Layers className="w-3 h-3" />} />
            <ScoreBar label="Phrases IA" score={result.humanizationDetection.aiPhraseDensity} icon={<Bot className="w-3 h-3" />} />
            <ScoreBar label="Surutilisation connecteurs" score={result.humanizationDetection.connectorOveruseScore} icon={<MessageSquare className="w-3 h-3" />} />
            <ScoreBar label="Préservation sémantique" score={result.humanizationDetection.semanticPreservationScore} icon={<Brain className="w-3 h-3" />} />
            <ScoreBar label="Variation de ton" score={result.humanizationDetection.toneVariationScore} icon={<Sparkles className="w-3 h-3" />} />
            <ScoreBar label="Marqueurs perso." score={result.humanizationDetection.personalMarkerScore} icon={<CheckCircle className="w-3 h-3" />} />
            <ScoreBar label="Nuances humaines" score={result.humanizationDetection.humanNuanceScore} icon={<CheckCircle className="w-3 h-3" />} />
            <ScoreBar label="Randomisation struct." score={result.humanizationDetection.structureRandomnessScore} icon={<Layers className="w-3 h-3" />} />
            <ScoreBar label="Probabilité humanis." score={result.humanizationDetection.humanizationLikelihood} icon={<Fingerprint className="w-3 h-3" />} />
          </div>
        </div>
      )}

      {/* ML Status */}
      {(modelState || isMLInitializing) && (
        <MLStatus state={modelState ?? "idle"} info={modelInfo ?? null} isLoading={isMLInitializing ?? false} />
      )}

      {/* Hybrid ML Score */}
      {hybrid && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-md border border-border bg-background/40 text-center">
            <div className="text-sm text-muted-foreground mb-1">Heuristique</div>
            <div className={`text-xl font-bold ${getScoreLabel(hybrid.heuristicScore).color}`}>
              {hybrid.heuristicScore}%
            </div>
          </div>
          <div className="p-3 rounded-md border border-primary/30 bg-primary/5 text-center">
            <div className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <Brain className="w-3 h-3" /> ML
              {hybrid.modelSource === "onnx" && (
                <span className="text-[10px] px-1 py-0.5 rounded bg-primary/20 text-primary font-medium">ONNX</span>
              )}
            </div>
            <div className={`text-xl font-bold ${getScoreLabel(hybrid.mlScore).color}`}>
              {hybrid.mlScore}%
            </div>
          </div>
          <div className="p-3 rounded-md border border-border bg-background/40 text-center">
            <div className="text-sm text-muted-foreground mb-1">Combiné (40/60)</div>
            <div className={`text-xl font-bold ${getScoreLabel(hybrid.combinedScore).color}`}>
              {hybrid.combinedScore}%
            </div>
          </div>
        </div>
      )}

      {/* Detailed scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <ScoreBar label="Burstiness" score={result.burstinessScore} icon={<Gauge className="w-3 h-3" />} />
        <ScoreBar label="Transitions" score={result.transitionScore} icon={<MessageSquare className="w-3 h-3" />} />
        <ScoreBar label="Perfection" score={result.perfectionScore} icon={<Sparkles className="w-3 h-3" />} />
        <ScoreBar label="Voix générique" score={result.voiceScore} icon={<Bot className="w-3 h-3" />} />
        <ScoreBar label="Perplexité" score={result.perplexityScore} icon={<Brain className="w-3 h-3" />} />
        <ScoreBar label="Vocabulaire" score={result.vocabularyScore} icon={<BookOpen className="w-3 h-3" />} />
        <ScoreBar label="Profondeur" score={result.depthScore} icon={<Layers className="w-3 h-3" />} />
        <ScoreBar label="Structure IA" score={result.structureScore} icon={<Layers className="w-3 h-3" />} />
        <ScoreBar label="Répét. sémantique" score={result.semanticRepetitionScore} icon={<AlertTriangle className="w-3 h-3" />} />
        <ScoreBar label="Personnalisation" score={result.personalizationScore} icon={<CheckCircle className="w-3 h-3" />} />
        <ScoreBar label="Paraphrase IA" score={result.paraphraseScore} icon={<Bot className="w-3 h-3" />} />
        <ScoreBar label="Style" score={result.styleScore} icon={<Sparkles className="w-3 h-3" />} />
        <ScoreBar label="Équilibre §" score={result.paragraphBalanceScore} icon={<Layers className="w-3 h-3" />} />
        <ScoreBar label="Entropie" score={result.entropyScore} icon={<Brain className="w-3 h-3" />} />
        <ScoreBar label="Compression" score={result.compressionRatioScore} icon={<Gauge className="w-3 h-3" />} />
        <ScoreBar label="Zipf R²" score={result.zipfScore} icon={<BookOpen className="w-3 h-3" />} />
        <ScoreBar label="Voix passive" score={result.passiveVoiceScore} icon={<MessageSquare className="w-3 h-3" />} />
      </div>

      {/* Humanization & SUCKS overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-3 rounded-md border border-border bg-background/40 text-center">
          <div className="text-2xl font-bold text-success">{result.humanizationScore}%</div>
          <p className="text-xs text-muted-foreground">Score d'humanisation</p>
        </div>
        <div className="p-3 rounded-md border border-border bg-background/40 text-center">
          <div className="text-2xl font-bold text-primary">{result.sucksScore}</div>
          <p className="text-xs text-muted-foreground">Score SUCKS</p>
        </div>
        <div className="p-3 rounded-md border border-border bg-background/40 text-center">
          <div className="text-2xl font-bold text-foreground">{result.patternCount}</div>
          <p className="text-xs text-muted-foreground">Motifs IA détectés</p>
        </div>
      </div>

      {/* Pre-flight checklist */}
      {result.checklist.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-sm font-medium text-muted-foreground">Checklist pré-envoi</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {result.checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {item.passed ? (
                  <Check className="w-4 h-4 text-success flex-shrink-0" aria-label="Réussi" />
                ) : (
                  <X className="w-4 h-4 text-destructive flex-shrink-0" aria-label="Échoué" />
                )}
                <span className={item.passed ? "text-muted-foreground" : "text-foreground"}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues found */}
      {result.details.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-sm font-medium text-muted-foreground">Problèmes détectés</h4>
          <div className="space-y-2">
            {result.details.map((detail, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border ${getSeverityColor(detail.severity)}`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getSeverityIconColor(detail.severity)}`} />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{detail.category}</p>
                    <p className="text-xs text-muted-foreground">{detail.issue}</p>
                    {detail.examples && detail.examples.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {detail.examples.map((example, i) => (
                          <span
                            key={i}
                            className="text-xs px-1.5 py-0.5 rounded bg-background/50 text-muted-foreground"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    )}
                    {detail.suggestions && detail.suggestions.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {detail.suggestions.map((s, i) => (
                          <p key={i} className="flex items-start gap-1.5 text-xs text-primary">
                            <Wand2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{s}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};