import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import {
  Code2,
  Terminal,
  Trophy,
  Sparkles,
  ArrowLeft,
  Columns,
  Eye,
  Settings,
  HelpCircle,
  Play,
  RotateCcw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { CodeEditor } from "./CodeEditor";
import { EditorToolbar } from "./EditorToolbar";
import { ConsoleOutput } from "./ConsoleOutput";
import { LiveHtmlPreview } from "./LiveHtmlPreview";
import { ChallengeSidebar } from "./ChallengeSidebar";
import { AICopilotPanel } from "./AICopilotPanel";
import { CodeStudioKeyModal } from "./CodeStudioKeyModal";
import { TestResultsModal } from "./TestResultsModal";

import {
  CodingChallenge,
  EditorTheme,
  ExecutionLog,
  ExecutionResult,
  SupportedLanguage,
} from "../types";
import { STARTER_TEMPLATES } from "../data/codeTemplates";
import { CODING_CHALLENGES } from "../data/codingChallenges";
import { executeCode, runChallengeTests } from "../services/codeExecutionService";
import { getAutoDetectedAPIKeys, hasActiveAPIKey } from "../services/apiKeyDetectionService";
import { isOpenModelsEnabled } from "../services/openModelService";
import { toast } from "sonner";

const STORAGE_KEY_CODE = "code_studio_current_code";
const STORAGE_KEY_LANG = "code_studio_current_lang";
const STORAGE_KEY_SOLVED = "code_studio_solved_challenges";
const STORAGE_KEY_THEME = "code_studio_theme";
const STORAGE_KEY_FONT_SIZE = "code_studio_font_size";

export default function CodeStudioPage() {
  const navigate = useNavigate();

  // 1. Editor Core State
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem(STORAGE_KEY_LANG) as SupportedLanguage) || "javascript";
  });

  const [code, setCode] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_CODE) || STARTER_TEMPLATES.javascript;
  });

  const [theme, setTheme] = useState<EditorTheme>(() => {
    return (localStorage.getItem(STORAGE_KEY_THEME) as EditorTheme) || "midnight-cyber";
  });

  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FONT_SIZE);
    return saved ? Number(saved) : 14;
  });

  // 2. Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [stdin, setStdin] = useState<string>("");
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | undefined>(undefined);

  // 3. Challenge State
  const [activeChallenge, setActiveChallenge] = useState<CodingChallenge | null>(null);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SOLVED);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [testResult, setTestResult] = useState<ExecutionResult | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // 4. Layout & Modals State
  const [mobileTab, setMobileTab] = useState<"editor" | "terminal" | "challenges" | "ai">("editor");
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // 5. API Keys & Open Models reactive state
  const [hasKey, setHasKey] = useState(false);
  const [openModelActive, setOpenModelActive] = useState(true);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CODE, code);
  }, [code]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LANG, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FONT_SIZE, String(fontSize));
  }, [fontSize]);

  const refreshKeyStatus = useCallback(() => {
    setHasKey(hasActiveAPIKey());
    setOpenModelActive(isOpenModelsEnabled());
  }, []);

  useEffect(() => {
    refreshKeyStatus();
    window.addEventListener("code_studio_keys_updated", refreshKeyStatus);
    window.addEventListener("code_studio_open_model_toggled", refreshKeyStatus);
    return () => {
      window.removeEventListener("code_studio_keys_updated", refreshKeyStatus);
      window.removeEventListener("code_studio_open_model_toggled", refreshKeyStatus);
    };
  }, [refreshKeyStatus]);

  // Handle intelligent Language change with per-language draft preservation
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    // 1. Save current code as draft for the active language
    try {
      localStorage.setItem(`code_studio_draft_${language}`, code);
    } catch {}

    setLanguage(newLang);

    // 2. Load draft for newly selected language or fallback to default starter
    const savedDraft = localStorage.getItem(`code_studio_draft_${newLang}`);
    if (savedDraft && savedDraft.trim()) {
      setCode(savedDraft);
    } else {
      setCode(STARTER_TEMPLATES[newLang]);
    }

    setLogs([]);
    setCurrentError(null);
    toast.info(`Switched to ${newLang.toUpperCase()}`);
  };

  // Execute Code in Sandbox
  const handleRunCode = async () => {
    setIsRunning(true);
    setCurrentError(null);
    try {
      const result = await executeCode(code, language, stdin);
      setLogs(result.logs);
      setCurrentError(result.error);
      setExecutionTimeMs(result.executionTimeMs);

      // On mobile, auto-switch to terminal tab to show result
      if (window.innerWidth < 1024) {
        setMobileTab("terminal");
      }
    } catch (err: any) {
      setCurrentError(err?.message || "Execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  // Run Challenge Tests
  const handleRunChallengeTests = async () => {
    if (!activeChallenge) return;
    setIsRunningTests(true);
    setCurrentError(null);
    try {
      const result = await runChallengeTests(code, activeChallenge);
      setTestResult(result);
      setIsTestModalOpen(true);
      setLogs(result.logs);
      setExecutionTimeMs(result.executionTimeMs);

      if (result.success) {
        const nextSolved = new Set(solvedIds);
        nextSolved.add(activeChallenge.id);
        setSolvedIds(nextSolved);
        localStorage.setItem(STORAGE_KEY_SOLVED, JSON.stringify(Array.from(nextSolved)));
        toast.success(`🎉 You solved "${activeChallenge.title}"!`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed running challenge tests");
    } finally {
      setIsRunningTests(false);
    }
  };

  // Challenge Selection
  const handleSelectChallenge = (ch: CodingChallenge) => {
    setActiveChallenge(ch);
    if (ch) {
      setLanguage(ch.language);
      setCode(ch.starterCode);
      setLogs([]);
      setCurrentError(null);
      setShowLeftSidebar(true);
      toast.info(`Loaded problem: ${ch.title}`);
      if (window.innerWidth < 1024) {
        setMobileTab("editor");
      }
    }
  };

  // Next Challenge Navigator
  const handleNextChallenge = () => {
    if (!activeChallenge) return;
    const currentIndex = CODING_CHALLENGES.findIndex((c) => c.id === activeChallenge.id);
    if (currentIndex >= 0 && currentIndex < CODING_CHALLENGES.length - 1) {
      handleSelectChallenge(CODING_CHALLENGES[currentIndex + 1]);
    } else {
      toast.success("🏆 You have completed all practice challenges!");
    }
  };

  // Format Code Beautifier
  const handleFormatCode = () => {
    try {
      const lines = code.split("\n");
      const cleaned: string[] = [];
      let consecutiveBlank = 0;

      for (const line of lines) {
        const trimmed = line.trimEnd();
        if (!trimmed) {
          consecutiveBlank++;
          if (consecutiveBlank <= 1) cleaned.push("");
        } else {
          consecutiveBlank = 0;
          cleaned.push(trimmed);
        }
      }

      setCode(cleaned.join("\n"));
      toast.success("Code formatted cleanly");
    } catch {
      toast.error("Could not auto-format code");
    }
  };

  const handleClearCode = () => {
    if (window.confirm("Are you sure you want to clear the editor?")) {
      setCode("");
      setLogs([]);
      setCurrentError(null);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-background overflow-hidden font-sans">
      {/* 1. Global Studio Header Bar */}
      <header className="h-12 sm:h-14 px-3 sm:px-4 border-b border-border/50 bg-card/90 backdrop-blur-xl flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <Link to="/" className="flex items-center gap-2 shrink-0">
            <BrandLogo size="sm" />
          </Link>

          <div className="h-4 w-px bg-border/60 hidden sm:block shrink-0" />

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-black text-sm text-foreground truncate hidden xs:inline">
              Code Studio
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 shrink-0">
              ⚡ AI Practice Arena
            </span>
          </div>
        </div>

        {/* Header Center / Right Layout controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Desktop panel toggle buttons */}
          <div className="hidden lg:flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border/60">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLeftSidebar((v) => !v)}
              className={`h-7 px-2.5 text-xs gap-1.5 cursor-pointer transition-all duration-200 ${
                showLeftSidebar
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              title="Toggle Challenges Explorer"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Problems</span>
              {showLeftSidebar && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRightSidebar((v) => !v)}
              className={`h-7 px-2.5 text-xs gap-1.5 cursor-pointer transition-all duration-200 ${
                showRightSidebar
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              title="Toggle AI Copilot"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>AI Copilot</span>
              {showRightSidebar && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse ml-0.5" />}
            </Button>
          </div>

          {/* Quick API Key / Open Model trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsKeyModalOpen(true)}
            className="h-8 px-2 sm:px-3 text-xs gap-1.5 font-bold cursor-pointer border-border/60 bg-background/80"
          >
            <span className={`w-2 h-2 rounded-full ${openModelActive || hasKey ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <span className="hidden sm:inline">AI Settings</span>
          </Button>

          {/* Mobile Tab Switcher */}
          <div className="flex lg:hidden items-center bg-muted/60 p-0.5 rounded-lg border border-border/60 text-xs">
            <button
              onClick={() => setMobileTab("editor")}
              className={`p-1.5 rounded-md ${mobileTab === "editor" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"}`}
              title="Editor"
            >
              <Code2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMobileTab("terminal")}
              className={`p-1.5 rounded-md ${mobileTab === "terminal" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"}`}
              title="Console"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMobileTab("challenges")}
              className={`p-1.5 rounded-md ${mobileTab === "challenges" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"}`}
              title="Problems"
            >
              <Trophy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMobileTab("ai")}
              className={`p-1.5 rounded-md ${mobileTab === "ai" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"}`}
              title="AI Copilot"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Studio Body */}
      {/* DESKTOP VIEW: Split Resizable Panels */}
      <div className="hidden lg:flex flex-1 min-h-0 w-full overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Panel: Challenges & Problems Explorer */}
          {showLeftSidebar && (
            <>
              <Panel defaultSize={22} minSize={16} maxSize={35}>
                <ChallengeSidebar
                  activeChallenge={activeChallenge}
                  onSelectChallenge={handleSelectChallenge}
                  solvedChallengeIds={solvedIds}
                  onRunTests={handleRunChallengeTests}
                  isRunningTests={isRunningTests}
                  onResetStarter={() => activeChallenge && setCode(activeChallenge.starterCode)}
                  onLoadSolution={(sol) => setCode(sol)}
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-border/40 hover:bg-primary transition-colors cursor-col-resize" />
            </>
          )}

          {/* Center Main Panel: Editor + Console / Preview */}
          <Panel minSize={35}>
            <PanelGroup direction="vertical">
              {/* Top: Editor Toolbar + Code Editor */}
              <Panel defaultSize={65} minSize={30}>
                <div className="flex flex-col h-full w-full overflow-hidden">
                  <EditorToolbar
                    language={language}
                    onLanguageChange={handleLanguageChange}
                    onRunCode={handleRunCode}
                    isRunning={isRunning}
                    onFormatCode={handleFormatCode}
                    onClearCode={handleClearCode}
                    onSelectTemplate={(newCode) => setCode(newCode)}
                    code={code}
                    theme={theme}
                    onThemeChange={setTheme}
                    fontSize={fontSize}
                    onFontSizeChange={setFontSize}
                    hasActiveKey={hasKey}
                    isOpenModelActive={openModelActive}
                    onOpenKeyModal={() => setIsKeyModalOpen(true)}
                  />

                  <div className="flex-1 min-h-0 w-full">
                    <CodeEditor
                      value={code}
                      onChange={setCode}
                      language={language}
                      theme={theme}
                      fontSize={fontSize}
                      onRunShortcut={handleRunCode}
                      onTriggerAICopilot={() => {
                        setShowRightSidebar(true);
                      }}
                    />
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="h-1 bg-border/40 hover:bg-primary transition-colors cursor-row-resize" />

              {/* Bottom: Console or HTML Live Preview */}
              <Panel defaultSize={35} minSize={20}>
                {language === "html" ? (
                  <LiveHtmlPreview htmlContent={code} />
                ) : (
                  <ConsoleOutput
                    logs={logs}
                    error={currentError}
                    executionTimeMs={executionTimeMs}
                    language={language}
                    stdin={stdin}
                    onStdinChange={setStdin}
                    onClear={() => {
                      setLogs([]);
                      setCurrentError(null);
                    }}
                    isRunning={isRunning}
                  />
                )}
              </Panel>
            </PanelGroup>
          </Panel>

          {/* Right Panel: AI Copilot & Bug Solver */}
          {showRightSidebar && (
            <>
              <PanelResizeHandle className="w-1 bg-border/40 hover:bg-primary transition-colors cursor-col-resize" />
              <Panel defaultSize={26} minSize={20} maxSize={40}>
                <AICopilotPanel
                  code={code}
                  language={language}
                  currentError={currentError}
                  activeChallenge={activeChallenge}
                  onApplyCode={(newCode) => setCode(newCode)}
                  onOpenKeyModal={() => setIsKeyModalOpen(true)}
                  hasActiveKey={hasKey}
                  isOpenModelActive={openModelActive}
                />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* MOBILE / TABLET VIEW: Touch-Optimized Tabs */}
      <div className="flex lg:hidden flex-1 min-h-0 w-full overflow-hidden flex-col">
        {mobileTab === "editor" && (
          <div className="flex flex-col h-full w-full overflow-hidden">
            <EditorToolbar
              language={language}
              onLanguageChange={handleLanguageChange}
              onRunCode={handleRunCode}
              isRunning={isRunning}
              onFormatCode={handleFormatCode}
              onClearCode={handleClearCode}
              onSelectTemplate={(newCode) => setCode(newCode)}
              code={code}
              theme={theme}
              onThemeChange={setTheme}
              fontSize={fontSize}
              onFontSizeChange={setFontSize}
              hasActiveKey={hasKey}
              isOpenModelActive={openModelActive}
              onOpenKeyModal={() => setIsKeyModalOpen(true)}
            />

            <div className="flex-1 min-h-0 w-full">
              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
                theme={theme}
                fontSize={fontSize}
                onRunShortcut={handleRunCode}
                onTriggerAICopilot={() => {
                  setMobileTab("ai");
                }}
              />
            </div>
          </div>
        )}

        {mobileTab === "terminal" && (
          <div className="h-full w-full p-2">
            {language === "html" ? (
              <LiveHtmlPreview htmlContent={code} />
            ) : (
              <ConsoleOutput
                logs={logs}
                error={currentError}
                executionTimeMs={executionTimeMs}
                language={language}
                stdin={stdin}
                onStdinChange={setStdin}
                onClear={() => {
                  setLogs([]);
                  setCurrentError(null);
                }}
                isRunning={isRunning}
              />
            )}
          </div>
        )}

        {mobileTab === "challenges" && (
          <div className="h-full w-full">
            <ChallengeSidebar
              activeChallenge={activeChallenge}
              onSelectChallenge={handleSelectChallenge}
              solvedChallengeIds={solvedIds}
              onRunTests={handleRunChallengeTests}
              isRunningTests={isRunningTests}
              onResetStarter={() => activeChallenge && setCode(activeChallenge.starterCode)}
              onLoadSolution={(sol) => setCode(sol)}
            />
          </div>
        )}

        {mobileTab === "ai" && (
          <div className="h-full w-full">
            <AICopilotPanel
              code={code}
              language={language}
              currentError={currentError}
              activeChallenge={activeChallenge}
              onApplyCode={(newCode) => {
                setCode(newCode);
                setMobileTab("editor");
              }}
              onOpenKeyModal={() => setIsKeyModalOpen(true)}
              hasActiveKey={hasKey}
              isOpenModelActive={openModelActive}
            />
          </div>
        )}

        {/* Mobile Sticky Bottom Bar */}
        <div className="p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-border/50 bg-card/90 flex items-center gap-2 shrink-0">
          <Button
            onClick={activeChallenge ? handleRunChallengeTests : handleRunCode}
            disabled={isRunning || isRunningTests}
            className="flex-1 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{activeChallenge ? "Run Challenge Tests" : "Run Code"}</span>
          </Button>

          {mobileTab === "editor" ? (
            <Button
              onClick={() => setMobileTab("ai")}
              className="flex-1 h-10 bg-gradient-to-r from-[#f0be65] via-[#e5a83b] to-[#d48c18] hover:brightness-110 text-stone-950 font-bold text-xs gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Copilot</span>
            </Button>
          ) : (
            <Button
              onClick={() => setMobileTab("editor")}
              className="flex-1 h-10 bg-muted text-foreground border border-border/60 hover:bg-muted/80 font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-primary" />
              <span>Back to Editor</span>
            </Button>
          )}
        </div>
      </div>

      {/* 3. Global Modals */}
      <CodeStudioKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeysChanged={refreshKeyStatus}
      />

      <TestResultsModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        result={testResult}
        challenge={activeChallenge}
        onNextChallenge={handleNextChallenge}
      />
    </div>
  );
}
