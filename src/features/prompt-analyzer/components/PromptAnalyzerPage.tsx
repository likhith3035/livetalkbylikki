import React, { useState } from "react";
import { usePromptAnalyzer } from "../hooks/usePromptAnalyzer";
import { PromptEditor } from "./PromptEditor";
import { OverallScoreCard } from "./OverallScoreCard";
import { CategoryScoresBreakdown } from "./CategoryScoresBreakdown";
import { IssueCardsList } from "./IssueCardsList";
import { ContextAnalysisSection } from "./ContextAnalysisSection";
import { AmbiguityRedundancySection } from "./AmbiguityRedundancySection";
import { ImprovedPromptCard } from "./ImprovedPromptCard";
import { BeforeAfterDiffView } from "./BeforeAfterDiffView";
import { WhyBetterSection } from "./WhyBetterSection";
import { PromptStructureChecklist } from "./PromptStructureChecklist";
import { LearningTipsSection } from "./LearningTipsSection";
import { PromptComparisonModal } from "./PromptComparisonModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Wand2, History, Trash2, ArrowLeft, Sparkles, SplitSquareVertical, Search, TrendingUp, Cpu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useSEO } from "@/hooks/use-seo";
import Header from "@/components/Header";

export const PromptAnalyzerPage: React.FC = () => {
  const navigate = useNavigate();
  const onlineCount = useOnlineCount();

  useSEO({
    title: "AI Prompt Quality Analyzer – Score & Optimize AI Prompts | IncogTalk",
    description: "Analyze, score, and optimize your AI prompts instantly. Get detailed clarity scores, ambiguity detection, before-after diffs, and improved prompts on IncogTalk.",
    keywords: "incogtalk prompt analyzer, incogtalkk ai, ai prompt optimizer, prompt engineering tool, improve ai prompts, prompt quality score, incogtalk",
    breadcrumbTitle: "AI Prompt Analyzer",
    schema: {
      "@type": "WebApplication",
      "name": "IncogTalk AI Prompt Quality Analyzer",
      "url": "https://incogtalkk.netlify.app/prompt-analyzer",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All modern browsers",
      "description": "Analyze, score, and optimize AI prompts with real-time feedback on clarity, ambiguity, constraint enforcement, and before-after diff previews.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": [
        "Multi-dimensional prompt scoring (Clarity, Specificity, Context, Structure)",
        "Ambiguity & redundancy detection",
        "Automated one-click prompt enhancement",
        "Visual side-by-side diff comparison",
        "Local history storage with zero cloud telemetry"
      ]
    }
  });

  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  const {
    promptInput,
    setPromptInput,
    wordCount,
    charCount,
    isAnalyzing,
    result,
    selectedLevel,
    setSelectedLevel,
    history,
    handleAnalyze,
    handleClear,
    loadExample,
    clearHistory,
    loadHistoryItem,
  } = usePromptAnalyzer();

  const filteredHistory = history.filter((item) =>
    item.originalPrompt.toLowerCase().includes(historySearch.toLowerCase()) ||
    item.categoryLabel.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20 lg:pb-10">
      {/* Header */}
      <Header onlineCount={onlineCount} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Navigation / Back Bar */}
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>

          <Badge variant="outline" className="gap-1.5 text-xs font-semibold py-1 px-3 border-primary/30 text-primary bg-primary/5">
            <Sparkles className="h-3.5 w-3.5" /> AI Quality Engine
          </Badge>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary/10 via-purple-500/5 to-card border border-primary/20 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold mb-1">
              <Wand2 className="h-3.5 w-3.5" /> IncogTalk Add-on Feature
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold text-foreground tracking-tight">
              AI Prompt Quality Analyzer
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Detect mistakes, missing context, ambiguity, and contradictions. Transform your prompt into a high-performing directive and master prompt engineering.
            </p>
          </div>

          <div className="hidden md:flex h-24 w-24 rounded-2xl bg-primary/15 border border-primary/30 items-center justify-center text-primary text-4xl shadow-inner shrink-0">
            🪄
          </div>
        </div>

        {/* Prompt Editor */}
        <PromptEditor
          promptInput={promptInput}
          setPromptInput={setPromptInput}
          wordCount={wordCount}
          charCount={charCount}
          isAnalyzing={isAnalyzing}
          onAnalyze={handleAnalyze}
          onClear={handleClear}
          onLoadExample={loadExample}
        />

        {/* Analysis Results View */}
        {result && (
          <div className="space-y-6 pt-2 animate-fade-in">
            {/* Overall Score */}
            <OverallScoreCard result={result} />

            {/* Improved Prompt Card */}
            <ImprovedPromptCard
              improvedPrompts={result.improvedPrompts}
              selectedLevel={selectedLevel}
              setSelectedLevel={setSelectedLevel}
              onUseImproved={(text) => setPromptInput(text)}
            />

            {/* Action Bar for Compare Modal */}
            <div className="flex items-center justify-between gap-3 bg-secondary/30 border border-border/50 p-3 rounded-xl">
              <span className="text-xs text-muted-foreground font-medium">
                Want to review detailed differences side-by-side?
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCompareModalOpen(true)}
                className="text-xs gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
              >
                <SplitSquareVertical className="h-3.5 w-3.5" /> Compare Side-by-Side
              </Button>
            </div>

            {/* Before vs After Diff */}
            <BeforeAfterDiffView
              originalPrompt={result.originalPrompt}
              improvedPrompt={result.improvedPrompts[selectedLevel]}
            />

            {/* Why Is This Better? */}
            <WhyBetterSection changes={result.changes} />

            {/* Category Breakdown */}
            <CategoryScoresBreakdown scores={result.scores} />

            {/* Issue Cards */}
            <IssueCardsList issues={result.issues} />

            {/* Context & Clarifying Questions */}
            <ContextAnalysisSection
              missingContext={result.missingContext}
              suggestedQuestions={result.suggestedQuestions}
            />

            {/* Ambiguity, Contradiction & Redundancy */}
            <AmbiguityRedundancySection
              ambiguities={result.ambiguities}
              contradictions={result.contradictions}
              redundancies={result.redundancies}
            />

            {/* Structure Checklist */}
            <PromptStructureChecklist checklist={result.structureChecklist} />

            {/* Learning Tips */}
            <LearningTipsSection tips={result.learningTips} />

            {/* Compare Modal */}
            <PromptComparisonModal
              isOpen={isCompareModalOpen}
              onClose={() => setIsCompareModalOpen(false)}
              result={result}
              selectedLevel={selectedLevel}
              onUseImproved={(text) => setPromptInput(text)}
            />
          </div>
        )}

        {/* Prompt History Section */}
        {history.length > 0 && (
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-secondary text-foreground flex items-center justify-center font-bold">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-foreground flex items-center gap-2">
                    Prompt Analysis History
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {history.length} items
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Recent prompts evaluated during your session.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search history..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="h-8 pl-8 text-xs rounded-xl"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="text-xs text-muted-foreground hover:text-destructive gap-1.5 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredHistory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => loadHistoryItem(item)}
                  className="text-left p-3.5 rounded-xl bg-secondary/40 border border-border/50 hover:border-primary/50 transition-all space-y-2 group active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                        {item.categoryLabel}
                      </Badge>
                      {item.engineSource && (
                        <span className="text-[9px] font-mono text-muted-foreground truncate max-w-[100px]">
                          {item.engineSource}
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-bold text-foreground font-mono flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      {item.overallScore}/100
                    </span>
                  </div>

                  <p className="text-xs text-foreground font-medium line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    "{item.originalPrompt}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PromptAnalyzerPage;

