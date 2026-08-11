import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImprovedPromptVariants, ImprovementLevel } from "../types";
import { Copy, Sparkles, Check, Zap, Award, Star } from "lucide-react";
import { toast } from "sonner";

interface ImprovedPromptCardProps {
  improvedPrompts: ImprovedPromptVariants;
  selectedLevel: ImprovementLevel;
  setSelectedLevel: (level: ImprovementLevel) => void;
  onUseImproved: (text: string) => void;
}

export const ImprovedPromptCard: React.FC<ImprovedPromptCardProps> = ({
  improvedPrompts,
  selectedLevel,
  setSelectedLevel,
  onUseImproved,
}) => {
  const [copied, setCopied] = React.useState(false);

  const activePromptText = improvedPrompts[selectedLevel] || improvedPrompts.better;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activePromptText);
      setCopied(true);
      toast.success(`Copied ${selectedLevel.replace("_", " ")} prompt to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard.");
    }
  };

  const levelDescriptions: Record<ImprovementLevel, { title: string; desc: string; icon: React.ReactNode }> = {
    quick_fix: {
      title: "Quick Fix",
      desc: "Minor tweaks fixing obvious flaws while keeping the prompt close to your original wording.",
      icon: <Zap className="h-3.5 w-3.5" />,
    },
    better: {
      title: "Better",
      desc: "Enhanced clarity, context, specificity, and structured output formatting.",
      icon: <Sparkles className="h-3.5 w-3.5 text-primary" />,
    },
    professional: {
      title: "Professional",
      desc: "Polished industry-standard prompt with role assignment, bounds, and clear constraints.",
      icon: <Award className="h-3.5 w-3.5 text-amber-500" />,
    },
    expert: {
      title: "Expert",
      desc: "System-level architecture prompt with explicit execution pipelines and negative constraints.",
      icon: <Star className="h-3.5 w-3.5 text-purple-500" />,
    },
  };

  const handleCopyAll = async () => {
    const allText = `=== 1. QUICK FIX ===
${improvedPrompts.quick_fix}

=== 2. BETTER ===
${improvedPrompts.better}

=== 3. PROFESSIONAL ===
${improvedPrompts.professional}

=== 4. EXPERT ===
${improvedPrompts.expert}`;

    try {
      await navigator.clipboard.writeText(allText);
      toast.success("Copied all 4 prompt variants to clipboard!");
    } catch {
      toast.error("Failed to copy all variants.");
    }
  };

  return (
    <div className="bg-card border border-primary/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-display font-bold text-foreground flex items-center gap-2">
              Significantly Improved Prompt
            </h3>
            <p className="text-xs text-muted-foreground">
              Transformed prompt tailored for reliable AI outputs.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyAll}
            className="flex-1 sm:flex-none text-xs font-semibold rounded-xl gap-1.5 border-border/60 text-muted-foreground hover:text-foreground"
          >
            <Copy className="h-3.5 w-3.5" /> Copy All Variants
          </Button>

          <Button
            type="button"
            onClick={handleCopy}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl gap-2 bg-primary text-primary-foreground hover:opacity-90 active:scale-95 shadow-md transition-all"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy Active Variant"}
          </Button>
        </div>
      </div>

      {/* 4 Improvement Level Selector */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
          Select Transformation Level:
        </span>
        <Tabs
          value={selectedLevel}
          onValueChange={(val) => setSelectedLevel(val as ImprovementLevel)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 bg-secondary/60 p-1 rounded-xl border border-border/50 h-auto gap-1">
            {(["quick_fix", "better", "professional", "expert"] as ImprovementLevel[]).map((lvl) => (
              <TabsTrigger
                key={lvl}
                value={lvl}
                className="text-xs py-2 px-2.5 rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all capitalize font-semibold flex items-center justify-center gap-1.5"
              >
                {levelDescriptions[lvl].icon}
                {levelDescriptions[lvl].title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Level Description */}
        <p className="text-xs text-muted-foreground italic px-1 pt-1">
          💡 <strong>{levelDescriptions[selectedLevel].title}:</strong> {levelDescriptions[selectedLevel].desc}
        </p>
      </div>

      {/* Display Box */}
      <div className="relative group">
        <pre className="p-4 sm:p-5 rounded-xl bg-background border border-border/70 text-xs sm:text-sm font-mono text-foreground leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-[300px] overflow-y-auto">
          {activePromptText}
        </pre>

        <div className="flex items-center justify-between gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onUseImproved(activePromptText)}
            className="text-xs gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
          >
            <Sparkles className="h-3.5 w-3.5" /> Load into Editor
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-xs gap-1.5 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <Copy className="h-3.5 w-3.5" /> Copy Text
          </Button>
        </div>
      </div>
    </div>
  );
};
