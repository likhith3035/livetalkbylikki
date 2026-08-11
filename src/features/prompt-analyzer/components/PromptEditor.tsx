import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Trash2, Clipboard, Wand2, RefreshCw, Key, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PRESET_EXAMPLES } from "../hooks/usePromptAnalyzer";
import { ExamplePrompt } from "../types";
import { BYOKModal, getSavedBYOKKeys } from "./BYOKModal";

interface PromptEditorProps {
  promptInput: string;
  setPromptInput: (value: string) => void;
  wordCount: number;
  charCount: number;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onClear: () => void;
  onLoadExample: (example: ExamplePrompt) => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  promptInput,
  setPromptInput,
  wordCount,
  charCount,
  isAnalyzing,
  onAnalyze,
  onClear,
  onLoadExample,
}) => {
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const byokKeys = getSavedBYOKKeys();
  const hasBYOKKey = !!(
    byokKeys.openai ||
    byokKeys.gemini ||
    byokKeys.sarvam ||
    byokKeys.groq ||
    byokKeys.openrouter ||
    import.meta.env.VITE_OPENAI_API_KEY ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.VITE_SARVAM_API_KEY
  );

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPromptInput(text);
        toast.success("Pasted prompt from clipboard!");
      }
    } catch {
      toast.error("Unable to read clipboard. Please paste manually.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (promptInput.trim() && !isAnalyzing) {
        onAnalyze();
      }
    }
  };

  return (
    <>
      <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold">
              <Wand2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-bold text-foreground flex items-center gap-2">
                Prompt Editor
                {hasBYOKKey && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                    <ShieldCheck className="h-3 w-3" /> LLM Powered
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                Paste or type your AI prompt below to evaluate clarity, context, and quality.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsKeyModalOpen(true)}
              className="text-xs gap-1.5 rounded-xl border-border/70 text-muted-foreground hover:text-foreground"
            >
              <Key className="h-3.5 w-3.5 text-primary" /> Key Settings (BYOK)
            </Button>

            {/* Counters */}
            <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-muted-foreground bg-secondary/60 px-3 py-1.5 rounded-lg border border-border/40">
              <span>
                <strong className="text-foreground">{wordCount}</strong> words
              </span>
              <span className="text-border">|</span>
              <span>
                <strong className="text-foreground">{charCount}</strong> chars
              </span>
            </div>
          </div>
        </div>

        {/* Preset Examples Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
            <Sparkles className="h-3 w-3 text-primary" /> Test Examples:
          </span>
          {PRESET_EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => onLoadExample(ex)}
              className="text-xs px-2.5 py-1 rounded-full bg-secondary/80 hover:bg-primary/20 hover:text-primary border border-border/60 text-foreground transition-all duration-150 active:scale-95 font-medium"
              title={ex.description}
            >
              {ex.title}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div className="relative group">
          <Textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste your prompt here and discover how to make it better... (e.g. 'make a website for my college' or 'create a python calculator')"
            className="min-h-[160px] sm:min-h-[200px] text-sm sm:text-base p-4 bg-background/80 border-border/70 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 rounded-xl resize-y leading-relaxed font-body transition-all"
          />
          {promptInput && (
            <button
              type="button"
              onClick={onClear}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-card/80 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Clear prompt text"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePaste}
              className="text-xs gap-1.5 rounded-xl border-border/70 hover:bg-secondary"
            >
              <Clipboard className="h-3.5 w-3.5" /> Paste
            </Button>

            {promptInput && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-xs gap-1.5 rounded-xl text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>

          <Button
            type="button"
            onClick={onAnalyze}
            disabled={!promptInput.trim() || isAnalyzing}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold rounded-xl gap-2 shadow-lg shadow-primary/25 bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Analyzing Prompt...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Analyze Prompt
              </>
            )}
          </Button>
        </div>
      </div>

      <BYOKModal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} />
    </>
  );
};
