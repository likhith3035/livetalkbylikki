import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  RotateCcw,
  Home,
  Sparkles,
  Crown,
  X,
  Zap,
  Flame,
  Loader2,
  Share2,
  Eye,
} from "lucide-react";
import { GameRoomState } from "../types";
import { GameAvatar } from "./GameAvatar";
import { triggerConfetti } from "../services/confettiEffect";
import { getGamerProfile, getXpForNextLevel } from "../services/gameProgressionService";
import { gameAudio } from "../services/gameSoundService";
import { gameHaptics } from "../services/gameHapticsService";
import { sendGameReaction } from "../services/gameRoomService";
import { ShareVictoryCardModal } from "./ShareVictoryCardModal";

interface VictoryModalProps {
  isOpen: boolean;
  room: GameRoomState;
  myPlayerId: string;
  isSpectator?: boolean;
  onClose?: () => void;
  onRematch: () => void;
  onExitToLobby: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  room,
  myPlayerId,
  isSpectator = false,
  onClose,
  onRematch,
  onExitToLobby,
}) => {
  const isDraw = room.winnerId === "draw";
  const isWinner = room.winnerId === myPlayerId;
  const isHost = room.players.host.id === myPlayerId;
  const isLocal = room.mode === "local";
  const isAI = room.mode === "ai";
  const isSeriesOver = room.status === "game_over" || Boolean(room.seriesWinnerId);
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

  const [isShareCardOpen, setIsShareCardOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string; x: number }[]>([]);

  const GAME_TITLES: Record<string, string> = {
    connect4: "Connect 4",
    sos: "Super SOS Neon",
    cricket: "Hand Cricket",
    bingo: "Bingo Blitz",
    ttt: "Tic-Tac-Toe",
    rps: "RPS Clash",
    memory: "Memory Duel",
    reaction: "Reaction Dash",
    taptug: "Tap Blitz: Tug of War",
    penfight: "Pen Fight Classroom Duel",
    colorrush: "Color Rush",
  };
  const activeGameTitle = GAME_TITLES[room.gameId] || "Arcade Duel";

  // Trigger confetti burst on victory or series championship
  useEffect(() => {
    const isSeriesChampion =
      isSeriesOver &&
      (isWinner ||
        (isLocal && !isDraw) ||
        (isHost && room.players.host.score > (room.players.guest?.score || 0)) ||
        (!isHost && !isAI && (room.players.guest?.score || 0) > room.players.host.score));

    if (isOpen && (isWinner || isSeriesChampion || (isLocal && !isDraw))) {
      triggerConfetti({ particleCount: isSeriesOver ? 140 : 80 });
    }
  }, [
    isOpen,
    isWinner,
    isSeriesOver,
    isLocal,
    isDraw,
    isHost,
    isAI,
    room.players.host.score,
    room.players.guest?.score,
  ]);

  // Synchronized victory, defeat, or draw audio and haptics when modal opens
  const lastSoundRoundRef = useRef<number>(-1);
  useEffect(() => {
    if (!isOpen || !room.winnerId) return;
    if (lastSoundRoundRef.current === room.round) return;
    lastSoundRoundRef.current = room.round;

    if (isDraw) {
      gameHaptics.medium();
      gameAudio.playDraw();
    } else if (isWinner || isLocal) {
      gameHaptics.victory();
      gameAudio.playWin();
    } else {
      gameHaptics.defeat();
      gameAudio.playLose();
    }
  }, [isOpen, room.round, room.winnerId, isDraw, isWinner, isLocal]);

  // Reset minimized state whenever a new round finishes
  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen, room.round]);

  const hostPlayer = room.players.host;
  const rawGuest = room.players.guest;

  const isSpectatorMode =
    isSpectator ||
    (room.mode !== "local" &&
      room.mode !== "ai" &&
      myPlayerId !== hostPlayer?.id &&
      myPlayerId !== rawGuest?.id);

  const hostIsMe = isHost && !isSpectatorMode && !isLocal;
  const guestIsMe = !isHost && !isSpectatorMode && !isLocal && !isAI;

  // Fix player names for local, AI, and online modes
  const hostDisplayName = isLocal
    ? "Player 1"
    : hostIsMe
    ? hostPlayer?.name || "Player 1"
    : guestIsMe && hostPlayer?.name === rawGuest?.name
    ? `${hostPlayer?.name || "Player 1"} (Host)`
    : hostPlayer?.name || "Host";

  const guestDisplayName = isAI
    ? "Cyber AI 🤖"
    : isLocal
    ? "Player 2"
    : !rawGuest
    ? "Waiting for Player..."
    : guestIsMe
    ? rawGuest.name || "Player 2"
    : hostIsMe && rawGuest.name === hostPlayer?.name
    ? `${rawGuest.name || "Player 2"} (Guest)`
    : isHost && rawGuest.name?.toLowerCase() === "you"
    ? "Opponent"
    : rawGuest.name || "Opponent";

  const guestPlayer = rawGuest || {
    id: "guest",
    name: guestDisplayName,
    avatar: isAI ? "🤖" : "👤",
    score: 0,
    isHost: false,
    isOnline: false,
    lastActive: Date.now(),
  };

  const isHostWinner = room.winnerId === hostPlayer?.id;
  const isGuestWinner = room.winnerId === guestPlayer?.id;

  const roundWinnerName = isDraw
    ? "It's a Draw!"
    : isHostWinner
    ? hostDisplayName
    : guestDisplayName;

  const isHostSeriesWinner =
    room.seriesWinnerId === hostPlayer?.id ||
    room.seriesWinnerId === "host" ||
    (!room.seriesWinnerId && (hostPlayer?.score || 0) > (rawGuest?.score || 0));

  const isSeriesWinner =
    isSeriesOver &&
    (room.seriesWinnerId === myPlayerId ||
      (isHost && isHostSeriesWinner) ||
      (!isHost && !isAI && !isHostSeriesWinner));

  const seriesWinnerName = isHostSeriesWinner ? hostDisplayName : guestDisplayName;

  const handleDismiss = () => {
    if (onClose) {
      onClose();
    } else {
      onExitToLobby();
    }
  };

  const handleSendReaction = (emoji: string, label: string) => {
    gameHaptics.light();
    gameAudio.playClick();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const x = Math.floor(Math.random() * 80) + 10;
    setFloatingEmojis((prev) => [...prev.slice(-5), { id, emoji, x }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 1800);

    if (isOnline && room.roomCode) {
      sendGameReaction(room.roomCode, myPlayerId, emoji, label).catch(() => {});
    }
  };

  return (
    <>
      {/* Minimized Floating HUD to let player inspect final board state */}
      {isMinimized && isOpen && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#090b14]/95 backdrop-blur-2xl border border-primary/40 shadow-2xl text-white select-none"
        >
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Round {room.round} Finished</span>
          </div>
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:opacity-90 transition-all cursor-pointer shadow-md"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Show Results</span>
          </button>
          <button
            type="button"
            onClick={onRematch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Next Round</span>
          </button>
        </motion.div>
      )}

      <Dialog open={isOpen && !isMinimized} onOpenChange={(open) => !open && handleDismiss()}>
        <DialogContent
          hideCloseButton
          className={`max-w-[92vw] sm:max-w-lg p-5 sm:p-7 rounded-3xl bg-[#090b14]/95 backdrop-blur-2xl border transition-all duration-300 text-center max-h-[92vh] overflow-y-auto no-scrollbar touch-manipulation relative overflow-hidden ${
            isDraw
              ? "border-purple-500/40 shadow-[0_0_60px_rgba(168,85,247,0.22)] ring-1 ring-cyan-400/30"
              : isWinner || (isLocal && !isDraw) || isSeriesWinner
              ? "border-amber-400/50 shadow-[0_0_60px_rgba(245,158,11,0.28)] ring-1 ring-amber-400/40"
              : "border-rose-500/40 shadow-[0_0_60px_rgba(244,63,94,0.25)] ring-1 ring-rose-400/30"
          }`}
        >
          {/* Dedicated High-Z-Index Top-Right Close 'X' Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              gameHaptics.light();
              gameAudio.playClick();
              handleDismiss();
            }}
            className="absolute right-3.5 top-3.5 z-50 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted border border-border/40 transition-all cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Close victory dialog"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Ambient Radiant Lighting Orbs */}
          {isDraw ? (
            <>
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
            </>
          ) : isWinner || (isLocal && !isDraw) || isSeriesWinner ? (
            <>
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
            </>
          ) : (
            <>
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
            </>
          )}

          {/* Floating Live Reaction Emojis Shower */}
          <AnimatePresence>
            {floatingEmojis.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 1, y: 20, scale: 0.8 }}
                animate={{ opacity: 0, y: -160, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6, ease: "easeOut" }}
                style={{ left: `${item.x}%` }}
                className="pointer-events-none absolute bottom-12 text-3xl z-50 filter drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
              >
                {item.emoji}
              </motion.div>
            ))}
          </AnimatePresence>

          <DialogHeader className="flex flex-col items-center relative z-10">
            {/* 3D Visual Centerpiece Artwork matching exact design */}
            <motion.div
              initial={{ scale: 0.5, y: -15 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
              className="relative w-36 h-36 sm:w-44 sm:h-44 -mt-2 mb-1 flex items-center justify-center pointer-events-none select-none"
            >
              <img
                src={
                  isSeriesWinner || (isLocal && isSeriesOver && !isDraw) || isWinner || (isLocal && room.winnerId && !isDraw)
                    ? "/assets/games/victory-trophy.jpg"
                    : isDraw
                    ? "/assets/games/draw-emoji.jpg"
                    : "/assets/games/defeat-emblem.jpg"
                }
                alt="Match Outcome"
                className="w-full h-full object-contain filter drop-shadow-[0_12px_30px_rgba(0,0,0,0.7)]"
              />
            </motion.div>

            {/* Dynamic Dual-Tone Typography Title */}
            <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isSeriesOver ? (
                isLocal ? (
                  <span>
                    👑 {seriesWinnerName}{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
                      is Series Champion!
                    </span>
                  </span>
                ) : isSeriesWinner ? (
                  <span>
                    👑{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
                      Series Champion!
                    </span>
                  </span>
                ) : (
                  <span>
                    Series{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-500 to-red-500">
                      Defeat
                    </span>
                  </span>
                )
              ) : isDraw ? (
                <span>
                  Good Game! It's a{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400">
                    Draw
                  </span>
                </span>
              ) : isLocal ? (
                <span>
                  {roundWinnerName}{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
                    Wins Round!
                  </span>
                </span>
              ) : isWinner ? (
                <span>
                  Round{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
                    Victory!
                  </span>
                </span>
              ) : (
                <span>
                  Round{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-500 to-red-500">
                    Defeat!
                  </span>
                </span>
              )}
            </DialogTitle>

            <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs sm:max-w-sm mx-auto">
              {isSeriesOver
                ? isLocal
                  ? `${seriesWinnerName} clinched the series with ${Math.max(hostPlayer.score, guestPlayer.score)} victories!`
                  : isSeriesWinner
                  ? `Spectacular triumph! You won the championship series with ${Math.max(hostPlayer.score, guestPlayer.score)} victories!`
                  : `Opponent clinched the series with ${Math.max(hostPlayer.score, guestPlayer.score)} victories. Rematch to redeem yourself!`
                : isDraw
                ? "Both players matched wits equally."
                : isLocal
                ? `Congratulations to ${roundWinnerName} for winning round ${room.round}.`
                : isWinner
                ? "Spectacular play! You scored a win."
                : "Tough match! Challenge to a rematch to bounce back."}
            </DialogDescription>
          </DialogHeader>

          {/* Two Player Cards Comparison (Left vs Right) */}
          <div className="relative z-10 grid grid-cols-3 items-center gap-2 sm:gap-3 my-3 sm:my-4">
            {/* Host Player Card */}
            <div
              className={`relative flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-2xl border transition-all ${
                isHostWinner
                  ? "bg-gradient-to-b from-amber-500/15 via-[#13172c]/95 to-[#0d1020]/95 border-amber-400/80 ring-2 ring-amber-400/40 shadow-[0_0_25px_rgba(251,191,36,0.25)]"
                  : "bg-[#121629]/80 border-border/50 text-muted-foreground"
              }`}
            >
              {isHostWinner && (
                <div className="absolute -top-3.5 -right-2 text-amber-400 animate-bounce">
                  <Crown className="w-5 h-5 fill-amber-400 filter drop-shadow-[0_2px_8px_rgba(251,191,36,0.6)]" />
                </div>
              )}

              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-violet-600/40 to-indigo-700/40 border border-violet-400/40 flex items-center justify-center text-xl sm:text-2xl shadow-inner">
                <GameAvatar avatar={hostPlayer.avatar} fallback="👤" className="text-xl sm:text-2xl" />
              </div>

              <span className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[85px] sm:max-w-[120px]">
                {hostDisplayName} {hostIsMe && "(You)"}
              </span>

              <div className="flex items-baseline gap-1 my-0.5">
                <span className={`text-2xl sm:text-3xl font-black ${isHostWinner ? "text-amber-300" : "text-foreground"}`}>
                  {hostPlayer.score}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground tracking-wider">WINS</span>
              </div>

              {isHostWinner ? (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                  <Crown className="w-3 h-3 fill-emerald-400" />
                  WINNER
                </span>
              ) : (
                <span className="h-5" />
              )}
            </div>

            {/* Center VS & Round Info */}
            <div className="flex flex-col items-center justify-center gap-1.5 px-1">
              <span className="text-xs font-black tracking-widest text-muted-foreground/60">VS</span>
              <span className="text-[11px] px-3 py-1 rounded-full bg-violet-600/25 border border-violet-500/35 text-violet-300 font-extrabold shadow-sm">
                {isSeriesOver ? "SERIES OVER" : `ROUND ${room.round}`}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground">
                {room.rules?.maxSeriesWins ? `First to ${room.rules.maxSeriesWins}` : "Single Match"}
              </span>
            </div>

            {/* Guest Player Card */}
            <div
              className={`relative flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-2xl border transition-all ${
                isGuestWinner
                  ? "bg-gradient-to-b from-emerald-500/15 via-[#13172c]/95 to-[#0d1020]/95 border-emerald-400/80 ring-2 ring-emerald-400/40 shadow-[0_0_25px_rgba(16,185,129,0.25)]"
                  : "bg-[#121629]/80 border-border/50 text-muted-foreground"
              }`}
            >
              {isGuestWinner && (
                <div className="absolute -top-3.5 -right-2 text-emerald-400 animate-bounce">
                  <Crown className="w-5 h-5 fill-emerald-400 filter drop-shadow-[0_2px_8px_rgba(16,185,129,0.6)]" />
                </div>
              )}

              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-600/40 to-blue-700/40 border border-cyan-400/40 flex items-center justify-center text-xl sm:text-2xl shadow-inner">
                <GameAvatar avatar={guestPlayer.avatar} fallback={isAI ? "🤖" : "👤"} className="text-xl sm:text-2xl" />
              </div>

              <span className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[85px] sm:max-w-[120px]">
                {guestDisplayName} {guestIsMe && "(You)"}
              </span>

              <div className="flex items-baseline gap-1 my-0.5">
                <span className={`text-2xl sm:text-3xl font-black ${isGuestWinner ? "text-emerald-300" : "text-foreground"}`}>
                  {guestPlayer.score}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground tracking-wider">WINS</span>
              </div>

              {isGuestWinner ? (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                  <Crown className="w-3 h-3 fill-emerald-400" />
                  WINNER
                </span>
              ) : (
                <span className="h-5" />
              )}
            </div>
          </div>

          {/* Game Specific Metric Highlights */}
          {room.gameId === "sos" && (
            <div className="p-2.5 rounded-xl bg-[#121628]/80 border border-border/40 text-xs font-bold flex items-center justify-between mb-3 text-muted-foreground">
              <span>SOS Formed This Round:</span>
              <div className="flex items-center gap-2">
                <span className="text-violet-400 font-black">
                  {hostDisplayName}: {(room.gameState as any)?.hostScore ?? 0}
                </span>
                <span>-</span>
                <span className="text-cyan-400 font-black">
                  {guestDisplayName}: {(room.gameState as any)?.guestScore ?? 0}
                </span>
              </div>
            </div>
          )}

          {room.gameId === "bingo" && (
            <div className="p-2.5 rounded-xl bg-[#121628]/80 border border-border/40 text-xs font-bold flex items-center justify-between mb-3 text-muted-foreground">
              <span>Completed Lines:</span>
              <div className="flex items-center gap-2">
                <span className="text-violet-400 font-black">
                  {hostDisplayName}: {(room.gameState as any)?.hostLines ?? 0}/5
                </span>
                <span>-</span>
                <span className="text-cyan-400 font-black">
                  {guestDisplayName}: {(room.gameState as any)?.guestLines ?? 0}/5
                </span>
              </div>
            </div>
          )}

          {/* Live Progression XP Breakdown Banner */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#121628]/90 border border-white/10 relative z-10 mb-3 text-left shadow-inner">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5 text-violet-400 font-extrabold">
                <Zap className="w-4 h-4 fill-violet-400 text-violet-400" />
                <span>
                  Level {profile.level} &rsaquo; {profile.title}
                </span>
              </span>
              <div className="flex items-center gap-2">
                {streakBonus > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-black flex items-center gap-1 border border-orange-500/30">
                    <Flame className="w-3 h-3 fill-orange-400" />
                    {streakMultiplier}x STREAK
                  </span>
                )}
                <span className="text-xs text-muted-foreground font-semibold">
                  +{isWinner ? 110 + streakBonus : isDraw ? 70 : 30} XP Earned
                </span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden p-0.5 border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
              />
            </div>
          </div>

          {/* Action Buttons Matching Screenshots + Enhanced Next Round */}
          <div className="flex flex-col gap-2.5 relative z-10">
            {/* 📸 Share Victory Card Button */}
            <Button
              onClick={() => {
                gameHaptics.light();
                setIsShareCardOpen(true);
              }}
              className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-between px-4 sm:px-5 cursor-pointer border border-white/20 group"
            >
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-cyan-300 group-hover:rotate-12 transition-transform" />
                <span>📸 Share Victory Card (Story / WhatsApp)</span>
              </div>
              <span className="text-cyan-300 font-black text-lg">&rsaquo;</span>
            </Button>

            {/* 🔄 Play Next Round / Rematch Button */}
            <Button
              onClick={() => {
                gameHaptics.light();
                onRematch();
              }}
              className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-between px-4 sm:px-5 cursor-pointer border border-white/20 group"
            >
              <div className="flex items-center gap-2">
                {isOnline && myVote ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                ) : opponentVote ? (
                  <Flame className="w-4 h-4 text-amber-300 animate-bounce" />
                ) : (
                  <RotateCcw className="w-4 h-4 text-purple-200 group-hover:-rotate-45 transition-transform" />
                )}
                <span>
                  {isOnline
                    ? myVote
                      ? "Waiting for Opponent (1/2 Ready)..."
                      : opponentVote
                      ? "Opponent wants Rematch! Tap to Accept 🔥"
                      : isSeriesOver
                      ? "Vote New Series (0/2 Ready)"
                      : "Play Next Round (0/2 Ready)"
                    : isSeriesOver
                    ? "Start New Series"
                    : "Play Next Round"}
                </span>
              </div>
              <span className="text-purple-200 font-black text-lg">&rsaquo;</span>
            </Button>

            {/* Quick Interactive Reactions Bar */}
            <div className="flex items-center justify-center gap-2 pt-1 pb-0.5">
              <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mr-1">
                React:
              </span>
              {[
                { emoji: "🎉", label: "GG" },
                { emoji: "🔥", label: "Fire" },
                { emoji: "👏", label: "Clap" },
                { emoji: "👑", label: "Crown" },
                { emoji: "🤯", label: "Shock" },
                { emoji: "💀", label: "Oof" },
              ].map((item) => (
                <button
                  key={item.emoji}
                  type="button"
                  onClick={() => handleSendReaction(item.emoji, item.label)}
                  title={`Send ${item.label}`}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-sm transition-all hover:scale-125 active:scale-95 cursor-pointer shadow-sm"
                >
                  {item.emoji}
                </button>
              ))}
            </div>

            {/* Bottom Utility Actions: Close Popup, Inspect Board, Arcade Hub */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 pt-1">
              <button
                type="button"
                onClick={handleDismiss}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-muted/40"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close Popup</span>
              </button>

              <span className="text-muted-foreground/30 text-xs">•</span>

              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                title="Minimize popup to view the final game board"
                className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-sky-500/10"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect Board</span>
              </button>

              <span className="text-muted-foreground/30 text-xs">•</span>

              <button
                type="button"
                onClick={onExitToLobby}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-muted/40"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Arcade Hub</span>
              </button>
            </div>
          </div>
        </DialogContent>

        {/* 9:16 High-Res Shareable Victory Poster Modal */}
        <ShareVictoryCardModal
          isOpen={isShareCardOpen}
          onClose={() => setIsShareCardOpen(false)}
          room={room}
          myPlayerId={myPlayerId}
          gameTitle={activeGameTitle}
        />
      </Dialog>
    </>
  );
};
