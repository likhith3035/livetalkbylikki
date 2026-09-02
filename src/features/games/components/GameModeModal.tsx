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
    desc: "Instant solo match with zero lag. Practice against heuristic & Minimax engines.",
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

  if (!game) return null;

  const currentRules: GameCustomRules = {
    turnTimerSeconds: turnTimer,
    maxSeriesWins: maxWins,
  };

  const handleLaunchMode = (mode: GameMode) => {
    onSelectMode(game.id, mode, currentRules);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/50 shadow-2xl max-h-[90vh] overflow-y-auto">
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
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
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
                    { label: "No Limit", val: 0 },
                    { label: "10s Blitz", val: 10 },
                    { label: "15s Fast", val: 15 },
                    { label: "30s Standard", val: 30 },
                  ].map((t) => (
                    <button
                      key={t.val}
                      onClick={() => setTurnTimer(t.val)}
                      className={`p-1.5 rounded-xl font-semibold border transition-all text-center ${
                        turnTimer === t.val
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-card hover:bg-muted border-border/40 text-muted-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Series Format Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-violet-500" />
                  Match Series Length:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: "1 Round", val: 1 },
                    { label: "Best of 3", val: 2 },
                    { label: "Best of 5", val: 3 },
                  ].map((s) => (
                    <button
                      key={s.val}
                      onClick={() => setMaxWins(s.val)}
                      className={`p-1.5 rounded-xl font-semibold border transition-all text-center ${
                        maxWins === s.val
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-card hover:bg-muted border-border/40 text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode Selector Cards */}
        <div className="flex flex-col gap-2.5 my-2">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleLaunchMode(mode.id)}
                className={`flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r ${mode.bgGradient} border border-border/40 ${mode.borderHover} transition-all text-left group cursor-pointer`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-card/80 border border-border/40 flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className={`w-5 h-5 ${mode.iconColor}`} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {mode.title}
                      </span>
                      {mode.badge && (
                        <span className="text-[9px] px-2 py-0.2 rounded-full bg-primary/15 text-primary font-bold">
                          {mode.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      {mode.desc}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
              </motion.button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
