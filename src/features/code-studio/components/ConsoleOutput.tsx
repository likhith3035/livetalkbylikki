import React, { useState, useRef, useEffect } from "react";
import {
  Terminal,
  Trash2,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExecutionLog, SupportedLanguage } from "../types";
import { toast } from "sonner";

interface ConsoleOutputProps {
  logs: ExecutionLog[];
  error: string | null;
  executionTimeMs?: number;
  onClear: () => void;
  isRunning?: boolean;
  language?: SupportedLanguage;
  stdin?: string;
  onStdinChange?: (val: string) => void;
}

export const ConsoleOutput: React.FC<ConsoleOutputProps> = ({
  logs,
  error,
  executionTimeMs,
  onClear,
  isRunning = false,
  language,
  stdin = "",
  onStdinChange,
}) => {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<"all" | "errors" | "logs">("all");
  const [showStdin, setShowStdin] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const supportsStdin = language === "cpp" || language === "python" || language === "java";

  // Auto-scroll when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, error]);

  // When error occurs, ensure filter is "all" so error tracebacks are visible
  useEffect(() => {
    if (error) {
      setFilter("all");
    }
  }, [error]);

  // Auto-expand stdin drawer if script failed due to EOFError (missing input)
  useEffect(() => {
    if (error && (error.toLowerCase().includes("eoferror") || error.toLowerCase().includes("input()"))) {
      setShowStdin(true);
    }
  }, [error]);

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.type.toUpperCase()}] ${l.message}`).join("\n");
    navigator.clipboard.writeText(text || error || "No output");
    setCopied(true);
    toast.success("Console output copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((l) => {
    if (filter === "errors") return l.type === "error";
    if (filter === "logs") return l.type === "log" || l.type === "info";
    return true;
  });

  return (
    <div className="flex flex-col h-full w-full bg-[#0d1117] border border-border/60 rounded-xl overflow-hidden shadow-inner font-mono text-xs">
      {/* Top Console Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-[#161b22] select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-foreground tracking-wide">Terminal Console</span>

          {isRunning ? (
            <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Compiling...
            </span>
          ) : error ? (
            <span className="flex items-center gap-1 text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30">
              <XCircle className="w-3 h-3" />
              Failed
            </span>
          ) : logs.length > 0 ? (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              Exit 0
            </span>
          ) : null}

          {executionTimeMs !== undefined && executionTimeMs > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" />
              {executionTimeMs} ms
            </span>
          )}
        </div>

        {/* Right action tools */}
        <div className="flex items-center gap-1">
          {/* Stdin Toggle for interactive programs */}
          {supportsStdin && onStdinChange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStdin((prev) => !prev)}
              className={`h-6 px-1.5 text-[10px] gap-1 cursor-pointer transition-colors ${
                showStdin || stdin.trim().length > 0
                  ? "bg-primary/20 text-primary border border-primary/40 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Configure interactive program input (stdin)"
            >
              <Sliders className="w-3 h-3" />
              <span>stdin</span>
              {showStdin ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            </Button>
          )}

          {/* Filters */}
          <div className="flex items-center bg-[#0d1117] p-0.5 rounded-md border border-border/40 text-[10px] mr-1.5">
            <button
              onClick={() => setFilter("all")}
              className={`px-1.5 py-0.5 rounded ${filter === "all" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("logs")}
              className={`px-1.5 py-0.5 rounded ${filter === "logs" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"}`}
            >
              Logs
            </button>
            <button
              onClick={() => setFilter("errors")}
              className={`px-1.5 py-0.5 rounded ${filter === "errors" ? "bg-red-500 text-white font-bold" : "text-muted-foreground"}`}
            >
              Errors
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLogs}
            disabled={logs.length === 0 && !error}
            className="h-6 w-6 p-0 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Copy logs"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 w-6 p-0 hover:bg-muted text-muted-foreground hover:text-red-400 cursor-pointer"
            title="Clear console"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Interactive Stdin Drawer */}
      {showStdin && supportsStdin && onStdinChange && (
        <div className="p-2 bg-[#12161f] border-b border-border/40 transition-all">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Standard Input (stdin)
            </span>
            <span className="text-[10px] text-muted-foreground">Passed to cin / input() / Scanner</span>
          </div>
          <textarea
            value={stdin}
            onChange={(e) => onStdinChange(e.target.value)}
            placeholder="Type input data here (e.g. numbers, words, test lines)..."
            rows={2}
            className="w-full bg-[#0d1117] border border-border/60 rounded p-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/80 font-mono resize-none"
          />
          <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-border/30">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">Quick test input:</span>
              <button
                type="button"
                onClick={() => onStdinChange("17\n")}
                className="text-[10px] px-2 py-0.5 rounded bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-colors font-mono cursor-pointer"
              >
                17
              </button>
              <button
                type="button"
                onClick={() => onStdinChange("24\n")}
                className="text-[10px] px-2 py-0.5 rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40 transition-colors font-mono cursor-pointer"
              >
                24
              </button>
              <button
                type="button"
                onClick={() => onStdinChange("100\n")}
                className="text-[10px] px-2 py-0.5 rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40 transition-colors font-mono cursor-pointer"
              >
                100
              </button>
            </div>
            {stdin.trim() && (
              <button
                type="button"
                onClick={() => onStdinChange("")}
                className="text-[10px] text-muted-foreground hover:text-red-400 cursor-pointer"
              >
                Clear stdin
              </button>
            )}
          </div>
        </div>
      )}

      {/* Console output body */}
      <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto space-y-1.5 leading-relaxed selection:bg-cyan-500/30">
        {filteredLogs.length === 0 && !error ? (
          <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-muted-foreground/60 text-center gap-2 select-none">
            <Terminal className="w-8 h-8 opacity-30 stroke-[1.5]" />
            <p className="text-xs">No output yet. Click <span className="text-primary font-bold">"Run Code"</span> or press <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border/50 text-[10px]">Ctrl+Enter</kbd></p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`flex items-start gap-2 py-0.5 rounded transition-colors ${
                log.type === "error"
                  ? "text-red-400 bg-red-500/10 px-2 border-l-2 border-red-500"
                  : log.type === "warn"
                  ? "text-amber-300 bg-amber-500/10 px-2 border-l-2 border-amber-500"
                  : log.type === "success"
                  ? "text-emerald-400 bg-emerald-500/10 px-2 border-l-2 border-emerald-500"
                  : log.type === "info"
                  ? "text-cyan-300"
                  : "text-zinc-200"
              }`}
            >
              <span className="select-none opacity-50 shrink-0 text-[10px] mt-0.5">
                {log.type === "error" ? (
                  <XCircle className="w-3 h-3 text-red-400" />
                ) : log.type === "warn" ? (
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                ) : log.type === "success" ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : log.type === "info" ? (
                  <Info className="w-3 h-3 text-cyan-400" />
                ) : (
                  "›"
                )}
              </span>
              <pre className="flex-1 whitespace-pre-wrap break-all font-mono text-[11px] sm:text-xs">
                {log.message}
              </pre>
            </div>
          ))
        )}

        {/* Global error if present */}
        {error && !filteredLogs.some((l) => l.message === error) && (
          <div className="text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/30 flex items-start gap-2">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <pre className="whitespace-pre-wrap break-all text-xs font-mono">{error}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
