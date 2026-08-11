import React from "react";
import { ArrowRight, MinusCircle, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BeforeAfterDiffViewProps {
  originalPrompt: string;
  improvedPrompt: string;
}

export const BeforeAfterDiffView: React.FC<BeforeAfterDiffViewProps> = ({
  originalPrompt,
  improvedPrompt,
}) => {
  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
          <ArrowRight className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-display font-bold text-foreground">
            Before vs. After Comparison
          </h3>
          <p className="text-xs text-muted-foreground">
            Side-by-side view contrasting original vs. transformed prompt structure.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Original */}
        <div className="space-y-2 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-destructive uppercase tracking-wider flex items-center gap-1">
              <MinusCircle className="h-3.5 w-3.5" /> Original Prompt
            </span>
            <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive font-mono">
              Before
            </Badge>
          </div>
          <p className="text-xs sm:text-sm font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap bg-background/50 p-3 rounded-lg border border-border/40 max-h-[220px] overflow-y-auto">
            {originalPrompt}
          </p>
        </div>

        {/* Improved */}
        <div className="space-y-2 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
              <PlusCircle className="h-3.5 w-3.5" /> Transformed Prompt
            </span>
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 font-mono">
              After
            </Badge>
          </div>
          <p className="text-xs sm:text-sm font-mono text-foreground leading-relaxed whitespace-pre-wrap bg-background/50 p-3 rounded-lg border border-border/40 max-h-[220px] overflow-y-auto">
            {improvedPrompt}
          </p>
        </div>
      </div>
    </div>
  );
};
