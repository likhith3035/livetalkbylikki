import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Wrench,
  BookOpen,
  Zap,
  TestTube2,
  Send,
  Check,
  Copy,
  Bot,
  ClipboardPaste,
  Cpu,
  RotateCcw,
  ExternalLink,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AICodeActionType,
  AICodeResponse,
  CodingChallenge,
  SupportedLanguage,
} from "../types";
import { requestAICodeAssistance } from "../services/aiCodingService";
import { autoRecognizeOpenModel } from "../services/openModelService";
import { getAutoDetectedAPIKeys, detectKeyFromClipboard } from "../services/apiKeyDetectionService";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export interface CopilotChatMessage {
  id: string;
  sender: "user" | "copilot";
  text?: string;
  response?: AICodeResponse;
  timestamp: number;
}

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
  const [messages, setMessages] = useState<CopilotChatMessage[]>([
    {
      id: "welcome-1",
      sender: "copilot",
      text: "Hello! 👋 I'm your Code Studio AI Copilot. You can chat with me normally, ask any coding question, or tap 'Fix Errors' & 'Explain' anytime!",
      timestamp: Date.now(),
    },
  ]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleAction = async (action: AICodeActionType, promptText?: string) => {
    if (!code.trim() && !promptText) {
      toast.error("Please enter some code in the editor first.");
      return;
    }

    if (promptText) {
      const userMsg: CopilotChatMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: promptText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
    } else {
      // Action button triggered (e.g. Fix Errors, Explain)
      const actionLabels: Record<string, string> = {
        fix_error: "Fix Errors & Bugs in code",
        explain: "Explain this code line-by-line",
        optimize: "Optimize algorithm speed & memory",
        generate_tests: "Generate test cases for this code",
      };
      const userMsg: CopilotChatMessage = {
        id: `action-${Date.now()}`,
        sender: "user",
        text: actionLabels[action] || action,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
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

      const copilotMsg: CopilotChatMessage = {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        response: res,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, copilotMsg]);
      toast.success(res.summary);
    } catch (err: any) {
      toast.error(err?.message || "Failed to get AI assistance");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (suggestedCode?: string) => {
    if (suggestedCode) {
      onApplyCode(suggestedCode);
      toast.success("Applied AI code directly to editor!");
    }
  };

  const handleCopy = (id: string, text?: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "copilot",
        text: "Chat cleared! How can I help you with your code today?",
        timestamp: Date.now(),
      },
    ]);
    toast.info("Conversation reset");
  };

  return (
    <div className="flex flex-col h-full w-full bg-card/70 backdrop-blur-xl border-l border-border/50 overflow-hidden text-xs">
      {/* Top Copilot Bar */}
      <div className="p-3 border-b border-border/50 bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 font-black text-foreground text-sm">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#f0be65] via-[#e5a83b] to-[#d48c18] text-stone-950 flex items-center justify-center shadow-md shadow-amber-500/25">
              <Sparkles className="w-4 h-4" />
            </span>
            <span>AI Copilot & Chat</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearChat}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Clear Conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onOpenKeyModal}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border/60 bg-background/80 hover:bg-muted text-[10px] font-semibold cursor-pointer transition-colors"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOpenModelActive || hasActiveKey ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span>
                {getAutoDetectedAPIKeys().sarvam
                  ? "Sarvam AI (105B)"
                  : isOpenModelActive
                  ? "Open Model"
                  : hasActiveKey
                  ? "Active Key"
                  : "Offline AI"}
              </span>
            </button>
          </div>
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
                  Auto-Recognized:{" "}
                  {
                    autoRecognizeOpenModel(
                      Boolean(getAutoDetectedAPIKeys().groq),
                      Boolean(getAutoDetectedAPIKeys().openrouter),
                      { action: currentError ? "fix_error" : "coding", language }
                    ).model.name
                  }
                </span>
                <span className="text-[10px] text-emerald-400 font-medium truncate block">
                  {
                    autoRecognizeOpenModel(
                      Boolean(getAutoDetectedAPIKeys().groq),
                      Boolean(getAutoDetectedAPIKeys().openrouter),
                      { action: currentError ? "fix_error" : "coding", language }
                    ).reason
                  }
                </span>
              </div>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 shrink-0">
              {
                autoRecognizeOpenModel(
                  Boolean(getAutoDetectedAPIKeys().groq),
                  Boolean(getAutoDetectedAPIKeys().openrouter),
                  { action: currentError ? "fix_error" : "coding", language }
                ).speed
              }
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

      {/* Main Body: Conversational Chat Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m) => {
          if (m.sender === "user") {
            return (
              <div key={m.id} className="flex justify-end animate-in fade-in slide-in-from-bottom-1">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3.5 py-2 text-xs max-w-[85%] font-sans shadow-md">
                  {m.text}
                </div>
              </div>
            );
          }

          // Copilot Response / Message
          return (
            <div key={m.id} className="flex items-start gap-2 max-w-[95%] animate-in fade-in slide-in-from-bottom-1">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Bot className="w-3.5 h-3.5" />
              </div>

              <div className="flex-1 space-y-2">
                {/* Pure text chat message */}
                {m.text && (
                  <div className="p-2.5 rounded-2xl rounded-tl-sm bg-muted/60 border border-border/50 text-foreground leading-relaxed">
                    {m.text}
                  </div>
                )}

                {/* Structured AI Coding Response */}
                {m.response && (
                  <div className="space-y-2">
                    {/* Header Summary & Complexity */}
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-indigo-500/10 border border-primary/20 space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-foreground text-xs">{m.response.summary}</span>
                        <span className="text-[10px] text-muted-foreground font-mono bg-background/60 px-1.5 py-0.5 rounded border border-border/40 shrink-0">
                          {m.response.usedModel}
                        </span>
                      </div>

                      {(m.response.timeComplexity || m.response.spaceComplexity) && (
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          {m.response.timeComplexity && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              Time: {m.response.timeComplexity}
                            </span>
                          )}
                          {m.response.spaceComplexity && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                              Space: {m.response.spaceComplexity}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Detailed Explanation / Markdown */}
                    <div className="p-3 rounded-xl bg-background/80 border border-border/50 text-[11px] sm:text-xs leading-relaxed space-y-2">
                      <pre className="whitespace-pre-wrap font-sans text-foreground/90 break-words">
                        {m.response.detailedExplanation}
                      </pre>

                      {/* Key Takeaways */}
                      {m.response.keyTakeaways && m.response.keyTakeaways.length > 0 && (
                        <div className="pt-2 border-t border-border/40 space-y-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Key Takeaways
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[11px]">
                            {m.response.keyTakeaways.map((k, i) => (
                              <li key={i} className="text-foreground/80">{k}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Suggested Code Preview with 1-Tap Apply */}
                    {m.response.suggestedCode && (
                      <div className="rounded-xl border border-border/60 overflow-hidden bg-[#0d1117]">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-border/40 text-[10px]">
                          <span className="text-muted-foreground font-mono font-bold">Suggested Code</span>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(m.id, m.response?.suggestedCode)}
                              className="h-6 px-2 text-[10px] gap-1 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              {copiedId === m.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>Copy</span>
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => handleApply(m.response?.suggestedCode)}
                              className="h-6 px-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-[10px] gap-1 shadow-sm cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Apply to Editor</span>
                            </Button>
                          </div>
                        </div>

                        <pre className="p-3 text-[11px] font-mono text-zinc-200 overflow-x-auto selection:bg-indigo-500/30 leading-relaxed">
                          {m.response.suggestedCode}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs animate-in fade-in">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="bg-muted/50 border border-border/40 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
              <span className="text-[10px] ml-1">Copilot is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Custom Ask Input + Link to Full AI Chat */}
      <div className="p-2 sm:p-3 border-t border-border/50 bg-background/80 space-y-1.5">
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
            placeholder="Ask Copilot (e.g. 'hi', 'how to optimize this?', 'write a binary search')..."
            className="h-9 pr-9 text-xs bg-muted/50 border-border/60 rounded-xl placeholder:text-muted-foreground/60"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!customPrompt.trim() || loading}
            className="absolute right-1.5 p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 transition-all cursor-pointer shadow-sm hover:opacity-90"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
          <span>Chat naturally or ask coding questions</span>
          <Link
            to="/ai-chat"
            className="text-primary hover:underline font-semibold flex items-center gap-0.5"
          >
            <span>Full AI Chat (20+ Personas)</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
