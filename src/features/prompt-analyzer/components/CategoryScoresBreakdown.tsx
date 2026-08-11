import React from "react";
import { CategoryScores } from "../types";
import { Progress } from "@/components/ui/progress";
import { Sliders } from "lucide-react";

interface CategoryScoresBreakdownProps {
  scores: CategoryScores;
}

export const CategoryScoresBreakdown: React.FC<CategoryScoresBreakdownProps> = ({ scores }) => {
  const items = [
    { label: "Clarity", score: scores.clarity, desc: "How easy it is to understand the core request" },
    { label: "Context", score: scores.context, desc: "Background information & environment details" },
    { label: "Specificity", score: scores.specificity, desc: "Precision of instructions and criteria" },
    { label: "Goal Definition", score: scores.goalDefinition, desc: "Explicit statement of desired outcome" },
    { label: "Requirements", score: scores.requirements, desc: "Functional and technical specifications" },
    { label: "Constraints", score: scores.constraints, desc: "Limits, boundaries, and negative rules" },
    { label: "Output Format", score: scores.outputFormat, desc: "Structure (Markdown, JSON, table, code)" },
    ...(scores.audience !== undefined ? [{ label: "Audience", score: scores.audience, desc: "Target reader or user persona" }] : []),
    ...(scores.examples !== undefined ? [{ label: "Examples", score: scores.examples, desc: "Sample inputs or few-shot references" }] : []),
    { label: "Ambiguity Filter", score: scores.ambiguity, desc: "Freedom from vague or subjective terms" },
  ];

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Sliders className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-display font-bold text-foreground">
            Category Score Breakdown
          </h3>
          <p className="text-xs text-muted-foreground">
            Evaluation across key prompt engineering dimensions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {items.map((item) => {
          let barColor = "bg-primary";
          if (item.score < 50) barColor = "bg-destructive";
          else if (item.score < 70) barColor = "bg-amber-500";
          else if (item.score >= 85) barColor = "bg-emerald-500";

          return (
            <div key={item.label} className="space-y-1.5 p-3 rounded-xl bg-secondary/30 border border-border/30">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground">{item.label}</span>
                <span className="font-mono font-bold text-foreground">{item.score}/100</span>
              </div>

              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.max(5, item.score)}%` }}
                />
              </div>

              <p className="text-[11px] text-muted-foreground leading-tight">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
