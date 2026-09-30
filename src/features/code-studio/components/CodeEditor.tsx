import React, { useRef, useState, useEffect } from "react";
import { EditorTheme, SupportedLanguage } from "../types";

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  language: SupportedLanguage;
  theme: EditorTheme;
  fontSize: number;
  onRunShortcut?: () => void;
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
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const lines = value.split("\n");
  const themeStyle = THEME_STYLES[theme] || THEME_STYLES["midnight-cyber"];

  // Sync gutter vertical scroll with textarea scroll
  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = value.substring(0, pos);
    const lineNum = textBefore.split("\n").length;
    const lastNewline = textBefore.lastIndexOf("\n");
    const colNum = pos - lastNewline;
    setCursorPos({ line: lineNum, col: colNum });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Keyboard Shortcut: Ctrl + Enter (or Cmd + Enter) -> Run code
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onRunShortcut?.();
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    // 2. Intercept Tab key for 2-space indentation
    if (e.key === "Tab") {
      e.preventDefault();
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

    // 3. Auto-close brackets and quotes
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

      // If user selected text, wrap it with pair
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

      // If typing quotes or brackets inside standard code, auto insert closing pair
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
      {/* Editor Body: Gutter + Textarea */}
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

        {/* Textarea Input Container */}
        <div className="relative flex-1 h-full w-full overflow-hidden">
          <textarea
            ref={textareaRef}
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
            className="w-full h-full p-3.5 bg-transparent resize-none outline-none font-mono leading-relaxed border-0 overflow-auto whitespace-pre tab-2 focus:ring-0 selection:bg-indigo-500/30 touch-manipulation"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: "1.625",
              tabSize: 2,
            }}
            aria-label="Code editor input"
          />
        </div>
      </div>

      {/* Editor Status Bottom Bar */}
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

        <div className="flex items-center gap-2 uppercase tracking-wider font-semibold">
          <span>UTF-8</span>
          <span>•</span>
          <span className="text-primary">{language}</span>
        </div>
      </div>
    </div>
  );
};
