import { Fragment, useMemo, useState } from "react";
import { Copy, Check, Play, Square, Terminal, Trash2 } from "lucide-react";

/**
 * Renders text with formatting:
 * ```code``` → Stylized code block with Copy, Live Preview, and ▶️ Run Code buttons
 * **bold** → <strong>
 * *italic* → <em>
 * URLs → <a>
 */

type TextNode =
  | { type: "codeBlock"; content: string; lang?: string }
  | { type: "text" | "bold" | "italic" | "link"; content: string };

function parseFormatted(text: string): TextNode[] {
  const nodes: TextNode[] = [];
  
  // First, parse code blocks ```code```
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

function executeCodeSnippet(code: string, lang: string = ""): ExecutionResult {
  const logs: ExecutionLog[] = [];
  const start = performance.now();
  let isError = false;
  const l = lang.toLowerCase();

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

  // Handle Python micro-evaluator
  if (l === "python" || l === "py") {
    try {
      const jsCode = code
        .replace(/def\s+([a-zA-Z0-9_]+)\((.*?)\):/g, "function $1($2) {")
        .replace(/print\((.*?)\)/g, "console.log($1)")
        .replace(/\bTrue\b/g, "true")
        .replace(/\bFalse\b/g, "false")
        .replace(/\bNone\b/g, "null")
        .replace(/len\((.*?)\)/g, "$1.length");

      const customConsole = {
        log: (...args: any[]) => logs.push({ type: "log", text: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ") }),
        error: (...args: any[]) => { isError = true; logs.push({ type: "error", text: args.map(String).join(" ") }); },
        warn: (...args: any[]) => logs.push({ type: "warn", text: args.map(String).join(" ") }),
        info: (...args: any[]) => logs.push({ type: "info", text: args.map(String).join(" ") }),
      };

      const runner = new Function("console", jsCode);
      runner(customConsole);

      if (logs.length === 0) {
        logs.push({ type: "info", text: "Python script executed cleanly." });
      }
    } catch (err: any) {
      isError = true;
      logs.push({ type: "error", text: `Python Error: ${err.message}` });
    }
    return { logs, durationMs: Math.round(performance.now() - start), isError };
  }

  // JavaScript / TypeScript Execution Sandbox
  try {
    const customConsole = {
      log: (...args: any[]) => logs.push({ type: "log", text: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ") }),
      error: (...args: any[]) => { isError = true; logs.push({ type: "error", text: args.map(String).join(" ") }); },
      warn: (...args: any[]) => logs.push({ type: "warn", text: args.map(String).join(" ") }),
      info: (...args: any[]) => logs.push({ type: "info", text: args.map(String).join(" ") }),
    };

    // Strip basic TypeScript annotations
    const executableJs = code.replace(/:\s*(string|number|boolean|any|void|object|unknown|never)\[\]?/g, "");

    const runner = new Function("console", `
      try {
        ${executableJs}
      } catch(e) {
        console.error(e.message || String(e));
      }
    `);

    const result = runner(customConsole);
    if (result !== undefined) {
      logs.push({ type: "result", text: `⇒ ${typeof result === "object" ? JSON.stringify(result, null, 2) : String(result)}` });
    }

    if (logs.length === 0) {
      logs.push({ type: "info", text: "Code executed successfully with no console output." });
    }
  } catch (err: any) {
    isError = true;
    logs.push({ type: "error", text: `Runtime Error: ${err.message}` });
  }

  return { logs, durationMs: Math.round(performance.now() - start), isError };
}

const CodeBlock = ({ content, lang }: { content: string; lang?: string }) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [execution, setExecution] = useState<ExecutionResult | null>(null);

  const isPreviewable = useMemo(() => {
    const l = (lang || "").toLowerCase();
    if (l === "html" || l === "svg" || l === "xml") return true;
    const lower = content.toLowerCase();
    return lower.includes("<svg") || lower.includes("<!doctype html") || lower.includes("<div") || lower.includes("<html");
  }, [content, lang]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunCode = () => {
    if (isPreviewable) {
      setShowPreview(!showPreview);
      return;
    }

    const res = executeCodeSnippet(content, lang);
    setExecution(res);
  };

  return (
    <div className="my-2 rounded-xl border border-zinc-700/60 bg-zinc-950 text-zinc-100 overflow-hidden font-mono text-xs shadow-md">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-emerald-400">{lang || "code"}</span>
          {isPreviewable && (
            <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
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

        <div className="flex items-center gap-1.5">
          {/* Run Code Button */}
          <button
            onClick={handleRunCode}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-sans text-[10px] font-bold transition-all active:scale-95 shadow-sm"
            title="Execute this code snippet live"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Run Code</span>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-white transition-colors px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 font-sans text-[10px]"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Code vs Live HTML/SVG Preview */}
      {showPreview ? (
        <div className="p-3 bg-white rounded-b-xl min-h-[120px] flex items-center justify-center">
          <iframe
            srcDoc={content.includes("<html") ? content : `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;margin:12px;padding:0;}</style></head><body>${content}</body></html>`}
            title="Live Preview"
            className="w-full min-h-[180px] border-0 rounded"
            sandbox="allow-scripts"
          />
        </div>
      ) : (
        <pre className="p-3 overflow-x-auto whitespace-pre leading-relaxed text-[11px] text-emerald-300/90">
          <code>{content}</code>
        </pre>
      )}

      {/* Terminal Console Output Panel */}
      {execution && (
        <div className="border-t border-zinc-800 bg-black p-3 space-y-2 text-[11px]">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-1 text-[10px]">
            <div className="flex items-center gap-1.5 font-bold text-zinc-400">
              <Terminal className="h-3.5 w-3.5 text-primary" />
              <span>Console Output ({execution.durationMs}ms)</span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] ${execution.isError ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                {execution.isError ? "Error" : "Success"}
              </span>
            </div>
            <button
              onClick={() => setExecution(null)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5"
              title="Close terminal output"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {execution.logs.map((log, idx) => (
              <div
                key={idx}
                className={`font-mono text-[11px] leading-relaxed whitespace-pre-wrap ${
                  log.type === "error"
                    ? "text-rose-400 font-semibold"
                    : log.type === "warn"
                    ? "text-amber-400"
                    : log.type === "result"
                    ? "text-cyan-300 font-bold"
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
