import React from "react";
import { motion } from "framer-motion";
import { GameId } from "../types";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bookmark, Users } from "lucide-react";

export interface GameMetadata {
  id: GameId;
  title: string;
  tagline: string;
  category: "Strategy" | "Reflex" | "Casual" | "Classic" | "Brain";
  icon: string;
  gradient: string;
  accentColor: string;
  badge: string;
  badgeType?: "popular" | "classic" | "fast" | "brain" | "reflex" | "hot";
  tags?: string[];
  playerCount?: string;
}

interface GameCardProps {
  game: GameMetadata;
  onOpenModeSelect: (game: GameMetadata) => void;
  onOpenHowToPlay?: (game: GameMetadata) => void;
}

const DEFAULT_TAGS: Record<GameId, string[]> = {
  ttt: ["Classic", "Strategy"],
  connect4: ["Strategy", "Casual"],
  rps: ["Casual", "Multiplayer"],
  memory: ["Memory", "Casual"],
  reaction: ["Reflex", "Skill"],
  sos: ["Strategy", "Multiplayer"],
  bingo: ["Classic", "Casual"],
  cricket: ["Strategy", "Sports"],
};

const DEFAULT_PLAYERS: Record<GameId, string> = {
  ttt: "8.4K playing",
  connect4: "5.1K playing",
  rps: "6.7K playing",
  memory: "4.9K playing",
  reaction: "3.8K playing",
  sos: "4.2K playing",
  cricket: "7.3K playing",
  bingo: "5.6K playing",
};

const BADGE_STYLES: Record<string, string> = {
  popular: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
  classic: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  fast: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30",
  brain: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  reflex: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
  hot: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
};

const getBadgeStyle = (badge: string) => {
  const lower = badge.toLowerCase();
  if (lower.includes("popular")) return BADGE_STYLES.popular;
  if (lower.includes("classic")) return BADGE_STYLES.classic;
  if (lower.includes("fast")) return BADGE_STYLES.fast;
  if (lower.includes("brain")) return BADGE_STYLES.brain;
  if (lower.includes("reflex")) return BADGE_STYLES.reflex;
  if (lower.includes("hot") || lower.includes("new")) return BADGE_STYLES.hot;
  return "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30";
};

export const GameCard: React.FC<GameCardProps> = ({ game, onOpenModeSelect, onOpenHowToPlay }) => {
  const tags = game.tags || DEFAULT_TAGS[game.id] || [game.category];
  const playerCount = game.playerCount || DEFAULT_PLAYERS[game.id] || "4.5K playing";
  const badgeStyle = getBadgeStyle(game.badge);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      onClick={() => onOpenModeSelect(game)}
      className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-card dark:bg-[#12131e] border border-border/80 dark:border-white/[0.07] hover:border-indigo-400 dark:hover:border-indigo-500/40 shadow-sm hover:shadow-xl dark:shadow-xl dark:hover:shadow-indigo-950/30 transition-all duration-300 relative overflow-hidden group cursor-pointer select-none"
    >
      {/* Subtle top specular border highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/10 dark:via-white/10 to-transparent pointer-events-none" />

      {/* Background ambient radial glow */}
      <div
        className={`absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br ${game.gradient} opacity-10 blur-3xl group-hover:opacity-25 transition-opacity pointer-events-none`}
      />

      {/* Card Header: 3D Icon & Category Badge */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-14 h-14 rounded-2xl bg-secondary/80 dark:bg-[#1c1d2e]/90 border border-border/70 dark:border-white/[0.08] flex items-center justify-center text-3xl shadow-inner relative group-hover:scale-105 transition-transform">
            {/* Custom 3D-styled icons for the visual signature in screenshot */}
            {game.id === "ttt" ? (
              <div className="w-8 h-8 rounded-full border-[5px] border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]" />
            ) : game.id === "connect4" ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 via-red-500 to-red-700 shadow-[0_0_14px_rgba(239,68,68,0.7)]" />
            ) : game.id === "reaction" ? (
              <span className="text-amber-500 dark:text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] text-2xl font-black">⚡</span>
            ) : game.id === "memory" ? (
              <span className="drop-shadow-[0_0_12px_rgba(236,72,153,0.7)] text-2xl">🧠</span>
            ) : game.id === "sos" ? (
              <span className="text-amber-500 dark:text-amber-300 drop-shadow-[0_0_10px_rgba(252,211,77,0.8)] text-2xl font-black">✨</span>
            ) : game.id === "rps" ? (
              <span className="text-2xl drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]">✊</span>
            ) : (
              <span>{game.icon}</span>
            )}
          </div>

          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-3 py-0.5 rounded-full border ${badgeStyle}`}
          >
            {game.badge}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-foreground dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors tracking-tight">
          {game.title}
        </h3>

        {/* Tagline */}
        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed min-h-[34px]">
          {game.tagline}
        </p>

        {/* Category Tags */}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-secondary/80 dark:bg-[#1b1c2b] text-secondary-foreground dark:text-gray-300 border border-border/50 dark:border-white/[0.04]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Card Footer: How to Play link + Player count + Play button */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/60 dark:border-white/[0.06] text-xs">
        {/* Rules button */}
        {onOpenHowToPlay ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenHowToPlay(game);
            }}
            className="flex items-center gap-1 text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors cursor-pointer py-1 px-1.5 -ml-1.5 rounded-lg hover:bg-secondary dark:hover:bg-white/[0.06]"
            title="Read how to play rules"
          >
            <Bookmark className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span className="font-semibold text-[11px]">Rules</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 text-muted-foreground dark:text-gray-400">
            <Users className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">{playerCount}</span>
          </div>
        )}

        {/* Active Player Counter */}
        <div className="hidden xs:flex items-center gap-1 text-muted-foreground dark:text-gray-400 font-medium text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{playerCount}</span>
        </div>

        {/* Play Button */}
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onOpenModeSelect(game);
          }}
          className="rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold text-xs px-4 h-8 shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <span>Play</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>
    </motion.div>
  );
};
