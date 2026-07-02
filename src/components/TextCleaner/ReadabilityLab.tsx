import React, { useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Info } from "lucide-react";
import { analyzeReadability, type ReadabilityResult } from "@/lib/readability";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ReadabilityLabProps {
  text: string;
}

const COLOR_MAP = {
  green: "text-green-500",
  yellow: "text-yellow-500",
  orange: "text-orange-500",
  red: "text-red-500",
} as const;

const PROGRESS_COLOR_MAP = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
} as const;

interface IndexInfo {
  key: keyof Pick<ReadabilityResult, "fleschKincaid" | "lix" | "gunningFog" | "colemanLiau">;
  label: string;
  unit: string;
  inverted: boolean; // vrai si un score bas = meilleure lisibilité
  description: string;
  range: string;
}

const INDICES: IndexInfo[] = [
  {
    key: "fleschKincaid",
    label: "Flesch-Kincaid",
    unit: "/100",
    inverted: false,
    description:
      "Adapté au français (Kandel & Moles, 1958). Prend en compte la longueur des phrases et le nombre de syllabes par mot. Score élevé = texte plus lisible.",
    range: "90+ : très simple · 60–90 : accessible · 30–60 : intermédiaire · < 30 : complexe",
  },
  {
    key: "lix",
    label: "LIX",
    unit: "",
    inverted: true,
    description:
      "Läsbarhetsindex (Björnsson, 1968). Langue-agnostique. Mesure la proportion de mots longs (≥ 7 caractères). Score bas = texte plus lisible.",
    range: "< 25 : très simple · 25–40 : simple · 40–55 : intermédiaire · > 55 : difficile",
  },
  {
    key: "gunningFog",
    label: "Gunning Fog",
    unit: " ans",
    inverted: true,
    description:
      "Estimation des années d'études nécessaires. Adapté au français via les mots de 3 syllabes ou plus comme proxy de complexité. Valeur basse = texte plus accessible.",
    range: "6 : école primaire · 10 : collège · 12 : lycée · 16+ : universitaire",
  },
  {
    key: "colemanLiau",
    label: "Coleman-Liau",
    unit: " ans",
    inverted: true,
    description:
      "Opère sur les caractères plutôt que les syllabes, ce qui le rend robuste sur toutes les langues. Estimation des années d'études. Valeur basse = texte plus accessible.",
    range: "6–8 : école primaire · 9–10 : collège · 11–12 : lycée · 13+ : universitaire",
  },
];

function indexProgress(key: IndexInfo["key"], value: number): number {
  // Normaliser chaque indice en 0–100 pour la barre de progression
  // (sens croissant = meilleure lisibilité, cohérent avec la barre)
  switch (key) {
    case "fleschKincaid":
      return Math.min(100, Math.max(0, value));
    case "lix":
      // LIX : 0–70+, inverser
      return Math.min(100, Math.max(0, 100 - (value / 70) * 100));
    case "gunningFog":
      // GF : 6–20+, inverser, normaliser
      return Math.min(100, Math.max(0, 100 - ((value - 6) / 14) * 100));
    case "colemanLiau":
      // CLI : 1–16+, inverser, normaliser
      return Math.min(100, Math.max(0, 100 - ((value - 1) / 15) * 100));
    default:
      return 50;
  }
}

function indexColor(progress: number): "green" | "yellow" | "orange" | "red" {
  if (progress >= 75) return "green";
  if (progress >= 50) return "yellow";
  if (progress >= 30) return "orange";
  return "red";
}

export const ReadabilityLab: React.FC<ReadabilityLabProps> = ({ text }) => {
  const [open, setOpen] = useState(false);

  const result = useMemo(() => analyzeReadability(text), [text]);

  if (!result) return null;

  const { globalScore, label, color, metrics } = result;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
        {/* En-tête cliquable */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between text-sm font-medium"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Readability Lab
            <span className={`text-xs font-semibold ${COLOR_MAP[color]}`}>
              {label}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-xs font-bold tabular-nums">
              {globalScore}
              <span className="text-muted-foreground font-normal">/100</span>
            </span>
            {open ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </span>
        </button>

        {/* Barre de progression globale toujours visible */}
        <div className="relative h-2 rounded-full overflow-hidden bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${PROGRESS_COLOR_MAP[color]}`}
            style={{ width: `${globalScore}%` }}
          />
        </div>

        {open && (
          <div className="space-y-4 pt-1">
            {/* Grille des 4 indices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INDICES.map(({ key, label: indexLabel, unit, inverted, description, range }) => {
                const raw = result[key] as number;
                const progress = indexProgress(key, raw);
                const iColor = indexColor(progress);
                return (
                  <div
                    key={key}
                    className="rounded border border-border bg-background/40 p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs font-medium">
                        {indexLabel}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              <Info className="w-3 h-3 text-muted-foreground" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs space-y-1" side="top">
                            <p>{description}</p>
                            <p className="text-muted-foreground">{range}</p>
                            {inverted && (
                              <p className="text-muted-foreground italic">
                                ↓ Valeur basse = meilleur
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </span>
                      <span className={`text-sm font-bold tabular-nums ${COLOR_MAP[iColor]}`}>
                        {raw}
                        <span className="text-xs text-muted-foreground font-normal">{unit}</span>
                      </span>
                    </div>
                    <div className="relative h-1.5 rounded-full overflow-hidden bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${PROGRESS_COLOR_MAP[iColor]}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Métriques brutes */}
            <div className="border-t border-border/50 pt-3">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Métriques du texte</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                {[
                  { label: "Mots", value: metrics.wordCount },
                  { label: "Phrases", value: metrics.sentenceCount },
                  { label: "Mots/phrase", value: metrics.avgWordsPerSentence },
                  { label: "Syllabes/mot", value: metrics.avgSyllablesPerWord },
                  { label: "Mots longs", value: `${metrics.longWordRatio}%` },
                  { label: "Chars/mot", value: metrics.avgCharsPerWord },
                ].map(({ label: mLabel, value }) => (
                  <div
                    key={mLabel}
                    className="flex flex-col items-center p-1.5 rounded border border-border bg-background/40 text-center"
                  >
                    <span className="font-semibold tabular-nums">{value}</span>
                    <span className="text-muted-foreground leading-tight mt-0.5">{mLabel}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Note épistémique */}
            <p className="text-xs text-muted-foreground/70 leading-relaxed border-t border-border/40 pt-2">
              Ces indices fournissent des estimations comparatives, pas des verdicts absolus.
              Un texte technique spécialisé peut obtenir un score faible sans que cela soit un défaut
              pour son audience cible.
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
