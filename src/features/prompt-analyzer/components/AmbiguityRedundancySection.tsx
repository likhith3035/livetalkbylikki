import React from "react";
import { AmbiguityItem, ContradictionItem, RedundancyItem } from "../types";
import { AlertCircle, ShieldAlert, Repeat, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AmbiguityRedundancySectionProps {
  ambiguities: AmbiguityItem[];
  contradictions: ContradictionItem[];
  redundancies: RedundancyItem[];
}

export const AmbiguityRedundancySection: React.FC<AmbiguityRedundancySectionProps> = ({
  ambiguities,
  contradictions,
  redundancies,
}) => {
  const hasItems = ambiguities.length > 0 || contradictions.length > 0 || redundancies.length > 0;

  if (!hasItems) {
    return (
      <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2 text-emerald-500 font-display font-bold text-base">
          <CheckCircle2 className="h-5 w-5" /> Clean Language & Precision
        </div>
        <p className="text-xs text-muted-foreground">
          No subjective buzzwords, contradictions, or repetitive instructions were found in your prompt.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
          <AlertCircle className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-display font-bold text-foreground">
            Ambiguity, Contradiction & Redundancy Check
          </h3>
          <p className="text-xs text-muted-foreground">
            Identify vague words and conflicting guidelines before sending to AI.
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        {/* Contradictions */}
        {contradictions.map((c, i) => (
          <div key={i} className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 space-y-2">
            <div className="flex items-center gap-2 text-destructive font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="h-4 w-4" /> Contradiction Detected: {c.conflict}
            </div>
            <p className="text-xs text-foreground leading-relaxed">{c.explanation}</p>
            <div className="text-xs font-medium text-destructive-foreground bg-destructive/15 p-2 rounded-lg">
              <strong>Suggested Resolution:</strong> {c.suggestedResolution}
            </div>
          </div>
        ))}

        {/* Ambiguities */}
        {ambiguities.length > 0 && (
          <div className="p-4 rounded-xl bg-secondary/40 border border-border/50 space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Ambiguous Buzzwords ({ambiguities.length}):
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ambiguities.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-card border border-border/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[11px] font-mono border-amber-500/40 text-amber-500 bg-amber-500/5">
                      "{item.phrase}"
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-tight">{item.reason}</p>
                  <p className="text-foreground font-medium text-[11px] pt-0.5">💡 {item.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Redundancies */}
        {redundancies.map((r, i) => (
          <div key={i} className="p-3.5 rounded-xl bg-secondary/30 border border-border/40 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Repeat className="h-3.5 w-3.5 text-purple-500" /> Redundant Phrase: "{r.phrase}"
            </div>
            <p className="text-muted-foreground text-[11px]">{r.explanation}</p>
            <p className="text-foreground font-medium text-[11px]">✨ Consolidated Fix: {r.consolidated}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
