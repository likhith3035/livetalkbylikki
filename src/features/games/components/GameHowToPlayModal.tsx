import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameId } from "../types";
import { ALL_GAME_RULES, GameRuleGuide } from "../data/gameRulesData";
import { gameAudio } from "../services/gameSoundService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Trophy,
  Lightbulb,
  Sparkles,
  Gamepad2,
  Clock,
  Volume2,
  Play,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface GameHowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGameId?: GameId;
  onSelectGameToPlay?: (gameId: GameId) => void;
}

export const GameHowToPlayModal: React.FC<GameHowToPlayModalProps> = ({
  isOpen,
  onClose,
  initialGameId = "cricket",
  onSelectGameToPlay,
}) => {
  const [selectedGameId, setSelectedGameId] = useState<GameId>(initialGameId);
  const [activeTab, setActiveTab] = useState<"steps" | "tips" | "diagram">("steps");

  useEffect(() => {
    if (initialGameId && ALL_GAME_RULES[initialGameId]) {
      setSelectedGameId(initialGameId);
    }
  }, [initialGameId, isOpen]);

  const rule = ALL_GAME_RULES[selectedGameId] || ALL_GAME_RULES.cricket;

  const handlePlayGame = () => {
    gameAudio.playClick();
    onClose();
    onSelectGameToPlay?.(selectedGameId);
  };

  const handlePreviewAudio = () => {
    if (selectedGameId === "cricket") {
      gameAudio.playBoundarySix();
    } else if (selectedGameId === "bingo") {
      gameAudio.playBingoWinFanfare();
    } else {
      gameAudio.playWin();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl p-4 sm:p-6 rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/60 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden select-none">
        {/* Modal Header */}
        <DialogHeader className="text-left pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 border border-primary/25 text-primary text-sm flex items-center gap-1.5 font-bold">
                <BookOpen className="w-4 h-4" />
                <span>Arcade Academy</span>
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline-block">
                Master all 8 games & rules
              </span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              {rule.avgDuration}
            </span>
          </div>
        </DialogHeader>

        {/* ── Game Switcher Carousel Bar ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 shrink-0 -mx-1 px-1">
          {Object.values(ALL_GAME_RULES).map((g) => {
            const isSelected = g.gameId === selectedGameId;
            return (
              <button
                key={g.gameId}
                type="button"
                onClick={() => {
                  gameAudio.playClick();
                  setSelectedGameId(g.gameId);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25 scale-105"
                    : "bg-muted/40 hover:bg-muted/80 border-border/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{g.icon}</span>
                <span className="truncate max-w-[100px] sm:max-w-none">{g.title.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* ── Main Game Rules Showcase Area (Scrollable) ── */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-0.5 space-y-4 pt-2">
          {/* Hero Game Card */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 relative overflow-hidden">
            <div
              className={`absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br ${rule.gradient} opacity-25 blur-xl pointer-events-none`}
            />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-card border border-border/80 flex items-center justify-center text-3xl shadow-sm">
                  {rule.icon}
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">{rule.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{rule.tagline}</p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                  {rule.category}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {rule.difficulty} • {rule.avgDuration}
                </span>
              </div>
            </div>

            {/* Quick Summary Pill */}
            <div className="mt-3 pt-2.5 border-t border-border/40 text-xs font-medium text-foreground/90 leading-relaxed">
              <strong className="text-primary font-bold">Goal: </strong>
              {rule.objective}
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-muted/50 border border-border/50">
            <button
              type="button"
              onClick={() => setActiveTab("steps")}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "steps"
                  ? "bg-card text-foreground shadow-sm font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🕹️ How to Play
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tips")}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "tips"
                  ? "bg-card text-foreground shadow-sm font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              💡 Pro Tips
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("diagram")}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "diagram"
                  ? "bg-card text-foreground shadow-sm font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📊 Diagram & Win
            </button>
          </div>

          {/* Tab 1: Step-by-Step Visual Cards */}
          {activeTab === "steps" && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2.5"
            >
              {rule.steps.map((s) => (
                <div
                  key={s.stepNumber}
                  className="p-3.5 rounded-2xl bg-card/60 border border-border/50 hover:border-primary/40 transition-all flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-lg shrink-0 mt-0.5 shadow-inner">
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-mono">
                          {s.stepNumber}
                        </span>
                        <span>{s.title}</span>
                      </h4>
                      {s.badge && (
                        <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                          {s.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Tab 2: Pro Tips & Mind Games */}
          {activeTab === "tips" && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2.5"
            >
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 shrink-0" />
                <span>Secret Strategies Used by Top Ranked LiveTalk Duelists</span>
              </div>

              {rule.proTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-card/60 border border-border/50 flex items-start gap-2.5"
                >
                  <span className="text-amber-400 text-sm mt-0.5">⚡</span>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                    {tip}
                  </p>
                </div>
              ))}
            </motion.div>
          )}

          {/* Tab 3: Board Diagram & Win Condition */}
          {activeTab === "diagram" && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* ASCII / Visual Layout Box */}
              {rule.asciiDiagram && (
                <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-border/80 font-mono text-xs text-emerald-400 overflow-x-auto shadow-inner">
                  <span className="text-[10px] text-muted-foreground font-sans uppercase font-bold tracking-wider block mb-1">
                    Visual Gameplay Diagram:
                  </span>
                  <pre className="text-[11px] sm:text-xs leading-relaxed whitespace-pre font-mono">
                    {rule.asciiDiagram.trim()}
                  </pre>
                </div>
              )}

              {/* Win Condition Box */}
              <div className="p-3.5 rounded-2xl bg-card/60 border border-primary/30 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black text-foreground mb-0.5">Victory Condition</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {rule.winCondition}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Modal Footer Action Bar ── */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePreviewAudio}
            className="rounded-xl text-xs gap-1.5 h-10 border-border/60 hover:bg-muted/80"
          >
            <Volume2 className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Hear Fanfare</span>
          </Button>

          <Button
            type="button"
            onClick={handlePlayGame}
            className="rounded-xl bg-primary text-primary-foreground font-black text-xs sm:text-sm gap-2 h-10 px-5 shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex-1 sm:flex-initial"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play {rule.title} Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
