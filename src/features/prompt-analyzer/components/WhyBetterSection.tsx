import React from "react";
import { PromptChange } from "../types";
import { Lightbulb, CheckCircle2, ArrowUpRight } from "lucide-react";

interface WhyBetterSectionProps {
  changes: PromptChange[];
}

export const WhyBetterSection: React.FC<WhyBetterSectionProps> = ({ changes }) => {
  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-display font-bold text-foreground">
            Why Is This Prompt Better?
          </h3>
          <p className="text-xs text-muted-foreground">
            Detailed explanation of what changed and how it impacts AI performance.
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        {changes.map((item, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-secondary/40 border border-border/50 space-y-2">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              {item.change}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
              <div className="space-y-0.5">
                <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block">
                  Why was it changed?
                </span>
                <p className="text-foreground leading-snug">{item.reason}</p>
              </div>

              <div className="space-y-0.5 bg-card/60 p-2 rounded-lg border border-border/30">
                <span className="font-semibold text-primary uppercase text-[10px] tracking-wider block flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" /> Impact on AI Output:
                </span>
                <p className="text-foreground leading-snug">{item.impact}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
