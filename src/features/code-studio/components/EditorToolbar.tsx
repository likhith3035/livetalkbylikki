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

const LANGUAGE_LABELS: Record<SupportedLanguage, { label: string; ext: string; icon: string }> = {
  javascript: { label: "JavaScript (ES6+)", ext: "js", icon: "🟨" },
  typescript: { label: "TypeScript", ext: "ts", icon: "🔷" },
  python: { label: "Python 3", ext: "py", icon: "🐍" },
  html: { label: "HTML5 / CSS / JS", ext: "html", icon: "🌐" },
  css: { label: "CSS3", ext: "css", icon: "🎨" },
  sql: { label: "SQL (Postgres)", ext: "sql", icon: "🗄️" },
  json: { label: "JSON", ext: "json", icon: "📋" },
  cpp: { label: "C++ (Competitive)", ext: "cpp", icon: "⚡" },
  java: { label: "Java 21", ext: "java", icon: "☕" },
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
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 sm:px-3 sm:py-2 border-b border-border/50 bg-card/80 backdrop-blur-xl">
      {/* Left controls: Language & Template Selectors */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Language selector */}
        <Select
          value={language}
          onValueChange={(val) => onLanguageChange(val as SupportedLanguage)}
        >
          <SelectTrigger className="w-[140px] sm:w-[170px] h-8 sm:h-9 bg-background/80 border-border/60 text-xs font-bold shadow-sm">
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
              className="h-8 sm:h-9 text-xs gap-1.5 bg-background/80 border-border/60 cursor-pointer font-medium"
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

        {/* API Key / Open Model Status Badge Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenKeyModal}
          className={`h-8 sm:h-9 px-2 sm:px-2.5 text-xs gap-1.5 border cursor-pointer font-semibold ${
            hasActiveKey || isOpenModelActive
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
          }`}
          title="Configure API Keys & Open Models"
        >
          <span className={`w-2 h-2 rounded-full ${hasActiveKey || isOpenModelActive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
          <Key className="w-3.5 h-3.5" />
          <span className="hidden md:inline">
            {isOpenModelActive ? "Open Model Active" : hasActiveKey ? "AI Key Ready" : "Setup AI Key"}
          </span>
        </Button>
      </div>

      {/* Right controls: Editor actions & Run Button */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Editor appearance settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-muted text-muted-foreground cursor-pointer"
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

        <Button
          variant="ghost"
          size="sm"
          onClick={onFormatCode}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
          title="Format Code"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
          title="Copy Code"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
          title="Download Code File"
        >
          <Download className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearCode}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-muted text-muted-foreground hover:text-red-400 cursor-pointer"
          title="Clear Code"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        {/* Primary Run Code Button */}
        <Button
          onClick={onRunCode}
          disabled={isRunning}
          size="sm"
          className="h-8 sm:h-9 px-3 sm:px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-black text-xs shadow-lg shadow-emerald-500/25 gap-1.5 rounded-lg transition-all active:scale-95 cursor-pointer"
        >
          {isRunning ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{isRunning ? "Running..." : "Run Code"}</span>
          <span className="hidden lg:inline text-[9px] opacity-75 font-normal ml-0.5">(Ctrl+↵)</span>
        </Button>
      </div>
    </div>
  );
};
