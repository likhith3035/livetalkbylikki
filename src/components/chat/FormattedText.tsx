import { Fragment, useMemo } from "react";

/**
 * Renders text with basic formatting:
 * **bold** → <strong>
 * *italic* → <em>
 * URLs → <a>
 */

type TextNode = { type: "text" | "bold" | "italic" | "link"; content: string };

function parseFormatted(text: string): TextNode[] {
  const nodes: TextNode[] = [];
  // Combined regex: **bold**, *italic*, URLs
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

const FormattedText = ({ text }: FormattedTextProps) => {
  const nodes = useMemo(() => parseFormatted(text), [text]);

  return (
    <span className="break-words leading-relaxed">
      {nodes.map((node, i) => (
        <Fragment key={i}>
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
