import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, Bot, X, Users } from "lucide-react";
import { GameMetadata } from "./GameCard";

interface QuickMatchSearchingOverlayProps {
  game: GameMetadata | null;
  onCancel: () => void;
  onSwitchToAI: () => void;
}

export const QuickMatchSearchingOverlay: React.FC<QuickMatchSearchingOverlayProps> = ({
  game,
  onCancel,
  onSwitchToAI,
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-card/80 backdrop-blur-2xl border border-border/40 shadow-2xl max-w-md w-full mx-auto text-center select-none my-6">
      {/* Radar Animation */}
      <div className="relative w-28 h-28 flex items-center justify-center mb-6">
        <motion.div
          animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
          className="absolute inset-0 rounded-full bg-amber-500/20 border border-amber-500/40"
        />
        <motion.div
          animate={{ scale: [1, 1.6], opacity: [0.8, 0] }}
          transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeOut" }}
          className="absolute inset-0 rounded-full bg-amber-500/30"
        />
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20 relative z-10">
          {game?.icon || "🎮"}
        </div>
      </div>

      <h2 className="text-xl font-black text-foreground">
        Searching for Opponent...
      </h2>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
        Looking for another active player to duel in {game?.title || "Arcade"}.
      </p>

      {/* Timer Pill */}
      <div className="mt-4 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span>Queue Time: {seconds}s</span>
      </div>

      {/* Quick Fallback Buttons */}
      <div className="flex flex-col gap-2 w-full mt-6">
        <Button
          onClick={onSwitchToAI}
          className="w-full h-11 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-bold text-xs gap-2"
        >
          <Bot className="w-4 h-4 text-cyan-400" />
          Play vs AI Bot Instantly
        </Button>

        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full h-10 rounded-xl border-border/40 hover:bg-muted/50 text-xs font-semibold gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          Cancel Queue
        </Button>
      </div>
    </div>
  );
};
