import React, { useState } from "react";
import { motion } from "framer-motion";
import { GameRoomState } from "../types";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, ArrowLeft, QrCode, Eye } from "lucide-react";
import { gameAudio } from "../services/gameSoundService";
import { GameTurnTimer } from "./GameTurnTimer";
import { GameMiniPIP } from "./GameMiniPIP";

interface GameScoreboardProps {
  room: GameRoomState;
  myPlayerId: string;
  gameTitle: string;
  isSpectator?: boolean;
  onExit: () => void;
  onOpenQR: () => void;
  onTurnTimeout?: () => void;
}

export const GameScoreboard: React.FC<GameScoreboardProps> = ({
  room,
  myPlayerId,
  gameTitle,
  isSpectator = false,
  onExit,
  onOpenQR,
  onTurnTimeout,
}) => {
  const [isMuted, setIsMuted] = useState(gameAudio.isMuted());
  const isHost = room.players.host.id === myPlayerId;
  const isMyTurn = !isSpectator && room.currentTurn === myPlayerId;
  const isAI = room.mode === "ai";
  const isLocal = room.mode === "local";

  const hostPlayer = room.players.host;
  const guestPlayer = room.players.guest || {
    id: "guest",
    name: "Waiting for player...",
    avatar: "👤",
    score: 0,
    isHost: false,
    isOnline: false,
    lastActive: Date.now(),
  };

  const spectatorCount = Object.keys(room.spectators || {}).length;

  const handleMuteToggle = () => {
    const nextMute = gameAudio.toggleMute();
    setIsMuted(nextMute);
  };

  const guestDisplayName = isAI
    ? "Cyber AI 🤖"
    : isLocal
    ? "Player 2"
    : !room.players.guest
    ? "Waiting for Player..."
    : (room.players.guest.name === hostPlayer.name || (isHost && room.players.guest.name.toLowerCase() === "you"))
    ? "Opponent"
    : room.players.guest.name;

  return (
    <div className="w-full max-w-xl flex flex-col gap-2.5 px-2 py-2 select-none">
      {/* Top Controls Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium px-2 py-1 rounded-lg hover:bg-muted/40"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isSpectator ? "Leave Match" : "Exit"}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
            {gameTitle}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            Round {room.round}
          </span>
          {spectatorCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-bold flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {spectatorCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!isSpectator && !isAI && !isLocal && (
            <GameMiniPIP playerName={isHost ? hostPlayer.name : guestDisplayName} />
          )}

          {room.mode === "friend" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenQR}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
              title="View QR Code & Share"
            >
              <QrCode className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleMuteToggle}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            title={isMuted ? "Unmute sound effects" : "Mute sound effects"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Players & Turn Card */}
      <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border shadow-md flex items-center justify-between gap-2">
        {/* Player 1 (Host) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-lg font-bold">
              {hostPlayer.avatar || "👤"}
            </div>
            {hostPlayer.isOnline ? (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
            ) : (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-400 ring-2 ring-background" />
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold truncate text-foreground">
              {hostPlayer.name} {isHost && !isLocal && !isSpectator && "(You)"}
            </span>
            <span className="text-sm font-black text-violet-400">
              {hostPlayer.score} <span className="text-[10px] font-medium text-muted-foreground">PTS</span>
            </span>
          </div>
        </div>

        {/* Turn Pill Center */}
        <div className="flex flex-col items-center">
          {isSpectator ? (
            <div className="px-3 py-1 rounded-full bg-muted border border-border text-xs font-bold flex items-center gap-1.5 text-muted-foreground">
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span>Spectating</span>
            </div>
          ) : room.status === "waiting" ? (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] font-bold"
            >
              Waiting for Guest...
            </motion.div>
          ) : isLocal ? (
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px] font-bold">
              {room.currentTurn === hostPlayer.id ? `${hostPlayer.name}'s Turn` : `${guestDisplayName}'s Turn`}
            </div>
          ) : isAI && !isMyTurn ? (
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] font-bold flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              AI Thinking...
            </motion.div>
          ) : isMyTurn ? (
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-500 text-[11px] font-bold shadow-sm shadow-emerald-500/20"
            >
              Your Turn
            </motion.div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-muted border border-border text-muted-foreground text-[11px] font-semibold">
              Opponent's Turn
            </div>
          )}

          {/* Turn Timer Countdown Bar */}
          {room.rules?.turnTimerSeconds && room.rules.turnTimerSeconds > 0 && room.status === "playing" ? (
            <GameTurnTimer
              turnExpiresAt={room.turnExpiresAt}
              turnTimerSeconds={room.rules.turnTimerSeconds}
              isMyTurn={isMyTurn}
              onTimeout={onTurnTimeout}
            />
          ) : null}
        </div>

        {/* Player 2 (Guest / AI) */}
        <div className="flex items-center gap-2.5 min-w-0 justify-end">
          <div className="flex flex-col items-end min-w-0">
            <span className="text-xs font-bold truncate text-foreground">
              {guestDisplayName} {!isHost && !isLocal && !isAI && !isSpectator && "(You)"}
            </span>
            <span className="text-sm font-black text-cyan-400">
              {guestPlayer.score} <span className="text-[10px] font-medium text-muted-foreground">PTS</span>
            </span>
          </div>

          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-lg font-bold">
              {guestPlayer.avatar || (isAI ? "🤖" : "👤")}
            </div>
            {guestPlayer.isOnline ? (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
            ) : (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-background" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
