import React, { useRef, useState, useEffect, useCallback } from "react";
import { EditorTheme, SupportedLanguage } from "../types";
import { generateGhostCompletion, generateInlineEdit } from "../services/copilotService";
import {
  Sparkles,
  Wand2,
  Check,
  X,
  Zap,
  BookOpen,
  CornerDownLeft,
  Loader2,
  Bot,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  language: SupportedLanguage;
  theme: EditorTheme;
  fontSize: number;
  onRunShortcut?: () => void;
  onTriggerAICopilot?: (action: string, selectedText?: string) => void;
}

const THEME_STYLES: Record<
  EditorTheme,
  { bg: string; text: string; gutterBg: string; gutterText: string; activeLineBg: string; border: string }
> = {
  "midnight-cyber": {
    bg: "#090d16",
    text: "#e2e8f0",
    gutterBg: "#060910",
    gutterText: "#475569",
    activeLineBg: "rgba(99, 102, 241, 0.08)",
    border: "rgba(99, 102, 241, 0.2)",
  },
  monokai: {
    bg: "#272822",
    text: "#f8f8f2",
    gutterBg: "#1e1f1c",
    gutterText: "#75715e",
    activeLineBg: "rgba(255, 255, 255, 0.06)",
    border: "rgba(249, 38, 114, 0.2)",
  },
  "github-dark": {
    bg: "#0d1117",
    text: "#c9d1d9",
    gutterBg: "#010409",
    gutterText: "#484f58",
    activeLineBg: "rgba(56, 139, 253, 0.08)",
    border: "rgba(48, 54, 61, 0.8)",
  },
  "one-dark": {
    bg: "#282c34",
    text: "#abb2bf",
    gutterBg: "#21252b",
    gutterText: "#5c6370",
    activeLineBg: "rgba(255, 255, 255, 0.05)",
    border: "rgba(97, 175, 239, 0.2)",
  },
  "clean-light": {
    bg: "#ffffff",
    text: "#1e293b",
    gutterBg: "#f8fafc",
    gutterText: "#94a3b8",
    activeLineBg: "rgba(99, 102, 241, 0.05)",
    border: "rgba(226, 232, 240, 1)",
  },
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  theme,
  fontSize,
  onRunShortcut,
  onTriggerAICopilot,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

  // Editor cursor & stats
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [selection, setSelection] = useState({ start: 0, end: 0, text: "" });

  // 1. Ghost-Text Autocompletion State (GitHub Copilot style)
  const [copilotEnabled, setCopilotEnabled] = useState(true);
  const [ghostText, setGhostText] = useState("");
  const [ghostOffset, setGhostOffset] = useState(0);

  // 2. Inline AI Command Palette State (Cursor / Copilot Ctrl+K style)
  const [showInlinePrompt, setShowInlinePrompt] = useState(false);
  const [inlinePrompt, setInlinePrompt] = useState("");
  const [inlineLoading, setInlineLoading] = useState(false);
  const [inlinePreview, setInlinePreview] = useState<string | null>(null);
  const [inlineDiffSummary, setInlineDiffSummary] = useState<string | null>(null);

  const lines = value.split("\n");
  const themeStyle = THEME_STYLES[theme] || THEME_STYLES["midnight-cyber"];

  // Sync gutter & ghost overlay scroll with textarea
  const handleScroll = () => {
    if (textareaRef.current) {
      const top = textareaRef.current.scrollTop;
      const left = textareaRef.current.scrollLeft;
      if (gutterRef.current) gutterRef.current.scrollTop = top;
      if (overlayRef.current) {
        overlayRef.current.scrollTop = top;
        overlayRef.current.scrollLeft = left;
      }
    }
  };

  const updateCursorPosition = useCallback(() => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const textBefore = value.substring(0, start);
    const lineNum = textBefore.split("\n").length;
    const lastNewline = textBefore.lastIndexOf("\n");
    const colNum = start - lastNewline;
    setCursorPos({ line: lineNum, col: colNum });

    if (start !== end) {
      setSelection({
        start,
        end,
        text: value.substring(start, end),
      });
      // Clear ghost text when user is highlighting
      setGhostText("");
    } else {
      setSelection({ start: 0, end: 0, text: "" });
    }
  }, [value]);

  // Debounced Ghost Completion Trigger
  useEffect(() => {
    if (!copilotEnabled || showInlinePrompt) {
      setGhostText("");
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea || textarea.selectionStart !== textarea.selectionEnd) {
      setGhostText("");
      return;
    }

    const currentOffset = textarea.selectionStart;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const suggestion = await generateGhostCompletion({
          code: value,
          language,
          cursorOffset: currentOffset,
          signal: controller.signal,
        });

        // Ensure user hasn't typed or moved cursor during the async call
        if (textareaRef.current && textareaRef.current.selectionStart === currentOffset && suggestion) {
          setGhostText(suggestion);
          setGhostOffset(currentOffset);
        } else {
          setGhostText("");
        }
      } catch {
        setGhostText("");
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, cursorPos, copilotEnabled, language, showInlinePrompt]);

  // Focus inline prompt when opened
  useEffect(() => {
    if (showInlinePrompt) {
      setTimeout(() => inlineInputRef.current?.focus(), 50);
    }
  }, [showInlinePrompt]);

  // Execute Ctrl+K Inline Generation
  const handleExecuteInlineEdit = async (customPromptText?: string) => {
    const promptToRun = customPromptText || inlinePrompt;
    if (!promptToRun.trim()) return;

    setInlineLoading(true);
    setInlinePreview(null);
    try {
      const res = await generateInlineEdit({
        prompt: promptToRun,
        code: value,
        selectedText: selection.text || undefined,
        selectionStart: selection.start,
        selectionEnd: selection.end,
        language,
      });

      setInlinePreview(res.modifiedCode);
      setInlineDiffSummary(res.diffSummary);
      toast.success(`Copilot generated changes with ${res.model}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate inline edit");
    } finally {
      setInlineLoading(false);
    }
  };

  const handleAcceptInlineEdit = () => {
    if (inlinePreview !== null) {
      onChange(inlinePreview);
      setShowInlinePrompt(false);
      setInlinePreview(null);
      setInlinePrompt("");
      toast.success("Applied Copilot changes to editor!");
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleDiscardInlineEdit = () => {
    setShowInlinePrompt(false);
    setInlinePreview(null);
    setInlinePrompt("");
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Hotkey: Ctrl + K (or Cmd + K) -> Open Inline Copilot Command Palette
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setShowInlinePrompt(true);
      setGhostText("");
      return;
    }

    // 2. Hotkey: Ctrl + Enter (or Cmd + Enter) -> Run code
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onRunShortcut?.();
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    // 3. Tab Key Handling:
    // If Ghost Text is active -> ACCEPT GHOST COMPLETION (GitHub Copilot style!)
    if (e.key === "Tab") {
      e.preventDefault();
      if (ghostText && textarea.selectionStart === ghostOffset) {
        const nextVal =
          value.substring(0, ghostOffset) + ghostText + value.substring(ghostOffset);
        onChange(nextVal);
        const newPos = ghostOffset + ghostText.length;
        setGhostText("");
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newPos;
            updateCursorPosition();
          }
        }, 0);
        return;
      }

      // Otherwise: 2-space standard indentation
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = "  ";

      const nextVal = value.substring(0, start) + spaces + value.substring(end);
      onChange(nextVal);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
        updateCursorPosition();
      }, 0);
      return;
    }

    // 4. Escape Key: Dismiss ghost text
    if (e.key === "Escape") {
      if (ghostText) {
        e.preventDefault();
        setGhostText("");
        return;
      }
    }

    // 5. Smart Backspace: Delete pair if cursor is between matching brackets/quotes
    if (e.key === "Backspace") {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start === end && start > 0) {
        const charBefore = value[start - 1];
        const charAfter = value[start];
        const PAIRS_MAP: Record<string, string> = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'", "`": "`" };
        if (PAIRS_MAP[charBefore] === charAfter) {
          e.preventDefault();
          const nextVal = value.substring(0, start - 1) + value.substring(start + 1);
          onChange(nextVal);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start - 1;
            updateCursorPosition();
          }, 0);
          return;
        }
      }
    }

    // 6. Auto-Indentation on Enter
    if (e.key === "Enter") {
      const pos = textarea.selectionStart;
      const textBefore = value.substring(0, pos);
      const currentLine = textBefore.substring(textBefore.lastIndexOf("\n") + 1);
      const matchIndent = currentLine.match(/^\s*/);
      const indent = matchIndent ? matchIndent[0] : "";
      const trimmedLine = currentLine.trimEnd();
      const shouldIncrease = trimmedLine.endsWith("{") || trimmedLine.endsWith("(") || trimmedLine.endsWith("[") || trimmedLine.endsWith(":");
      const nextIndent = indent + (shouldIncrease ? "  " : "");

      e.preventDefault();
      const nextVal = value.substring(0, pos) + "\n" + nextIndent + value.substring(textarea.selectionEnd);
      onChange(nextVal);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = pos + 1 + nextIndent.length;
        updateCursorPosition();
      }, 0);
      return;
    }

    // 7. Overtyping closing bracket/quote
    const CLOSING_CHARS = [")", "]", "}", '"', "'", "`"];
    if (CLOSING_CHARS.includes(e.key)) {
      const pos = textarea.selectionStart;
      if (pos === textarea.selectionEnd && value[pos] === e.key) {
        e.preventDefault();
        textarea.selectionStart = textarea.selectionEnd = pos + 1;
        updateCursorPosition();
        return;
      }
    }

    // 8. Auto-close brackets and quotes
    const PAIRS: Record<string, string> = {
      "(": ")",
      "[": "]",
      "{": "}",
      '"': '"',
      "'": "'",
      "`": "`",
    };

    if (PAIRS[e.key]) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const closing = PAIRS[e.key];

      // Wrap selected text
      if (start !== end) {
        e.preventDefault();
        const selected = value.substring(start, end);
        const wrapped = e.key + selected + closing;
        const nextVal = value.substring(0, start) + wrapped + value.substring(end);
        onChange(nextVal);
        setTimeout(() => {
          textarea.selectionStart = start + 1;
          textarea.selectionEnd = end + 1;
        }, 0);
        return;
      }

      if (e.key === "'" && start > 0 && /[a-zA-Z0-9]/.test(value[start - 1])) {
        return;
      }

      e.preventDefault();
      const nextVal = value.substring(0, start) + e.key + closing + value.substring(end);
      onChange(nextVal);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
        updateCursorPosition();
      }, 0);
    }
  };

  return (
    <div
      className="relative flex flex-col flex-1 h-full w-full overflow-hidden select-text border-t sm:border-t-0 sm:border-r border-border/50"
      style={{
        backgroundColor: themeStyle.bg,
        color: themeStyle.text,
      }}
    >
      {/* 1. GitHub Copilot Inline Prompt Floating Palette (Ctrl + K) */}
      {showInlinePrompt && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl bg-card/95 border border-primary/40 shadow-2xl rounded-2xl backdrop-blur-xl p-3 space-y-2.5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#f0be65] via-[#e5a83b] to-[#d48c18] text-stone-950 flex items-center justify-center shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                Copilot Inline Edit
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground border border-border/60">
                  Ctrl+K
                </kbd>
              </span>
            </div>

            <button
              onClick={handleDiscardInlineEdit}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selection.text && (
            <div className="text-[10px] text-muted-foreground bg-muted/40 px-2 py-1 rounded-md truncate font-mono">
              Targeting selection: <span className="text-foreground">"{selection.text.slice(0, 50)}..."</span>
            </div>
          )}

          {/* Prompt Input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inlineInputRef}
                type="text"
                value={inlinePrompt}
                onChange={(e) => setInlinePrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (inlinePreview) handleAcceptInlineEdit();
                    else handleExecuteInlineEdit();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    handleDiscardInlineEdit();
                  }
                }}
                placeholder="Ask Copilot (e.g., 'Refactor to recursion', 'Add error handling', 'Add comments')..."
                className="w-full h-9 px-3 text-xs bg-background/90 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary font-sans"
              />
            </div>

            <Button
              size="sm"
              onClick={() => handleExecuteInlineEdit()}
              disabled={inlineLoading || !inlinePrompt.trim()}
              className="h-9 px-3.5 bg-primary text-primary-foreground font-bold text-xs gap-1.5 cursor-pointer shadow-md"
            >
              {inlineLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              <span>Generate</span>
            </Button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-muted-foreground font-medium">Quick:</span>
            {[
              { label: "⚡ Optimize", prompt: "Optimize time and space complexity" },
              { label: "🛡️ Add Safety", prompt: "Add null-checks and exception handling" },
              { label: "📝 Add Docstrings", prompt: "Add clean documentation and comments" },
              { label: "🔧 Fix Logic", prompt: "Fix any bugs or potential edge cases" },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  setInlinePrompt(chip.prompt);
                  handleExecuteInlineEdit(chip.prompt);
                }}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-muted/60 hover:bg-muted border border-border/50 text-foreground transition-colors cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Diff / Code Preview if generated */}
          {inlinePreview !== null && (
            <div className="pt-2 border-t border-border/50 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Preview Proposed Changes</span>
                </span>
                <span className="text-[10px] text-muted-foreground">{inlineDiffSummary}</span>
              </div>

              <pre className="max-h-48 overflow-y-auto p-2.5 rounded-xl bg-[#0d1117] border border-border/50 text-[11px] font-mono text-emerald-300 leading-relaxed whitespace-pre">
                {inlinePreview}
              </pre>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDiscardInlineEdit}
                  className="h-7 text-xs cursor-pointer"
                >
                  Discard (Esc)
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptInlineEdit}
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1 cursor-pointer shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept (Ctrl+Enter)</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Floating Selection Action Bar (Cursor style) */}
      {selection.text && !showInlinePrompt && (
        <div className="absolute top-2 right-4 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-background/95 border border-primary/40 shadow-xl backdrop-blur-md animate-in fade-in">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowInlinePrompt(true)}
            className="h-7 px-2.5 text-[11px] font-bold gap-1 text-primary hover:bg-primary/10 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
            <span>Copilot (Ctrl+K)</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onTriggerAICopilot?.("explain", selection.text)}
            className="h-7 px-2 text-[11px] font-semibold gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <BookOpen className="w-3 h-3 text-blue-400" />
            <span>Explain</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onTriggerAICopilot?.("optimize", selection.text)}
            className="h-7 px-2 text-[11px] font-semibold gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Optimize</span>
          </Button>
        </div>
      )}

      {/* 3. Ghost Text Floating Helper Tooltip (GitHub Copilot style) */}
      {ghostText && !showInlinePrompt && (
        <div className="absolute top-2 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/95 border border-primary/40 text-[10px] text-foreground font-mono shadow-xl backdrop-blur-md z-30 animate-in fade-in select-none">
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span className="font-bold text-primary">Copilot:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted/80 text-[9px] font-bold border border-border/70 text-foreground">
            Tab
          </kbd>
          <span>accept</span>
          <span className="text-muted-foreground">•</span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted/80 text-[9px] font-bold border border-border/70 text-foreground">
            Esc
          </kbd>
          <span className="text-muted-foreground">dismiss</span>
        </div>
      )}

      {/* Editor Body: Gutter + Textarea + Ghost Overlay */}
      <div className="relative flex flex-1 w-full overflow-hidden">
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="select-none py-3.5 pr-2.5 pl-3 text-right overflow-hidden shrink-0 border-r border-border/30 font-mono tracking-normal leading-relaxed"
          style={{
            backgroundColor: themeStyle.gutterBg,
            color: themeStyle.gutterText,
            fontSize: `${fontSize}px`,
            minWidth: "3.2rem",
          }}
        >
          {lines.map((_, idx) => {
            const lineNum = idx + 1;
            const isCurrentLine = cursorPos.line === lineNum;
            return (
              <div
                key={lineNum}
                className={`transition-colors leading-relaxed ${
                  isCurrentLine ? "text-primary font-bold" : ""
                }`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Textarea & Ghost Text Overlay Container */}
        <div className="relative flex-1 h-full w-full overflow-hidden">
          {/* Pixel-perfect Ghost Text Overlay (Underlay behind transparent textarea) */}
          {copilotEnabled && ghostText && (
            <div
              ref={overlayRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 p-3.5 font-mono leading-relaxed whitespace-pre overflow-hidden select-none z-0"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: "1.625",
                tabSize: 2,
              }}
            >
              <span className="opacity-0">{value.substring(0, ghostOffset)}</span>
              <span className="text-indigo-400 opacity-75 bg-indigo-500/10 px-0.5 rounded italic border-b border-indigo-500/40">
                {ghostText}
              </span>
            </div>
          )}

          {/* Real Editable Textarea */}
          <textarea
            ref={textareaRef}
            data-code-editor="true"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              updateCursorPosition();
            }}
            onKeyDown={handleKeyDown}
            onKeyUp={updateCursorPosition}
            onClick={updateCursorPosition}
            onScroll={handleScroll}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="code-editor-input relative z-10 w-full h-full p-3.5 bg-transparent resize-none outline-none font-mono leading-relaxed border-0 overflow-auto whitespace-pre tab-2 focus:ring-0 selection:bg-indigo-500/30 touch-manipulation"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: "1.625",
              tabSize: 2,
            }}
            aria-label="Code editor input"
          />
        </div>
      </div>

      {/* Editor Status Bottom Bar with Copilot Controls */}
      <div
        className="flex items-center justify-between px-3 py-1 text-[11px] border-t border-border/40 font-mono select-none"
        style={{
          backgroundColor: themeStyle.gutterBg,
          color: themeStyle.gutterText,
        }}
      >
        <div className="flex items-center gap-3">
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span>{lines.length} lines</span>
          <span>{value.length} chars</span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* GitHub Copilot Toggle */}
          <button
            type="button"
            onClick={() => {
              setCopilotEnabled(!copilotEnabled);
              toast.info(`Copilot Ghost Autocompletion ${!copilotEnabled ? "Enabled" : "Disabled"}`);
            }}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
              copilotEnabled
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-muted/40 border-border/40 text-muted-foreground"
            }`}
            title="Toggle inline ghost autocompletion (Tab to accept)"
          >
            <Sparkles className="w-3 h-3" />
            <span>Copilot: {copilotEnabled ? "ON" : "OFF"}</span>
          </button>

          {/* Ctrl+K Quick Trigger */}
          <button
            type="button"
            onClick={() => setShowInlinePrompt(true)}
            className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
            title="Inline AI Edit"
          >
            <kbd className="px-1 rounded bg-muted/60 border border-border/60">Ctrl+K</kbd>
            <span>Edit</span>
          </button>

          <span className="text-muted-foreground">•</span>
          <span className="uppercase tracking-wider font-semibold text-primary">{language}</span>
        </div>
      </div>
    </div>
  );
};
