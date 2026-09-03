import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, Home, Sparkles, Frown, Meh, Crown, X, Zap, Flame, Loader2, Check } from "lucide-react";
import { GameRoomState } from "../types";
import { GameAvatar } from "./GameAvatar";
import { triggerConfetti } from "../services/confettiEffect";
import { getGamerProfile, getXpForNextLevel } from "../services/gameProgressionService";

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
  const isOnline = room.mode === "friend" || room.mode === "quickmatch";

  const profile = getGamerProfile();
  const xpNeeded = getXpForNextLevel(profile.level);
  const xpPercent = Math.min(Math.round((profile.xp / xpNeeded) * 100), 100);

  // Rematch Vote status
  const myVote = Boolean(room.rematchVotes?.[myPlayerId]);
  const opponentId = isHost ? room.players.guest?.id : room.players.host.id;
  const opponentVote = opponentId ? Boolean(room.rematchVotes?.[opponentId]) : false;

  // Streak Multipliers
  const streakMultiplier = profile.streak >= 5 ? 1.5 : profile.streak >= 3 ? 1.25 : 1.0;
  const streakBonus = isWinner && streakMultiplier > 1 ? Math.round(80 * (streakMultiplier - 1)) : 0;

  // Trigger confetti burst on victory or series championship
  useEffect(() => {
    if (isOpen && (isWinner || isSeriesOver || (isLocal && !isDraw))) {
      triggerConfetti({ particleCount: isSeriesOver ? 120 : 70 });
    }
  }, [isOpen, isWinner, isSeriesOver, isLocal, isDraw]);

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
      <DialogContent className="max-w-[92vw] sm:max-w-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/60 shadow-2xl text-center max-h-[92vh] overflow-y-auto no-scrollbar touch-manipulation">
        {/* Celebration Ambient Glow */}
        {(isWinner || (isLocal && !isDraw) || isSeriesOver) && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/25 rounded-full blur-3xl animate-pulse" />
          </div>
        )}

        <DialogHeader className="flex flex-col items-center relative z-10">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 18 }}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center text-3xl sm:text-4xl shadow-xl mb-2.5 sm:mb-3 border ${
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
              <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-amber-950" />
            ) : isDraw ? (
              <Meh className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
            ) : isWinner || (isLocal && room.winnerId) ? (
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 animate-pulse" />
            ) : (
              <Frown className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
            )}
          </motion.div>

          <DialogTitle className="text-xl sm:text-3xl font-black tracking-tight">
            {isSeriesOver
              ? `👑 ${seriesWinnerName} is the Champion!`
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
        <div className="relative z-10 grid grid-cols-3 items-center p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-muted/40 border border-border/40 my-3 sm:my-4 shadow-inner gap-1">
          {/* Host Player */}
          <div className="flex flex-col items-center gap-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-base sm:text-lg font-bold overflow-hidden">
              <GameAvatar avatar={hostPlayer.avatar} fallback="👤" className="text-base sm:text-lg" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-foreground truncate max-w-[70px] xs:max-w-[85px] sm:max-w-[110px]">
              {hostPlayer.name} {isHost && !isLocal && "(You)"}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-violet-400">{hostPlayer.score}</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground">WINS</span>
            </div>
            {room.winnerId === hostPlayer.id && (
              <span className="text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40">
                WINNER
              </span>
            )}
          </div>

          {/* Center VS & Round Info */}
          <div className="flex flex-col items-center justify-center gap-0.5 sm:gap-1">
            <span className="text-[10px] sm:text-xs font-black tracking-widest text-muted-foreground/50">VS</span>
            <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
              {isSeriesOver ? "SERIES OVER" : `ROUND ${room.round}`}
            </span>
            {room.rules?.maxSeriesWins && (
              <span className="text-[8px] sm:text-[9px] text-muted-foreground">
                First to {room.rules.maxSeriesWins}
              </span>
            )}
          </div>

          {/* Guest Player */}
          <div className="flex flex-col items-center gap-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-base sm:text-lg font-bold overflow-hidden">
              <GameAvatar avatar={guestPlayer.avatar} fallback={isAI ? "🤖" : "👤"} className="text-base sm:text-lg" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-foreground truncate max-w-[70px] xs:max-w-[85px] sm:max-w-[110px]">
              {guestDisplayName} {!isHost && !isLocal && !isAI && "(You)"}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-cyan-400">{guestPlayer.score}</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground">WINS</span>
            </div>
            {room.winnerId === guestPlayer.id && (
              <span className="text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40">
                WINNER
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Game-Specific Round Highlights */}
        {room.gameId === "sos" && (
          <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40 text-xs font-bold flex items-center justify-between mb-3 text-muted-foreground">
            <span>SOS Formed This Round:</span>
            <div className="flex items-center gap-2">
              <span className="text-violet-400 font-black">{hostPlayer.name}: {((room.gameState as any)?.hostScore ?? 0)}</span>
              <span>-</span>
              <span className="text-cyan-400 font-black">{guestDisplayName}: {((room.gameState as any)?.guestScore ?? 0)}</span>
            </div>
          </div>
        )}

        {room.gameId === "bingo" && (
          <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40 text-xs font-bold flex items-center justify-between mb-3 text-muted-foreground">
            <span>Completed Lines:</span>
            <div className="flex items-center gap-2">
              <span className="text-violet-400 font-black">{hostPlayer.name}: {((room.gameState as any)?.hostLines ?? 0)}/5</span>
              <span>-</span>
              <span className="text-cyan-400 font-black">{guestDisplayName}: {((room.gameState as any)?.guestLines ?? 0)}/5</span>
            </div>
          </div>
        )}

        {/* Live Progression XP Breakdown Banner */}
        <div className="p-3 rounded-2xl bg-card border border-border/60 relative z-10 mb-4 text-left">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="flex items-center gap-1 text-primary">
              <Zap className="w-3.5 h-3.5 fill-primary text-primary" />
              Level {profile.level} • {profile.title}
            </span>
            <div className="flex items-center gap-1.5">
              {streakBonus > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-black flex items-center gap-0.5">
                  <Flame className="w-3 h-3" />
                  {streakMultiplier}x STREAK
                </span>
              )}
              <span className="text-[11px] text-muted-foreground font-semibold">
                {isWinner ? `+${110 + streakBonus} XP` : isDraw ? "+70 XP" : "+30 XP"} Earned
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Action Buttons with Two-Way Handshake Rematch */}
        <div className="flex flex-col gap-2 relative z-10">
          {isOnline ? (
            myVote ? (
              <Button
                disabled
                className="w-full h-11 rounded-xl bg-muted border border-border text-foreground font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-wait"
              >
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Waiting for Opponent (1/2 Ready)...</span>
              </Button>
            ) : opponentVote ? (
              <Button
                onClick={onRematch}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-xl shadow-orange-500/30 hover:opacity-95 transition-all gap-2 animate-pulse cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                <span>Opponent wants a Rematch! Tap to Accept 🔥</span>
              </Button>
            ) : (
              <Button
                onClick={onRematch}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:opacity-90 transition-all gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isSeriesOver ? "Vote New Series" : "Play Next Round (0/2 Ready)"}</span>
              </Button>
            )
          ) : (
            <Button
              onClick={onRematch}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:opacity-90 transition-all gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              {isSeriesOver ? "Start New Series" : "Play Next Round"}
            </Button>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1 h-10 rounded-xl border-border text-xs font-semibold hover:bg-muted cursor-pointer"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Close Popup
            </Button>

            <Button
              variant="ghost"
              onClick={onExitToLobby}
              className="flex-1 h-10 rounded-xl text-muted-foreground hover:text-foreground text-xs gap-1.5 hover:bg-muted/50 cursor-pointer"
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
