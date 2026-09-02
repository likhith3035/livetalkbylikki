import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GameId, GameMode, GameCustomRules } from "../types";
import { GameMetadata } from "./GameCard";
import { QrCode, Bot, Users, Zap, ChevronRight, SlidersHorizontal, Clock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameMetadata | null;
  onSelectMode: (gameId: GameId, mode: GameMode, rules?: GameCustomRules) => void;
}

const MODES: {
  id: GameMode;
  title: string;
  desc: string;
  icon: any;
  iconColor: string;
  badge?: string;
  bgGradient: string;
  borderHover: string;
}[] = [
  {
    id: "friend",
    title: "Play with Friend (QR Code & Link)",
    desc: "Generate an instant QR code or 6-character room code to invite a friend anywhere.",
    icon: QrCode,
    iconColor: "text-emerald-400",
    badge: "Recommended",
    bgGradient: "from-emerald-500/10 to-teal-500/5",
    borderHover: "hover:border-emerald-500/50",
  },
  {
    id: "quickmatch",
    title: "Quick Match (Online Stranger)",
    desc: "1-tap matchmaking queue to instantly duel other active online players.",
    icon: Zap,
    iconColor: "text-amber-400",
    badge: "Live Queue",
    bgGradient: "from-amber-500/10 to-orange-500/5",
    borderHover: "hover:border-amber-500/50",
  },
  {
    id: "ai",
    title: "Play vs Smart AI Bot",
    desc: "Instant solo match with zero lag. Practice against novice or unbeatable Minimax engines.",
    icon: Bot,
    iconColor: "text-cyan-400",
    badge: "Offline Ready",
    bgGradient: "from-cyan-500/10 to-blue-500/5",
    borderHover: "hover:border-cyan-500/50",
  },
  {
    id: "local",
    title: "Pass & Play (Local 2-Player)",
    desc: "Two players taking turns on the same screen (phone, tablet, or desktop).",
    icon: Users,
    iconColor: "text-violet-400",
    bgGradient: "from-violet-500/10 to-purple-500/5",
    borderHover: "hover:border-violet-500/50",
  },
];

export const GameModeModal: React.FC<GameModeModalProps> = ({
  isOpen,
  onClose,
  game,
  onSelectMode,
}) => {
  const [showRules, setShowRules] = useState(false);
  const [turnTimer, setTurnTimer] = useState<number>(0); // 0 = unlimited, 10, 15, 30
  const [maxWins, setMaxWins] = useState<number>(2);     // 1 = single, 2 = Best of 3, 3 = Best of 5
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  if (!game) return null;

  const currentRules: GameCustomRules = {
    turnTimerSeconds: turnTimer,
    maxSeriesWins: maxWins,
    aiDifficulty,
  };

  const handleLaunchMode = (mode: GameMode) => {
    onSelectMode(game.id, mode, currentRules);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[92vw] sm:max-w-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/50 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar touch-manipulation">
        <DialogHeader className="text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-2xl">{game.icon}</span>
              <DialogTitle className="text-xl font-black text-foreground">
                {game.title}
              </DialogTitle>
            </div>

            <button
              onClick={() => setShowRules((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                showRules
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-border/40"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Rules</span>
            </button>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Select a mode to launch your duel.
          </DialogDescription>
        </DialogHeader>

        {/* Optional Custom Match Rules Panel */}
        <AnimatePresence>
          {showRules && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 my-2 flex flex-col gap-3 overflow-hidden text-xs"
            >
              {/* Turn Timer Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Turn Timer Limit:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { sec: 0, label: "No Limit" },
                    { sec: 10, label: "10s Fast" },
                    { sec: 15, label: "15s Normal" },
                    { sec: 30, label: "30s Chill" },
                  ].map((item) => (
                    <button
                      key={item.sec}
                      onClick={() => setTurnTimer(item.sec)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        turnTimer === item.sec
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/40"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Series Length Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-primary" />
                  Match Series Length:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { wins: 1, label: "Single Round" },
                    { wins: 2, label: "Best of 3 (2 Wins)" },
                    { wins: 3, label: "Best of 5 (3 Wins)" },
                  ].map((item) => (
                    <button
                      key={item.wins}
                      onClick={() => setMaxWins(item.wins)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        maxWins === item.wins
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/40"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Difficulty Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  AI Bot Skill Level:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "easy", label: "Novice 🟢", desc: "Casual" },
                    { id: "medium", label: "Challenger 🟡", desc: "Smart" },
                    { id: "hard", label: "Grandmaster 🔴", desc: "Minimax" },
                  ].map((diff) => (
                    <button
                      key={diff.id}
                      onClick={() => setAiDifficulty(diff.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        aiDifficulty === diff.id
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/40"
                      }`}
                    >
                      {diff.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modes List */}
        <div className="flex flex-col gap-2.5 my-2">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleLaunchMode(mode.id)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border border-border/50 bg-gradient-to-r ${mode.bgGradient} ${mode.borderHover} hover:shadow-md transition-all text-left group cursor-pointer`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl bg-card border border-border/40 flex items-center justify-center shrink-0 shadow-sm ${mode.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
                        {mode.title}
                      </span>
                      {mode.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/20 text-primary font-black uppercase tracking-wider">
                          {mode.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {mode.id === "ai" ? `Bot Level: ${aiDifficulty.toUpperCase()} • ${mode.desc}` : mode.desc}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </motion.button>
            );
          })}
        </div>

        <div className="mt-2 text-center">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground h-9"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
