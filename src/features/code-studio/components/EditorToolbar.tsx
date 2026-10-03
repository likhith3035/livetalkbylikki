import React, { useState } from "react";
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Download,
  Key,
  Sparkles,
  Settings2,
  Trash2,
  FileCode,
  Zap,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SupportedLanguage, EditorTheme } from "../types";
import { CODE_TEMPLATES, STARTER_TEMPLATES } from "../data/codeTemplates";
import { toast } from "sonner";

interface EditorToolbarProps {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onRunCode: () => void;
  isRunning: boolean;
  onFormatCode: () => void;
  onClearCode: () => void;
  onSelectTemplate: (code: string) => void;
  code: string;
  theme: EditorTheme;
  onThemeChange: (theme: EditorTheme) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  hasActiveKey: boolean;
  isOpenModelActive: boolean;
  onOpenKeyModal: () => void;
}

const LANGUAGE_LABELS: Record<SupportedLanguage, { label: string; ext: string; icon: string; compiler: string }> = {
  javascript: { label: "JavaScript (ES6+)", ext: "js", icon: "🟨", compiler: "V8 (Browser)" },
  typescript: { label: "TypeScript", ext: "ts", icon: "🔷", compiler: "TS Transpiler" },
  python: { label: "Python 3.12", ext: "py", icon: "🐍", compiler: "CPython 3.12" },
  html: { label: "HTML5 / CSS / JS", ext: "html", icon: "🌐", compiler: "DOM Live Sandbox" },
  css: { label: "CSS3", ext: "css", icon: "🎨", compiler: "CSS Sandbox" },
  sql: { label: "SQL (SQLite 3)", ext: "sql", icon: "🗄️", compiler: "SQLite 3.46" },
  json: { label: "JSON", ext: "json", icon: "📋", compiler: "JSON Validator" },
  cpp: { label: "C++ (GCC 14.2)", ext: "cpp", icon: "⚡", compiler: "GCC 14.2 (C++20)" },
  java: { label: "Java 21 LTS", ext: "java", icon: "☕", compiler: "OpenJDK 21" },
};

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  language,
  onLanguageChange,
  onRunCode,
  isRunning,
  onFormatCode,
  onClearCode,
  onSelectTemplate,
  code,
  theme,
  onThemeChange,
  fontSize,
  onFontSizeChange,
  hasActiveKey,
  isOpenModelActive,
  onOpenKeyModal,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = LANGUAGE_LABELS[language]?.ext || "txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solution.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded solution.${ext}`);
  };

  return (
    <div className="flex items-center justify-between gap-1.5 p-1.5 sm:px-3 sm:py-2 border-b border-border/50 bg-card/80 backdrop-blur-xl overflow-x-auto no-scrollbar">
      {/* Left controls: Language & Template Selectors */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Language selector */}
        <Select
          value={language}
          onValueChange={(val) => onLanguageChange(val as SupportedLanguage)}
        >
          <SelectTrigger className="w-[110px] xs:w-[130px] sm:w-[170px] h-8 sm:h-9 bg-background/80 border-border/60 text-xs font-bold shadow-sm shrink-0">
            <SelectValue>
              <span className="flex items-center gap-1.5 truncate">
                <span>{LANGUAGE_LABELS[language]?.icon}</span>
                <span className="truncate">{LANGUAGE_LABELS[language]?.label}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            {Object.entries(LANGUAGE_LABELS).map(([langKey, meta]) => (
              <SelectItem key={langKey} value={langKey} className="text-xs cursor-pointer">
                <span className="flex items-center gap-2">
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Templates dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 sm:h-9 px-2 sm:px-3 text-xs gap-1.5 bg-background/80 border-border/60 cursor-pointer font-medium shrink-0"
            >
              <FileCode className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Templates</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-popover border-border z-50">
            <DropdownMenuLabel className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Starter Templates
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onSelectTemplate(STARTER_TEMPLATES[language])}
              className="text-xs cursor-pointer"
            >
              Default {LANGUAGE_LABELS[language]?.label} Starter
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Curated Snippets
            </DropdownMenuLabel>
            {CODE_TEMPLATES.map((tpl) => (
              <DropdownMenuItem
                key={tpl.id}
                onClick={() => {
                  onLanguageChange(tpl.language);
                  onSelectTemplate(tpl.code);
                }}
                className="text-xs cursor-pointer flex flex-col items-start gap-0.5"
              >
                <span className="font-semibold text-foreground">{tpl.title}</span>
                <span className="text-[10px] text-muted-foreground">{tpl.category}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* API Key / Assistant Status Badge Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenKeyModal}
          className={`h-8 sm:h-9 px-2 sm:px-2.5 text-xs gap-1.5 border cursor-pointer font-semibold shrink-0 transition-colors ${
            hasActiveKey
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
          }`}
          title={hasActiveKey ? "Cloud LLM Active (Groq / Gemini / OpenAI)" : "Offline AI Engine Active. Click to add API Key"}
        >
          <span className={`w-2 h-2 rounded-full ${hasActiveKey ? "bg-emerald-400 animate-pulse" : "bg-cyan-400"}`} />
          <Key className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">
            {hasActiveKey ? "Cloud AI Ready" : "Offline AI Engine"}
          </span>
        </Button>

        {/* Active Engine / Compiler Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/40 border border-border/50 text-[11px] font-mono text-muted-foreground shrink-0 select-none">
          <Zap className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="font-semibold text-foreground/90">{LANGUAGE_LABELS[language]?.compiler}</span>
        </div>
      </div>

      {/* Right controls: Editor actions & Run Button */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Editor appearance settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-muted text-muted-foreground cursor-pointer shrink-0"
              title="Editor Settings"
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover border-border z-50">
            <DropdownMenuLabel className="text-xs font-bold">Theme</DropdownMenuLabel>
            {(["midnight-cyber", "monokai", "github-dark", "one-dark", "clean-light"] as EditorTheme[]).map((t) => (
              <DropdownMenuItem
                key={t}
                onClick={() => onThemeChange(t)}
                className={`text-xs cursor-pointer capitalize ${theme === t ? "text-primary font-bold" : ""}`}
              >
                {t.replace("-", " ")}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-bold">Font Size</DropdownMenuLabel>
            {[12, 14, 16, 18].map((size) => (
              <DropdownMenuItem
                key={size}
                onClick={() => onFontSizeChange(size)}
                className={`text-xs cursor-pointer ${fontSize === size ? "text-primary font-bold" : ""}`}
              >
                {size}px
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Desktop Individual Action Buttons (Visible on wide panels) */}
        <div className="hidden xl:flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onFormatCode}
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            title="Format Code"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            title="Copy Code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            title="Download Code File"
          >
            <Download className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCode}
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-muted text-muted-foreground hover:text-red-400 cursor-pointer shrink-0"
            title="Clear Code"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Compact Combined More Actions Menu (< xl) */}
        <div className="flex xl:hidden items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted text-muted-foreground cursor-pointer shrink-0"
                title="More Actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-popover border-border z-50">
              <DropdownMenuItem onClick={onFormatCode} className="text-xs cursor-pointer gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Format Code</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopy} className="text-xs cursor-pointer gap-2">
                <Copy className="w-3.5 h-3.5 text-blue-400" />
                <span>Copy Code</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload} className="text-xs cursor-pointer gap-2">
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onClearCode} className="text-xs cursor-pointer gap-2 text-red-400 focus:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Editor</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Primary Run Code Button */}
        <Button
          onClick={onRunCode}
          disabled={isRunning}
          size="sm"
          className="h-8 sm:h-9 px-2.5 sm:px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-black text-xs shadow-lg shadow-emerald-500/25 gap-1.5 rounded-lg transition-all active:scale-95 cursor-pointer shrink-0"
        >
          {isRunning ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{isRunning ? "Running..." : "Run"}</span>
          <span className="hidden lg:inline text-[9px] opacity-75 font-normal ml-0.5">(Ctrl+↵)</span>
        </Button>
      </div>
    </div>
  );
};
