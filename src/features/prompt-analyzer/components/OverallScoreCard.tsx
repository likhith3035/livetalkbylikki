import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PromptAnalysisResult } from "../types";
import { ShieldAlert, AlertTriangle, CheckCircle2, HelpCircle, Sparkles, Tag, Download, Cpu, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface OverallScoreCardProps {
  result: PromptAnalysisResult;
}

export const OverallScoreCard: React.FC<OverallScoreCardProps> = ({ result }) => {
  const { overallScore, ratingLabel, categoryLabel, summary, issues, ambiguities, missingContext, engineSource } = result;
  const [copiedReport, setCopiedReport] = React.useState(false);

  const handleExportReport = async () => {
    const reportText = `# AI Prompt Quality Evaluation Report
Category: ${categoryLabel}
Score: ${overallScore}/100 (${ratingLabel})
Engine: ${engineSource || "Local Engine"}

## Summary
${summary}

## Category Scores
- Clarity: ${result.scores.clarity}/100
- Context: ${result.scores.context}/100
- Specificity: ${result.scores.specificity}/100
- Goal Definition: ${result.scores.goalDefinition}/100
- Requirements: ${result.scores.requirements}/100
- Constraints: ${result.scores.constraints}/100
- Output Format: ${result.scores.outputFormat}/100

## Original Prompt
\`\`\`
${result.originalPrompt}
\`\`\`

## Recommended Improved Prompt (Expert Variant)
\`\`\`
${result.improvedPrompts.expert || result.improvedPrompts.better}
\`\`\`

---
Evaluated via LiveTalk AI Prompt Quality Analyzer`;

    try {
      await navigator.clipboard.writeText(reportText);
      setCopiedReport(true);
      toast.success("Full analysis report copied to clipboard!");
      setTimeout(() => setCopiedReport(false), 2000);
    } catch {
      toast.error("Failed to copy report.");
    }
  };

  // Determine score color based on rating
  let scoreColorClass = "text-amber-500 border-amber-500/40 bg-amber-500/10";
  let ringBg = "stroke-amber-500";
  if (overallScore >= 86) {
    scoreColorClass = "text-emerald-500 border-emerald-500/40 bg-emerald-500/10";
    ringBg = "stroke-emerald-500";
  } else if (overallScore >= 71) {
    scoreColorClass = "text-primary border-primary/40 bg-primary/10";
    ringBg = "stroke-primary";
  } else if (overallScore <= 50) {
    scoreColorClass = "text-destructive border-destructive/40 bg-destructive/10";
    ringBg = "stroke-destructive";
  }

  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const majorCount = issues.filter((i) => i.severity === "major").length;

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Category & Title */}
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs font-semibold py-1 px-3 border-primary/30 text-primary bg-primary/5">
              <Tag className="h-3 w-3" /> {categoryLabel}
            </Badge>

            <Badge variant="outline" className="gap-1 text-[11px] font-mono py-0.5 px-2.5 border-border/60 text-muted-foreground bg-secondary/50">
              <Cpu className="h-3 w-3 text-primary" /> {engineSource || "Local Engine"}
            </Badge>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground flex items-center gap-2">
              Prompt Quality Evaluation
            </h3>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportReport}
              className="text-xs gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/10 shrink-0"
            >
              {copiedReport ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedReport ? "Report Copied" : "Export Report"}
            </Button>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
            {summary}
          </p>
        </div>

        {/* Right: Score Gauge Circle */}
        <div className="flex items-center gap-4 bg-secondary/40 border border-border/60 p-4 rounded-2xl shrink-0 self-stretch sm:self-auto justify-center">
          <div className="relative flex items-center justify-center h-20 w-20">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-border"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={ringBg}
                strokeDasharray={`${overallScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-display font-extrabold text-foreground leading-none">
                {overallScore}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono font-medium mt-0.5">
                /100
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Overall Score
            </span>
            <span className={`inline-block text-sm font-bold px-2.5 py-0.5 rounded-md border ${scoreColorClass}`}>
              {ratingLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Status Pill Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-border/40">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 border border-border/40">
          <ShieldAlert className={`h-4 w-4 shrink-0 ${criticalCount > 0 ? "text-destructive" : "text-emerald-500"}`} />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium truncate">Critical Issues</p>
            <p className="text-sm font-bold text-foreground">{criticalCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 border border-border/40">
          <AlertTriangle className={`h-4 w-4 shrink-0 ${majorCount > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium truncate">Major Issues</p>
            <p className="text-sm font-bold text-foreground">{majorCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 border border-border/40">
          <HelpCircle className="h-4 w-4 text-purple-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium truncate">Vague Buzzwords</p>
            <p className="text-sm font-bold text-foreground">{ambiguities.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 border border-border/40">
          <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium truncate">Missing Context</p>
            <p className="text-sm font-bold text-foreground">{missingContext.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
