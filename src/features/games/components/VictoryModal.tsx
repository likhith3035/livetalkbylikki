import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, Home, Sparkles, Frown, Meh, Crown, X } from "lucide-react";
import { GameRoomState } from "../types";
import { GameAvatar } from "./GameAvatar";

interface VictoryModalProps {
  isOpen: boolean;
  room: GameRoomState;
  myPlayerId: string;
  onClose?: () => void;
  onRematch: () => void;
  onExitToLobby: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  room,
  myPlayerId,
  onClose,
  onRematch,
  onExitToLobby,
}) => {
  const isDraw = room.winnerId === "draw";
  const isWinner = room.winnerId === myPlayerId;
  const isHost = room.players.host.id === myPlayerId;
  const isLocal = room.mode === "local";
  const isAI = room.mode === "ai";
  const isSeriesOver = room.status === "game_over" || !!room.seriesWinnerId;

  const hostPlayer = room.players.host;
  const rawGuest = room.players.guest;

  const guestDisplayName = isAI
    ? "Cyber AI 🤖"
    : isLocal
    ? "Player 2"
    : !rawGuest
    ? "Waiting for Player..."
    : (rawGuest.name === hostPlayer.name || rawGuest.name.toLowerCase() === "you")
    ? "Opponent"
    : rawGuest.name;

  const guestPlayer = rawGuest || {
    id: "guest",
    name: guestDisplayName,
    avatar: isAI ? "🤖" : "👤",
    score: 0,
    isHost: false,
    isOnline: false,
    lastActive: Date.now(),
  };

  const roundWinnerName = isDraw
    ? "It's a Draw!"
    : room.winnerId === hostPlayer.id
    ? hostPlayer.name
    : guestDisplayName;

  const seriesWinnerName = room.seriesWinnerId === "host"
    ? hostPlayer.name
    : guestDisplayName;

  const handleDismiss = () => {
    if (onClose) {
      onClose();
    } else {
      onExitToLobby();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="max-w-md p-6 rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/60 shadow-2xl text-center overflow-hidden">
        {/* Celebration Halo */}
        {(isWinner || (isLocal && !isDraw) || isSeriesOver) && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
          </div>
        )}

        <DialogHeader className="flex flex-col items-center relative z-10">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 18 }}
            className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-xl mb-3 border ${
              isSeriesOver
                ? "bg-gradient-to-tr from-amber-400 to-yellow-500 text-amber-950 border-yellow-300 shadow-amber-500/40 ring-4 ring-amber-400/30 animate-bounce"
                : isDraw
                ? "bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-amber-500/10"
                : isWinner || (isLocal && room.winnerId)
                ? "bg-gradient-to-tr from-amber-500/30 to-yellow-400/30 border-amber-500/50 text-amber-400 shadow-amber-500/30 ring-4 ring-amber-400/20"
                : "bg-muted/60 border-border text-muted-foreground"
            }`}
          >
            {isSeriesOver ? (
              <Crown className="w-10 h-10 text-amber-950" />
            ) : isDraw ? (
              <Meh className="w-10 h-10 text-amber-400" />
            ) : isWinner || (isLocal && room.winnerId) ? (
              <Trophy className="w-10 h-10 text-amber-400 animate-pulse" />
            ) : (
              <Frown className="w-10 h-10 text-muted-foreground" />
            )}
          </motion.div>

          <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight">
            {isSeriesOver
              ? `👑 ${seriesWinnerName} is the Match Champion!`
              : isDraw
              ? "Good Game! It's a Draw"
              : isLocal
              ? `${roundWinnerName} Wins Round!`
              : isWinner
              ? "Round Victory!"
              : "Round Defeat!"}
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            {isSeriesOver
              ? `Conquered the series with ${Math.max(hostPlayer.score, guestPlayer.score)} victories!`
              : isDraw
              ? "Both players matched wits equally."
              : isLocal
              ? `Congratulations to ${roundWinnerName} for winning round ${room.round}.`
              : isWinner
              ? "Spectacular play! You scored a win."
              : "Tough match! Challenge to a rematch to bounce back."}
          </DialogDescription>
        </DialogHeader>

        {/* Score Comparison Display Card */}
        <div className="relative z-10 grid grid-cols-3 items-center p-4 rounded-2xl bg-muted/40 border border-border/40 my-5 shadow-inner">
          {/* Host Player */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-lg font-bold overflow-hidden">
              <GameAvatar avatar={hostPlayer.avatar} fallback="👤" className="text-lg" />
            </div>
            <span className="text-xs font-bold text-foreground truncate max-w-[90px]">
              {hostPlayer.name} {isHost && !isLocal && "(You)"}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-violet-400">{hostPlayer.score}</span>
              <span className="text-[10px] font-bold text-muted-foreground">PTS</span>
            </div>
            {room.winnerId === hostPlayer.id && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40">
                ROUND WIN
              </span>
            )}
          </div>

          {/* Center VS & Round Info */}
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-xs font-black tracking-widest text-muted-foreground/50">VS</span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
              {isSeriesOver ? "FINAL" : `Round ${room.round}`}
            </span>
            {room.rules?.maxSeriesWins && (
              <span className="text-[9px] text-muted-foreground">
                First to {room.rules.maxSeriesWins}
              </span>
            )}
          </div>

          {/* Guest Player */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-lg font-bold overflow-hidden">
              <GameAvatar avatar={guestPlayer.avatar} fallback={isAI ? "🤖" : "👤"} className="text-lg" />
            </div>
            <span className="text-xs font-bold text-foreground truncate max-w-[90px]">
              {guestDisplayName} {!isHost && !isLocal && !isAI && "(You)"}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-cyan-400">{guestPlayer.score}</span>
              <span className="text-[10px] font-bold text-muted-foreground">PTS</span>
            </div>
            {room.winnerId === guestPlayer.id && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40">
                ROUND WIN
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 relative z-10">
          <Button
            onClick={onRematch}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:opacity-90 transition-all gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {isSeriesOver ? "Start New Series" : "Play Next Round"}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1 h-10 rounded-xl border-border text-xs font-semibold hover:bg-muted"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Close Popup
            </Button>

            <Button
              variant="ghost"
              onClick={onExitToLobby}
              className="flex-1 h-10 rounded-xl text-muted-foreground hover:text-foreground text-xs gap-1.5 hover:bg-muted/50"
            >
              <Home className="w-3.5 h-3.5" />
              Arcade Hub
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
