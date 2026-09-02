import React, { useState } from "react";
import { motion } from "framer-motion";
import { GameRoomState } from "../types";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, ArrowLeft, QrCode, Eye, Link2, Check } from "lucide-react";
import { gameAudio } from "../services/gameSoundService";
import { GameTurnTimer } from "./GameTurnTimer";
import { GameMiniPIP } from "./GameMiniPIP";
import { GameAvatar } from "./GameAvatar";
import { toast } from "sonner";

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
  const [linkCopied, setLinkCopied] = useState(false);

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
    level: 1,
    isHost: false,
    isOnline: false,
    lastActive: Date.now(),
  };

  const spectatorCount = Object.keys(room.spectators || {}).length;

  const handleMuteToggle = () => {
    const nextMute = gameAudio.toggleMute();
    setIsMuted(nextMute);
  };

  const handleCopyDirectLink = async () => {
    const url = `${window.location.origin}/games?room=${room.roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      gameAudio.playClick();
      toast.success(`Invite link copied! Share with your friend.`);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error("Could not copy link to clipboard.");
    }
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
    <div className="w-full max-w-xl flex flex-col gap-2 px-1.5 sm:px-2 py-1.5 select-none touch-manipulation">
      {/* Top Controls Row */}
      <div className="flex items-center justify-between gap-1.5">
        <button
          onClick={onExit}
          className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors font-semibold px-2 py-1 rounded-lg hover:bg-muted/40 cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">{isSpectator ? "Leave Match" : "Exit"}</span>
        </button>

        {/* Center Title & Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-muted-foreground/80 truncate max-w-[90px] xs:max-w-[130px] sm:max-w-[180px]">
            {gameTitle}
          </span>
          <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold shrink-0">
            R{room.round}
          </span>
          {spectatorCount > 0 && (
            <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-bold flex items-center gap-0.5 sm:gap-1 shrink-0">
              <Eye className="w-3 h-3" />
              {spectatorCount}
            </span>
          )}
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {!isSpectator && (
            <GameMiniPIP
              playerName={isHost ? hostPlayer.name : guestDisplayName}
              opponentName={isHost ? guestDisplayName : hostPlayer.name}
              roomCode={room.roomCode}
              isHost={isHost}
              isOnlineMode={room.mode !== "local" && room.mode !== "ai"}
            />
          )}

          {/* 1-Tap Quick Invite Link Copier */}
          {room.mode === "friend" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyDirectLink}
              className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition-all ${
                linkCopied
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              }`}
              title="Copy 1-Tap Invite Link"
            >
              {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
            </Button>
          )}

          {room.mode === "friend" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenQR}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg text-muted-foreground hover:text-primary"
              title="View QR Code & Share"
            >
              <QrCode className="w-3.5 h-3.5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleMuteToggle}
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg text-muted-foreground hover:text-foreground"
            title={isMuted ? "Unmute sound effects" : "Mute sound effects"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Players & Turn Card */}
      <div className="p-2.5 sm:p-4 rounded-2xl bg-card border border-border shadow-md flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Player 1 (Host) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-base sm:text-lg font-bold overflow-hidden shadow-inner">
              <GameAvatar avatar={hostPlayer.avatar} fallback="👤" className="text-base sm:text-lg" />
            </div>
            {hostPlayer.isOnline ? (
              <span className="absolute -bottom-0.5 -right-0.5 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
            ) : (
              <span className="absolute -bottom-0.5 -right-0.5 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-rose-400 ring-2 ring-background" />
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1 truncate">
              <span className="text-[11px] sm:text-xs font-bold truncate text-foreground max-w-[60px] xs:max-w-[85px] sm:max-w-[120px]">
                {hostPlayer.name}
              </span>
              {hostPlayer.level && hostPlayer.level > 1 && (
                <span className="hidden xs:inline text-[8px] sm:text-[9px] px-1 py-0.1 rounded bg-violet-500/20 text-violet-400 font-bold border border-violet-500/30">
                  L{hostPlayer.level}
                </span>
              )}
            </div>
            <span className="text-xs sm:text-sm font-black text-violet-400">
              {hostPlayer.score} <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground">PTS</span>
            </span>
          </div>
        </div>

        {/* Turn Pill Center */}
        <div className="flex flex-col items-center shrink-0 px-1">
          {isSpectator ? (
            <div className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-muted border border-border text-[10px] sm:text-xs font-bold flex items-center gap-1 text-muted-foreground">
              <Eye className="w-3 h-3 text-primary" />
              <span>Spectating</span>
            </div>
          ) : room.status === "waiting" ? (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] sm:text-[11px] font-bold"
            >
              Waiting...
            </motion.div>
          ) : isLocal ? (
            <div className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] sm:text-[11px] font-bold truncate max-w-[90px] xs:max-w-[120px] text-center">
              {room.currentTurn === hostPlayer.id ? `${hostPlayer.name}'s Turn` : `${guestDisplayName}'s Turn`}
            </div>
          ) : isAI && !isMyTurn ? (
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] sm:text-[11px] font-bold flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              AI Thinking
            </motion.div>
          ) : isMyTurn ? (
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-500 text-[10px] sm:text-[11px] font-bold shadow-sm shadow-emerald-500/20"
            >
              Your Turn
            </motion.div>
          ) : (
            <div className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-muted border border-border text-muted-foreground text-[10px] sm:text-[11px] font-semibold">
              Opponent
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
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 justify-end">
          <div className="flex flex-col items-end min-w-0">
            <div className="flex items-center gap-1 truncate">
              {guestPlayer.level && guestPlayer.level > 1 && !isAI && (
                <span className="hidden xs:inline text-[8px] sm:text-[9px] px-1 py-0.1 rounded bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">
                  L{guestPlayer.level}
                </span>
              )}
              <span className="text-[11px] sm:text-xs font-bold truncate text-foreground max-w-[60px] xs:max-w-[85px] sm:max-w-[120px]">
                {guestDisplayName}
              </span>
            </div>
            <span className="text-xs sm:text-sm font-black text-cyan-400">
              {guestPlayer.score} <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground">PTS</span>
            </span>
          </div>

          <div className="relative shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-base sm:text-lg font-bold overflow-hidden shadow-inner">
              <GameAvatar avatar={guestPlayer.avatar} fallback={isAI ? "🤖" : "👤"} className="text-base sm:text-lg" />
            </div>
            {guestPlayer.isOnline ? (
              <span className="absolute -bottom-0.5 -right-0.5 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
            ) : (
              <span className="absolute -bottom-0.5 -right-0.5 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-amber-400 ring-2 ring-background" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
