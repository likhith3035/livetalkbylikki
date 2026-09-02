import React from "react";
import { motion } from "framer-motion";
import { GameId } from "../types";
import { Button } from "@/components/ui/button";
import { Play, Sparkles } from "lucide-react";

export interface GameMetadata {
  id: GameId;
  title: string;
  tagline: string;
  category: "Strategy" | "Reflex" | "Casual" | "Classic";
  icon: string;
  gradient: string;
  accentColor: string;
  badge: string;
}

interface GameCardProps {
  game: GameMetadata;
  onOpenModeSelect: (game: GameMetadata) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onOpenModeSelect }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      onClick={() => onOpenModeSelect(game)}
      className="flex flex-col justify-between p-5 sm:p-6 rounded-3xl bg-card/60 backdrop-blur-xl border border-border/40 hover:border-primary/50 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group cursor-pointer select-none"
    >
      {/* Background ambient glow */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${game.gradient} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity pointer-events-none`}
      />

      {/* Card Top */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 border border-border/40 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform">
            {game.icon}
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
            {game.badge}
          </span>
        </div>

        <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
          {game.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
          {game.tagline}
        </p>
      </div>

      {/* Play Action Button */}
      <div className="mt-6 flex items-center justify-between pt-3 border-t border-border/30">
        <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
          QR Code • AI • 1v1
        </span>

        <Button
          size="sm"
          className="rounded-xl bg-primary text-primary-foreground font-bold text-xs gap-1.5 h-9 px-4 shadow-md shadow-primary/20 group-hover:scale-105 transition-transform"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Play
        </Button>
      </div>
    </motion.div>
  );
};
