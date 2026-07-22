import { Fragment, useMemo, useState } from "react";
import { Copy, Check, Play, Terminal, Trash2, Maximize2, Minimize2, Code2, Eye, Cpu } from "lucide-react";

/**
 * Renders text with formatting:
 * ```code``` → VS Code-style IDE Code Block with Line Numbers, Live HTML/React Sandbox, and JS/Python Runner
 * **bold** → <strong>
 * *italic* → <em>
 * URLs → <a>
 */

type TextNode =
  | { type: "codeBlock"; content: string; lang?: string }
  | { type: "text" | "bold" | "italic" | "link"; content: string };

function parseFormatted(text: string): TextNode[] {
  const nodes: TextNode[] = [];
  const codeBlockRegex = /```(?:([a-zA-Z0-9_-]+)\n)?([\s\S]*?)```/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      nodes.push(...parseInlineFormatted(text.slice(lastIdx, match.index)));
    }
    nodes.push({
      type: "codeBlock",
      lang: match[1] || "",
      content: match[2].trim(),
    });
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    nodes.push(...parseInlineFormatted(text.slice(lastIdx)));
  }

  return nodes;
}

function parseInlineFormatted(text: string): TextNode[] {
  const nodes: TextNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(https?:\/\/[^\s<]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      nodes.push({ type: "bold", content: match[2] });
    } else if (match[3]) {
      nodes.push({ type: "italic", content: match[4] });
    } else if (match[5]) {
      nodes.push({ type: "link", content: match[5] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", content: text.slice(lastIndex) });
  }

  return nodes;
}

interface FormattedTextProps {
  text: string;
}

interface ExecutionLog {
  type: "log" | "error" | "warn" | "info" | "result";
  text: string;
}

interface ExecutionResult {
  logs: ExecutionLog[];
  durationMs: number;
  isError: boolean;
}

// ── Smart JS Transpiler: converts TypeScript & ES6 module syntax to runnable vanilla JS ──
function transpileToRunnableJS(code: string): string {
  let js = code;

  // 1. Remove ES6 imports (e.g. import React from 'react';)
  js = js.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, "");
  js = js.replace(/import\s+['"].*?['"];?/g, "");

  // 2. Remove export statements
  js = js.replace(/export\s+default\s+/g, "");
  js = js.replace(/export\s+(const|let|var|function|class|type|interface)\s+/g, "$1 ");

  // 3. Remove TypeScript type declarations & interfaces
  js = js.replace(/interface\s+[a-zA-Z0-9_]+\s*\{[\s\S]*?\}/g, "");
  js = js.replace(/type\s+[a-zA-Z0-9_]+\s*=[\s\S]*?;/g, "");
  js = js.replace(/:\s*(string|number|boolean|any|void|object|unknown|never|React\.ReactNode)\[\]?/g, "");
  js = js.replace(/as\s+[a-zA-Z0-9_<>\[\]]+/g, "");

  return js.trim();
}

// ── Code Execution Engine ──
function executeCodeSnippet(code: string, lang: string = ""): ExecutionResult {
  const logs: ExecutionLog[] = [];
  const start = performance.now();
  let isError = false;
  const l = lang.toLowerCase();

  // JSON handling
  if (l === "json") {
    try {
      const parsed = JSON.parse(code);
      logs.push({ type: "result", text: JSON.stringify(parsed, null, 2) });
    } catch (err: any) {
      isError = true;
      logs.push({ type: "error", text: `Invalid JSON syntax: ${err.message}` });
    }
    return { logs, durationMs: Math.round(performance.now() - start), isError };
  }

  // Python execution environment simulation
  if (l === "python" || l === "py") {
    try {
      const cleanedPy = code
        .replace(/^import\s+.*$/gm, "# $&") // comment out import lines
        .replace(/def\s+([a-zA-Z0-9_]+)\((.*?)\):/g, "function $1($2) {")
        .replace(/print\((.*?)\)/g, "console.log($1)")
        .replace(/\bTrue\b/g, "true")
        .replace(/\bFalse\b/g, "false")
        .replace(/\bNone\b/g, "null")
        .replace(/len\((.*?)\)/g, "($1).length")
        .replace(/range\((.*?)\)/g, "Array.from({length: $1}, (_, i) => i)");

      const customConsole = {
        log: (...args: any[]) => logs.push({ type: "log", text: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ") }),
        error: (...args: any[]) => { isError = true; logs.push({ type: "error", text: args.map(String).join(" ") }); },
        warn: (...args: any[]) => logs.push({ type: "warn", text: args.map(String).join(" ") }),
        info: (...args: any[]) => logs.push({ type: "info", text: args.map(String).join(" ") }),
      };

      const runner = new Function("console", cleanedPy);
      const res = runner(customConsole);
      if (res !== undefined) {
        logs.push({ type: "result", text: `⇒ ${typeof res === "object" ? JSON.stringify(res, null, 2) : String(res)}` });
      }

      if (logs.length === 0) {
        logs.push({ type: "info", text: "Python script executed cleanly with 0 output." });
      }
    } catch (err: any) {
      isError = true;
      logs.push({ type: "error", text: `Python Error: ${err.message}` });
    }
    return { logs, durationMs: Math.round(performance.now() - start), isError };
  }

  // JS / TS / Web execution
  try {
    const cleanJs = transpileToRunnableJS(code);

    const customConsole = {
      log: (...args: any[]) => logs.push({ type: "log", text: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ") }),
      error: (...args: any[]) => { isError = true; logs.push({ type: "error", text: args.map(String).join(" ") }); },
      warn: (...args: any[]) => logs.push({ type: "warn", text: args.map(String).join(" ") }),
      info: (...args: any[]) => logs.push({ type: "info", text: args.map(String).join(" ") }),
    };

    const runner = new Function("console", `
      try {
        ${cleanJs}
      } catch(e) {
        console.error(e.message || String(e));
      }
    `);

    const result = runner(customConsole);
    if (result !== undefined) {
      logs.push({ type: "result", text: `⇒ ${typeof result === "object" ? JSON.stringify(result, null, 2) : String(result)}` });
    }

    if (logs.length === 0) {
      logs.push({ type: "info", text: "Code executed cleanly with no console output." });
    }
  } catch (err: any) {
    isError = true;
    logs.push({ type: "error", text: `Execution Error: ${err.message}` });
  }

  return { logs, durationMs: Math.round(performance.now() - start), isError };
}

// ── CodeBlock Component with VS Code styling, line numbers & live runner ──
const CodeBlock = ({ content, lang }: { content: string; lang?: string }) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [execution, setExecution] = useState<ExecutionResult | null>(null);

  const lines = useMemo(() => content.split("\n"), [content]);
  const displayLang = (lang || "code").toLowerCase();

  // Check if code contains HTML, SVG, React, or JSX elements
  const isWebCode = useMemo(() => {
    if (displayLang === "html" || displayLang === "svg" || displayLang === "xml" || displayLang === "jsx" || displayLang === "tsx") return true;
    const lower = content.toLowerCase();
    return lower.includes("<svg") || lower.includes("<!doctype html") || lower.includes("<div") || lower.includes("<html") || lower.includes("return <");
  }, [content, displayLang]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunCode = () => {
    if (isWebCode) {
      setShowPreview(!showPreview);
      return;
    }
    const res = executeCodeSnippet(content, lang);
    setExecution(res);
  };

  // Helper for language badge color
  const getLangColor = () => {
    if (["js", "javascript", "jsx"].includes(displayLang)) return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
    if (["ts", "typescript", "tsx"].includes(displayLang)) return "text-blue-400 border-blue-500/30 bg-blue-500/10";
    if (["py", "python"].includes(displayLang)) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (["html", "css", "svg"].includes(displayLang)) return "text-orange-400 border-orange-500/30 bg-orange-500/10";
    if (["json", "sql"].includes(displayLang)) return "text-purple-400 border-purple-500/30 bg-purple-500/10";
    return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  };

  return (
    <div className="my-3 rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 overflow-hidden font-mono text-xs shadow-xl backdrop-blur-xl">
      {/* ── IDE Header ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/90 border-b border-zinc-800/80 text-[11px] select-none">
        <div className="flex items-center gap-2">
          {/* Window dots */}
          <div className="flex items-center gap-1.5 mr-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>

          {/* Language Badge */}
          <span className={`px-2 py-0.5 rounded-md border font-bold uppercase text-[10px] tracking-wider ${getLangColor()}`}>
            {displayLang}
          </span>

          <span className="text-[10px] text-zinc-500 font-sans">{lines.length} lines</span>

          {/* Web Preview Toggle */}
          {isWebCode && (
            <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 ml-1">
              <button
                onClick={() => setShowPreview(false)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                  !showPreview ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                }`}
              >
                Code
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                  showPreview ? "bg-primary text-white shadow-sm" : "text-zinc-400 hover:text-white"
                }`}
              >
                👁️ Live Preview
              </button>
            </div>
          )}
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Run Code Button */}
          <button
            onClick={handleRunCode}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-sans text-[10px] font-extrabold transition-all active:scale-95 shadow-md shadow-emerald-500/20"
            title="Execute this code live in browser"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>{isWebCode ? (showPreview ? "View Code" : "Preview") : "Run Code"}</span>
          </button>

          {/* Copy Code */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-white transition-colors px-2 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 font-sans text-[10px] text-zinc-300 border border-zinc-700/60"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          {/* Expand Toggle */}
          {lines.length > 12 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:text-white text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors"
              title={isExpanded ? "Collapse code block" : "Expand code block"}
            >
              {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Web Preview Frame vs VS Code View with Line Numbers ── */}
      {showPreview ? (
        <div className="p-3 bg-white rounded-b-2xl min-h-[160px] flex items-center justify-center">
          <iframe
            srcDoc={
              content.includes("<html")
                ? content
                : `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;margin:16px;padding:0;color:#111;}</style></head><body>${content}</body></html>`
            }
            title="Live Code Preview"
            className="w-full min-h-[220px] border-0 rounded-xl"
            sandbox="allow-scripts"
          />
        </div>
      ) : (
        <div className={`overflow-x-auto relative flex ${!isExpanded && lines.length > 16 ? "max-h-[340px]" : ""}`}>
          {/* Line Numbers Column */}
          <div className="py-3 px-2 bg-zinc-900/40 border-r border-zinc-800/60 text-right select-none font-mono text-[11px] text-zinc-600 shrink-0 space-y-0.5 min-w-[36px]">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Code Body */}
          <pre className="p-3 leading-relaxed text-[11px] text-emerald-300/90 flex-1 whitespace-pre">
            <code>{content}</code>
          </pre>
        </div>
      )}

      {/* ── Dark Terminal Output Panel ── */}
      {execution && (
        <div className="border-t border-zinc-800 bg-zinc-950 p-3 space-y-2 text-[11px]">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5 text-[10px]">
            <div className="flex items-center gap-2 font-bold text-zinc-300">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              <span>Console Output ({execution.durationMs}ms)</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${execution.isError ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}`}>
                {execution.isError ? "Runtime Error" : "🟢 Execution Success"}
              </span>
            </div>
            <button
              onClick={() => setExecution(null)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 hover:bg-zinc-800 rounded-md"
              title="Close output panel"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Log Lines */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 font-mono">
            {execution.logs.map((log, idx) => (
              <div
                key={idx}
                className={`text-[11px] leading-relaxed whitespace-pre-wrap ${
                  log.type === "error"
                    ? "text-rose-400 font-semibold bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/20"
                    : log.type === "warn"
                    ? "text-amber-400"
                    : log.type === "result"
                    ? "text-cyan-300 font-bold bg-cyan-500/10 p-1.5 rounded-lg border border-cyan-500/20"
                    : log.type === "info"
                    ? "text-zinc-400 italic"
                    : "text-zinc-200"
                }`}
              >
                {log.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const FormattedText = ({ text }: FormattedTextProps) => {
  const nodes = useMemo(() => parseFormatted(text), [text]);

  return (
    <span className="break-words [overflow-wrap:anywhere] leading-relaxed whitespace-pre-wrap">
      {nodes.map((node, i) => (
        <Fragment key={i}>
          {node.type === "codeBlock" && <CodeBlock content={node.content} lang={node.lang} />}
          {node.type === "bold" && <strong className="font-bold">{node.content}</strong>}
          {node.type === "italic" && <em className="italic">{node.content}</em>}
          {node.type === "link" && (
            <a
              href={node.content}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 opacity-90 hover:opacity-100 transition-opacity"
            >
              {node.content}
            </a>
          )}
          {node.type === "text" && node.content}
        </Fragment>
      ))}
    </span>
  );
};

export default FormattedText;
