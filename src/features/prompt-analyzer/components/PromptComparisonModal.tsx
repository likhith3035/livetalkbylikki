import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImprovementLevel, PromptAnalysisResult } from "../types";
import { Sparkles, Copy, Check, FileText, CheckCircle, SplitSquareVertical, GitCompare, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface PromptComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: PromptAnalysisResult;
  selectedLevel: ImprovementLevel;
  onUseImproved: (text: string) => void;
}

export const PromptComparisonModal: React.FC<PromptComparisonModalProps> = ({
  isOpen,
  onClose,
  result,
  selectedLevel,
  onUseImproved,
}) => {
  const [copiedImproved, setCopiedImproved] = React.useState(false);
  const [copiedOriginal, setCopiedOriginal] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"split" | "diff">("split");

  const origScrollRef = React.useRef<HTMLDivElement>(null);
  const impScrollRef = React.useRef<HTMLDivElement>(null);
  const isSyncingRef = React.useRef(false);

  const originalText = result.originalPrompt;
  const improvedText = result.improvedPrompts[selectedLevel] || result.improvedPrompts.better;

  const origWords = originalText.trim() ? originalText.trim().split(/\s+/).length : 0;
  const impWords = improvedText.trim() ? improvedText.trim().split(/\s+/).length : 0;
  const wordDiff = impWords - origWords;

  // Dynamic projected score calculation based on improvement variant & initial score
  const getProjectedScore = (baseScore: number, level: ImprovementLevel) => {
    const bonus = level === "master" ? 28 : level === "detailed" ? 22 : level === "creative" ? 20 : 16;
    return Math.min(99, Math.max(88, baseScore + bonus));
  };
  const projectedScore = getProjectedScore(result.overallScore, selectedLevel);

  // Synchronized scroll between left and right panes
  const handleScroll = (source: "orig" | "imp") => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    const src = source === "orig" ? origScrollRef.current : impScrollRef.current;
    const target = source === "orig" ? impScrollRef.current : origScrollRef.current;
    if (src && target) {
      const scrollPercentage = src.scrollTop / (src.scrollHeight - src.clientHeight || 1);
      target.scrollTop = scrollPercentage * (target.scrollHeight - target.clientHeight);
    }
    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  };

  const handleCopyImproved = async () => {
    try {
      await navigator.clipboard.writeText(improvedText);
      setCopiedImproved(true);
      toast.success("Improved prompt copied!");
      setTimeout(() => setCopiedImproved(false), 2000);
    } catch {
      toast.error("Failed to copy.");
    }
  };

  const handleCopyOriginal = async () => {
    try {
      await navigator.clipboard.writeText(originalText);
      setCopiedOriginal(true);
      toast.success("Original prompt copied!");
      setTimeout(() => setCopiedOriginal(false), 2000);
    } catch {
      toast.error("Failed to copy.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] p-6 rounded-2xl bg-card border-border/80 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 pb-3 border-b border-border/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-xs border-primary/30 text-primary bg-primary/10">
                <Sparkles className="h-3 w-3" /> Side-by-Side Comparison
              </Badge>
              <Badge variant="outline" className="text-xs capitalize font-semibold">
                {selectedLevel.replace("_", " ")} Variant
              </Badge>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-secondary/50 p-0.5 rounded-lg border border-border/40">
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  viewMode === "split"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <SplitSquareVertical className="h-3 w-3" /> Split View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("diff")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  viewMode === "diff"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <GitCompare className="h-3 w-3" /> Diff Breakdown
              </button>
            </div>
          </div>
          <DialogTitle className="text-xl font-display font-bold text-foreground">
            Original vs. Transformed Prompt
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Compare your initial prompt directive directly with the AI-improved version.
          </DialogDescription>
        </DialogHeader>

        {/* Stats Pill Row */}
        <div className="grid grid-cols-3 gap-3 py-3">
          <div className="p-3 rounded-xl bg-secondary/40 border border-border/40 text-center">
            <p className="text-[11px] text-muted-foreground font-medium">Original Score</p>
            <p className="text-lg font-bold text-foreground font-mono">{result.overallScore}/100</p>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-center">
            <p className="text-[11px] text-primary font-medium">Projected Score</p>
            <p className="text-lg font-bold text-primary font-mono">{projectedScore}/100</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/40 border border-border/40 text-center">
            <p className="text-[11px] text-muted-foreground font-medium">Word Count</p>
            <p className="text-lg font-bold text-foreground font-mono">
              {origWords} → {impWords} ({wordDiff > 0 ? `+${wordDiff}` : wordDiff})
            </p>
          </div>
        </div>

        {/* Split View */}
        {viewMode === "split" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Left: Original */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Original Prompt
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {origWords} words
                </Badge>
              </div>
              <div
                ref={origScrollRef}
                onScroll={() => handleScroll("orig")}
                className="p-4 rounded-xl bg-background border border-border text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap min-h-[220px] max-h-[350px] overflow-y-auto"
              >
                {originalText}
              </div>
            </div>

            {/* Right: Improved */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Improved Prompt ({selectedLevel.replace("_", " ")})
                </span>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  {impWords} words
                </Badge>
              </div>
              <div
                ref={impScrollRef}
                onScroll={() => handleScroll("imp")}
                className="p-4 rounded-xl bg-primary/5 border border-primary/30 text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap min-h-[220px] max-h-[350px] overflow-y-auto shadow-inner"
              >
                {improvedText}
              </div>
            </div>
          </div>
        ) : (
          /* Diff Mode */
          <div className="space-y-3 pt-1">
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-destructive uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Original Baseline ({origWords} words)
                </span>
                <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">
                  Baseline
                </Badge>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border border-border/40 text-xs font-mono text-muted-foreground whitespace-pre-wrap max-h-[160px] overflow-y-auto">
                {originalText}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Transformed Architecture ({impWords} words)
                </span>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">
                  +{wordDiff > 0 ? wordDiff : 0} context & constraints
                </Badge>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border border-border/40 text-xs font-mono text-foreground whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                {improvedText}
              </div>
            </div>
          </div>
        )}

        {/* Key Fixes Summary */}
        {result.changes.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/40">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
              Key Modifications Applied:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.changes.slice(0, 4).map((c, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/30 border border-border/40 text-xs">
                  <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">{c.change}:</span>{" "}
                    <span className="text-muted-foreground">{c.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyOriginal}
            className="text-xs gap-1.5 rounded-xl text-muted-foreground hover:text-foreground"
          >
            {copiedOriginal ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedOriginal ? "Original Copied" : "Copy Original"}
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs rounded-xl">
              Close
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyImproved}
              className="text-xs gap-1.5 rounded-xl border-border/60"
            >
              {copiedImproved ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedImproved ? "Copied" : "Copy Improved"}
            </Button>

            <Button
              size="sm"
              onClick={() => {
                onUseImproved(improvedText);
                onClose();
              }}
              className="text-xs gap-1.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90"
            >
              <Sparkles className="h-3.5 w-3.5" /> Load into Editor
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
