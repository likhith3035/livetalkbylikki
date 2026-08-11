import React from "react";
import { LearningTip } from "../types";
import { BookOpen, Sparkles } from "lucide-react";

interface LearningTipsSectionProps {
  tips: LearningTip[];
}

export const LearningTipsSection: React.FC<LearningTipsSectionProps> = ({ tips }) => {
  return (
    <div className="bg-card border border-primary/30 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
          <BookOpen className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-display font-bold text-foreground flex items-center gap-2">
            Learn From Your Prompt
          </h3>
          <p className="text-xs text-muted-foreground">
            Personalized prompt engineering lessons based on your actual request.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
        {tips.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-secondary/40 border border-border/50 space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-display font-bold text-xs sm:text-sm text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                {item.title}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.tip}</p>
            </div>

            {item.example && (
              <div className="pt-2 border-t border-border/30 text-[11px] font-mono text-primary bg-primary/5 p-2 rounded-lg">
                <strong>Example:</strong> {item.example}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
