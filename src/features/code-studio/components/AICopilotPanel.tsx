import React, { useState } from "react";
import {
  Sparkles,
  Wrench,
  BookOpen,
  Zap,
  TestTube2,
  Send,
  Check,
  Copy,
  ArrowRight,
  Key,
  Flame,
  Bot,
  Layers,
  AlertCircle,
  ClipboardPaste,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  AICodeActionType,
  AICodeRequest,
  AICodeResponse,
  CodingChallenge,
  SupportedLanguage,
} from "../types";
import { requestAICodeAssistance } from "../services/aiCodingService";
import { autoRecognizeOpenModel } from "../services/openModelService";
import { getAutoDetectedAPIKeys, detectKeyFromClipboard } from "../services/apiKeyDetectionService";
import { toast } from "sonner";

interface AICopilotPanelProps {
  code: string;
  language: SupportedLanguage;
  currentError: string | null;
  activeChallenge: CodingChallenge | null;
  onApplyCode: (newCode: string) => void;
  onOpenKeyModal: () => void;
  hasActiveKey: boolean;
  isOpenModelActive: boolean;
}

export const AICopilotPanel: React.FC<AICopilotPanelProps> = ({
  code,
  language,
  currentError,
  activeChallenge,
  onApplyCode,
  onOpenKeyModal,
  hasActiveKey,
  isOpenModelActive,
}) => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AICodeResponse | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  const handleAction = async (action: AICodeActionType, promptText?: string) => {
    if (!code.trim() && !promptText) {
      toast.error("Please enter some code in the editor first.");
      return;
    }

    setLoading(true);
    try {
      const res = await requestAICodeAssistance({
        action,
        code,
        language,
        errorMessage: currentError || undefined,
        userPrompt: promptText,
        activeChallenge: activeChallenge || undefined,
      });
      setResponse(res);
      toast.success(res.summary);
    } catch (err: any) {
      toast.error(err?.message || "Failed to get AI assistance");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (response?.suggestedCode) {
      onApplyCode(response.suggestedCode);
      toast.success("Applied AI code directly to editor!");
    }
  };

  const handleCopySuggested = () => {
    if (response?.suggestedCode) {
      navigator.clipboard.writeText(response.suggestedCode);
      setCopiedCode(true);
      toast.success("Suggested code copied!");
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-card/70 backdrop-blur-xl border-l border-border/50 overflow-hidden text-xs">
      {/* Top Copilot Bar */}
      <div className="p-3 border-b border-border/50 bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 font-black text-foreground text-sm">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <span>AI Copilot & Error Solver</span>
          </div>

          <button
            onClick={onOpenKeyModal}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border/60 bg-background/80 hover:bg-muted text-[10px] font-semibold cursor-pointer transition-colors"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOpenModelActive || hasActiveKey ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span>{isOpenModelActive ? "Open Model" : hasActiveKey ? "Active Key" : "No Key"}</span>
          </button>
        </div>

        {/* 1-Tap Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction("fix_error")}
            disabled={loading}
            className={`h-7 text-[11px] gap-1.5 font-bold cursor-pointer transition-all ${
              currentError
                ? "bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25 animate-pulse"
                : "bg-background/80 border-border/60 hover:bg-muted"
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-red-400" />
            <span>Fix Errors & Bugs</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction("explain")}
            disabled={loading}
            className="h-7 text-[11px] gap-1.5 bg-background/80 border-border/60 hover:bg-muted font-bold cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Explain Line-by-Line</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction("optimize")}
            disabled={loading}
            className="h-7 text-[11px] gap-1.5 bg-background/80 border-border/60 hover:bg-muted font-bold cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Optimize Speed</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction("generate_tests")}
            disabled={loading}
            className="h-7 text-[11px] gap-1.5 bg-background/80 border-border/60 hover:bg-muted font-bold cursor-pointer"
          >
            <TestTube2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Generate Tests</span>
          </Button>
        </div>

        {/* Live Auto-Recognized Open Model Status Banner */}
        {isOpenModelActive && (
          <div className="mt-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-foreground truncate block text-[11px]">
                  Auto-Recognized: {autoRecognizeOpenModel(Boolean(getAutoDetectedAPIKeys().groq), Boolean(getAutoDetectedAPIKeys().openrouter), { action: currentError ? "fix_error" : "coding", language }).model.name}
                </span>
                <span className="text-[10px] text-emerald-400 font-medium truncate block">
                  {autoRecognizeOpenModel(Boolean(getAutoDetectedAPIKeys().groq), Boolean(getAutoDetectedAPIKeys().openrouter), { action: currentError ? "fix_error" : "coding", language }).reason}
                </span>
              </div>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 shrink-0">
              {autoRecognizeOpenModel(Boolean(getAutoDetectedAPIKeys().groq), Boolean(getAutoDetectedAPIKeys().openrouter), { action: currentError ? "fix_error" : "coding", language }).speed}
            </span>
          </div>
        )}

        {/* Clipboard Auto-Detect Prompt if no keys */}
        {!hasActiveKey && !isOpenModelActive && (
          <div className="mt-2 p-1.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground text-[10px]">Take API key from clipboard?</span>
            <button
              onClick={async () => {
                const res = await detectKeyFromClipboard();
                if (res.success) toast.success(res.message);
                else onOpenKeyModal();
              }}
              className="text-primary hover:underline font-bold text-[10px] flex items-center gap-1 cursor-pointer"
            >
              <ClipboardPaste className="w-3 h-3" /> Auto-Detect
            </button>
          </div>
        )}
      </div>

      {/* Main Body: AI Response Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground animate-pulse">
            <span className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs font-semibold">AI Copilot is diagnosing your code...</p>
          </div>
        ) : response ? (
          <div className="space-y-3">
            {/* Header info with complexity tags */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-indigo-500/10 border border-primary/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-foreground text-xs">{response.summary}</span>
                <span className="text-[10px] text-muted-foreground font-mono bg-background/60 px-1.5 py-0.5 rounded border border-border/40">
                  {response.usedModel}
                </span>
              </div>

              {(response.timeComplexity || response.spaceComplexity) && (
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  {response.timeComplexity && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      Time: {response.timeComplexity}
                    </span>
                  )}
                  {response.spaceComplexity && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      Space: {response.spaceComplexity}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Detailed Explanation */}
            <div className="p-3 rounded-xl bg-background/80 border border-border/50 text-[11px] sm:text-xs leading-relaxed space-y-2">
              <pre className="whitespace-pre-wrap font-sans text-foreground/90 break-words">
                {response.detailedExplanation}
              </pre>

              {/* Key Takeaways */}
              {response.keyTakeaways && response.keyTakeaways.length > 0 && (
                <div className="pt-2 border-t border-border/40 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Key Lessons
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[11px]">
                    {response.keyTakeaways.map((k, i) => (
                      <li key={i} className="text-foreground/80">{k}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Suggested Code Preview with 1-Tap Apply */}
            {response.suggestedCode && (
              <div className="rounded-xl border border-border/60 overflow-hidden bg-[#0d1117]">
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-border/40 text-[10px]">
                  <span className="text-muted-foreground font-mono font-bold">Suggested Code</span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopySuggested}
                      className="h-6 px-2 text-[10px] gap-1 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleApply}
                      className="h-6 px-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-[10px] gap-1 shadow-sm cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Apply to Editor</span>
                    </Button>
                  </div>
                </div>

                <pre className="p-3 text-[11px] font-mono text-zinc-200 overflow-x-auto selection:bg-indigo-500/30">
                  {response.suggestedCode}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center text-muted-foreground select-none">
            <Bot className="w-10 h-10 opacity-30 stroke-[1.5]" />
            <p className="text-xs font-semibold">How can AI help your code?</p>
            <p className="text-[11px] text-muted-foreground/80 max-w-[240px]">
              Tap <span className="text-red-400 font-bold">"Fix Errors"</span> to auto-solve bugs or ask any coding question below.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Custom Ask Input */}
      <div className="p-2 sm:p-3 border-t border-border/50 bg-background/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (customPrompt.trim()) {
              handleAction("custom_chat", customPrompt.trim());
              setCustomPrompt("");
            }
          }}
          className="relative flex items-center"
        >
          <Input
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ask AI Copilot about this code..."
            className="h-9 pr-9 text-xs bg-muted/50 border-border/60 rounded-xl"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!customPrompt.trim() || loading}
            className="absolute right-1.5 p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 transition-all cursor-pointer shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
