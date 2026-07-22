import React from "react";
import { TokenUsage } from "../types";
import { Cpu, Zap, DollarSign, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TokenBadgeProps {
  usage?: TokenUsage;
  providerName?: string;
  modelName?: string;
}

export const TokenBadge: React.FC<TokenBadgeProps> = ({ usage, providerName, modelName }) => {
  if (!usage) return null;

  const seconds = (usage.responseTimeMs / 1000).toFixed(2);

  return (
    <div className="mt-2.5 pt-2 border-t border-border/40 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-muted-foreground select-none">
      {/* Provider & Model badge */}
      {providerName && (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          <Cpu className="h-3 w-3" />
          <span>{providerName} ({modelName})</span>
        </span>
      )}

      {/* Local Badge or Cloud Cost */}
      {usage.isLocal ? (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <Zap className="h-3 w-3" />
          <span>Running Locally</span>
        </span>
      ) : usage.estimatedCost !== undefined ? (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <DollarSign className="h-3 w-3" />
          <span>Est. Cost: ${usage.estimatedCost.toFixed(5)}</span>
        </span>
      ) : null}

      {/* Latency */}
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/40">
        <Clock className="h-3 w-3" />
        <span>{seconds}s</span>
      </span>

      {/* Token counts */}
      <span className="px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground/80 border border-border/30">
        Prompt: {usage.promptTokens} | Completion: {usage.completionTokens} | Total: {usage.totalTokens} tokens
      </span>
    </div>
  );
};
