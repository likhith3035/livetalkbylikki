import { Fragment, useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";

/**
 * Renders text with formatting:
 * ```code``` → Stylized code block with copy button
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

const CodeBlock = ({ content, lang }: { content: string; lang?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-xl border border-zinc-700/60 bg-zinc-950 text-zinc-100 overflow-hidden font-mono text-xs shadow-md">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-400">
        <span className="font-bold uppercase tracking-wider">{lang || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors px-1.5 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto whitespace-pre leading-relaxed text-[11px] text-emerald-300/90">
        <code>{content}</code>
      </pre>
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

