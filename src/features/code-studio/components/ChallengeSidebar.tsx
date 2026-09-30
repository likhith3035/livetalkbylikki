import React, { useState } from "react";
import {
  Trophy,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Lightbulb,
  Search,
  Filter,
  Code2,
  Sparkles,
  Play,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChallengeCategory,
  ChallengeDifficulty,
  CodingChallenge,
} from "../types";
import { CODING_CHALLENGES } from "../data/codingChallenges";

interface ChallengeSidebarProps {
  activeChallenge: CodingChallenge | null;
  onSelectChallenge: (challenge: CodingChallenge) => void;
  solvedChallengeIds: Set<string>;
  onRunTests: () => void;
  isRunningTests: boolean;
  onResetStarter: () => void;
}

export const ChallengeSidebar: React.FC<ChallengeSidebarProps> = ({
  activeChallenge,
  onSelectChallenge,
  solvedChallengeIds,
  onRunTests,
  isRunningTests,
  onResetStarter,
}) => {
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<ChallengeCategory>("all");
  const [revealedHintIndex, setRevealedHintIndex] = useState<number>(-1);

  const filteredChallenges = CODING_CHALLENGES.filter((ch) => {
    if (search && !ch.title.toLowerCase().includes(search.toLowerCase()) && !ch.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))) {
      return false;
    }
    if (selectedDifficulty !== "all" && ch.difficulty !== selectedDifficulty) {
      return false;
    }
    if (selectedCategory !== "all" && ch.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const getDifficultyBadge = (difficulty: ChallengeDifficulty) => {
    switch (difficulty) {
      case "beginner":
        return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">Easy</Badge>;
      case "intermediate":
        return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] font-bold">Medium</Badge>;
      case "advanced":
        return <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px] font-bold">Hard</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-card/60 backdrop-blur-xl border-r border-border/50 overflow-hidden text-xs">
      {/* Top Header */}
      <div className="p-3 border-b border-border/50 bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 font-black text-foreground text-sm">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Practice & Learn Arena</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            {solvedChallengeIds.size}/{CODING_CHALLENGES.length} Solved
          </span>
        </div>

        {/* Search Input */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems or tags..."
            className="h-8 pl-8 text-xs bg-background/80 border-border/60 rounded-lg"
          />
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          {(["all", "arrays", "strings", "algorithms", "javascript"] as ChallengeCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded-full border transition-all capitalize shrink-0 font-medium ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                  : "bg-background/60 text-muted-foreground border-border/50 hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Challenge Content */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-3">
        {activeChallenge ? (
          /* Active Challenge Detail View */
          <div className="flex flex-col gap-3">
            {/* Header info */}
            <div className="flex items-start justify-between gap-2 bg-muted/40 p-2.5 rounded-xl border border-border/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-foreground">{activeChallenge.title}</h3>
                  {solvedChallengeIds.has(activeChallenge.id) && (
                    <span className="text-emerald-400 flex items-center gap-0.5 text-[10px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Solved
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {getDifficultyBadge(activeChallenge.difficulty)}
                  <span className="text-[10px] text-muted-foreground">
                    Target: {activeChallenge.timeComplexity || "O(n)"}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectChallenge(null as any)}
                className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                All Problems
              </Button>
            </div>

            {/* Problem Description */}
            <div className="p-3 rounded-xl bg-background/80 border border-border/50 space-y-2 text-foreground/90 leading-relaxed text-[11px] sm:text-xs">
              <pre className="whitespace-pre-wrap font-sans break-words">{activeChallenge.description}</pre>
            </div>

            {/* Test Cases Count & Run Tests Button */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-primary/10 to-indigo-500/10 border border-primary/25 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Code2 className="w-4 h-4 text-primary" />
                <span>{activeChallenge.testCases.length} Test Cases Ready</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResetStarter}
                  className="h-7 text-[11px] px-2 gap-1 cursor-pointer hover:bg-muted"
                  title="Reset code to problem starter"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </Button>

                <Button
                  size="sm"
                  onClick={onRunTests}
                  disabled={isRunningTests}
                  className="h-7 text-[11px] px-3 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white font-bold gap-1 shadow-md shadow-primary/20 cursor-pointer"
                >
                  {isRunningTests ? (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play className="w-3 h-3 fill-current" />
                  )}
                  <span>Run Tests</span>
                </Button>
              </div>
            </div>

            {/* Hints Accordion */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-muted-foreground text-[11px]">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Hints & Guidance</span>
              </div>
              {activeChallenge.hints.map((hint, idx) => (
                <div key={idx} className="rounded-lg bg-muted/40 border border-border/50 p-2 text-[11px]">
                  {revealedHintIndex >= idx ? (
                    <p className="text-foreground/90">{hint}</p>
                  ) : (
                    <button
                      onClick={() => setRevealedHintIndex(idx)}
                      className="text-primary hover:underline font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <span>💡 Reveal Hint #{idx + 1}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Challenge List View */
          <div className="space-y-1.5">
            {filteredChallenges.map((ch) => {
              const isSolved = solvedChallengeIds.has(ch.id);
              return (
                <div
                  key={ch.id}
                  onClick={() => onSelectChallenge(ch)}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-background/60 hover:bg-muted/60 hover:border-primary/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isSolved ? "bg-emerald-400" : "bg-muted-foreground/40"}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground truncate">{ch.title}</span>
                        {isSolved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {getDifficultyBadge(ch.difficulty)}
                        <span className="text-[10px] text-muted-foreground capitalize">{ch.category}</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
