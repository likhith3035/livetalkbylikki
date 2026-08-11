import React from "react";
import { HelpCircle, CheckCircle2, FileQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ContextAnalysisSectionProps {
  missingContext: string[];
  suggestedQuestions: string[];
}

export const ContextAnalysisSection: React.FC<ContextAnalysisSectionProps> = ({
  missingContext,
  suggestedQuestions,
}) => {
  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
          <FileQuestion className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-display font-bold text-foreground">
            Context Analysis & Suggested Questions
          </h3>
          <p className="text-xs text-muted-foreground">
            Key details that could materially change the AI's answer.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Missing Context */}
        <div className="space-y-3 p-4 rounded-xl bg-secondary/30 border border-border/40">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-amber-500" /> Missing Information:
          </h4>

          {missingContext.length > 0 ? (
            <ul className="space-y-2 text-xs">
              {missingContext.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-emerald-500 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Comprehensive context provided!
            </p>
          )}
        </div>

        {/* Clarifying Questions */}
        <div className="space-y-3 p-4 rounded-xl bg-secondary/30 border border-border/40">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FileQuestion className="h-3.5 w-3.5 text-primary" /> Ask Yourself These 5 Questions:
          </h4>

          <ol className="space-y-2 text-xs">
            {suggestedQuestions.map((q, idx) => (
              <li key={idx} className="flex items-start gap-2 text-foreground font-medium">
                <Badge variant="outline" className="h-4 w-4 p-0 shrink-0 flex items-center justify-center text-[10px] font-mono border-primary/30 text-primary">
                  {idx + 1}
                </Badge>
                <span className="leading-tight">{q}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};
