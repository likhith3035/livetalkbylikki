import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameRoomState, TypeRaceGameState } from "../../types";
import { gameAudio } from "../../services/gameSoundService";
import { sendGameMove } from "../../services/gameRoomService";
import {
  Trophy,
  Flame,
  Zap,
  Gauge,
  Timer,
  Car,
  RotateCcw,
  Sparkles,
  CheckCircle,
} from "lucide-react";

interface TypeRaceGameProps {
  room: GameRoomState<TypeRaceGameState>;
  myPlayerId: string;
  isMyTurn: boolean;
  onLocalMove?: (updatedRoom: GameRoomState<TypeRaceGameState>) => void;
}

const PASSAGES = [
  "The cyber hacker tapped into the neon mainframe at lightning speed to liberate the encrypted archives before the firewall locked down.",
  "Deep in the quantum simulator, two digital drivers accelerated their pulse engines across the glowing horizon of the cyber city.",
  "True champions never back down from a high speed duel when glory, prestige, and victory are on the line.",
  "Quick fingers glide across mechanical keys like lightning strikes in an intense battle for competitive arcade supremacy.",
];

export const TypeRaceGame: React.FC<TypeRaceGameProps> = ({
  room,
  myPlayerId,
  isMyTurn,
  onLocalMove,
}) => {
  const isHost = room.players.host.id === myPlayerId;
  const isAIMode = room.mode === "ai";
  const isLocalMode = room.mode === "local";

  const rawState = room.gameState as any;
  const promptText: string = rawState?.promptText || PASSAGES[0];

  const [inputVal, setInputVal] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [hostProgress, setHostProgress] = useState(0); // 0 to 100%
  const [guestProgress, setGuestProgress] = useState(0); // 0 to 100%
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [streak, setStreak] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hostColor = "#3b82f6";
  const guestColor = "#ec4899";

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // AI Opponent Progress Simulation
  useEffect(() => {
    if (!isAIMode) return;
    if (room.status === "round_over" || room.status === "game_over") return;

    // AI types at roughly 60-70 WPM (approx 5.5 characters per second)
    const interval = setInterval(() => {
      setGuestProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const delta = 1.2 + Math.random() * 1.5;
        const next = Math.min(100, prev + delta);
        if (next >= 100 && hostProgress < 100) {
          // AI Wins
          handleFinish(room.players.guest?.id || "guest");
        }
        return next;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isAIMode, room.status, hostProgress]);

  // Handle typing input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (room.status === "round_over" || room.status === "game_over") return;

    const val = e.target.value;
    if (!startTime) {
      setStartTime(Date.now());
    }

    // Check match with promptText
    const isCorrectSoFar = promptText.startsWith(val);

    if (isCorrectSoFar) {
      setInputVal(val);
      gameAudio.playClick();
      setStreak((s) => s + 1);

      // Calculate progress percentage
      const pct = Math.min(100, Math.round((val.length / promptText.length) * 100));
      setHostProgress(pct);

      // Calculate WPM
      const elapsedMins = (Date.now() - (startTime || Date.now())) / 60000;
      const wordCount = val.trim().split(/\s+/).length;
      const curWpm = elapsedMins > 0 ? Math.round(wordCount / elapsedMins) : 0;
      setWpm(curWpm);

      // Check for full completion
      if (val === promptText) {
        gameAudio.playWin();
        if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
        handleFinish(room.players.host.id);
      }
    } else {
      // Typo
      setInputVal(val);
      setStreak(0);
      if (navigator.vibrate) navigator.vibrate(20);
      setAccuracy((acc) => Math.max(70, acc - 2));
    }
  };

  const handleFinish = (winnerId: string) => {
    const nextState: TypeRaceGameState = {
      promptText,
      words: promptText.split(" "),
      hostCharIndex: promptText.length,
      guestCharIndex: Math.round((promptText.length * guestProgress) / 100),
      hostWpm: wpm || 65,
      guestWpm: 58,
      hostAccuracy: accuracy,
      guestAccuracy: 95,
      hostFinished: winnerId === room.players.host.id,
      guestFinished: winnerId !== room.players.host.id,
      hostFinishTimeMs: Date.now(),
      guestFinishTimeMs: null,
      startedAt: startTime || Date.now(),
      winner: winnerId,
    };

    if (isLocalMode) {
      onLocalMove?.({
        ...room,
        gameState: nextState,
        winnerId,
        status: "round_over",
      });
    } else {
      sendGameMove(room.roomCode, nextState, room.currentTurn, winnerId, true);
    }
  };

  // Split prompt text for highlighting: correctly typed, current, and remaining
  const matchedChars = inputVal.length;
  const isCurrentlyValid = promptText.startsWith(inputVal);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto p-3 sm:p-4 select-none">
      {/* 1. Dashboard Meters Bar */}
      <div className="w-full flex items-center justify-between bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl p-3 mb-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>Speedometer</span>
            </span>
            <span className="text-2xl font-black text-amber-400">
              {wpm} <span className="text-xs font-normal text-muted-foreground">WPM</span>
            </span>
          </div>

          <div className="h-8 w-px bg-border/60 mx-1" />

          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Accuracy
            </span>
            <span className="text-2xl font-black text-emerald-400">
              {accuracy}%
            </span>
          </div>
        </div>

        {streak >= 15 && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-red-600 text-white font-black text-xs shadow-lg animate-pulse"
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>NITRO BOOST!</span>
          </motion.div>
        )}
      </div>

      {/* 2. Dual-Lane Neon Race Track */}
      <div className="w-full bg-card/60 backdrop-blur-xl border border-border/70 rounded-3xl p-4 mb-3 shadow-2xl overflow-hidden flex flex-col gap-4">
        {/* Lane 1: Host (You) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-bold px-1">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span>{room.players.host.avatar || "👤"}</span>
              <span>{room.players.host.name} (You)</span>
            </span>
            <span className="text-blue-400 font-mono">{hostProgress}%</span>
          </div>

          <div className="relative h-12 w-full bg-muted/40 rounded-2xl border border-border/50 overflow-hidden flex items-center px-2">
            {/* Asphalt road line */}
            <div className="absolute inset-x-0 h-0.5 border-b border-dashed border-white/20 top-1/2 -translate-y-1/2" />

            {/* Finish Line */}
            <div className="absolute right-0 inset-y-0 w-4 bg-[repeating-linear-gradient(45deg,#fff,#fff_4px,#000_4px,#000_8px)] opacity-60" />

            {/* Host Race Car */}
            <motion.div
              className="relative z-10 flex items-center"
              style={{ left: `calc(${hostProgress}% - 40px)` }}
              animate={{ x: 0 }}
              transition={{ ease: "easeOut", duration: 0.2 }}
            >
              <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs shadow-md shadow-blue-500/40 flex items-center gap-1.5 border border-blue-400">
                <Car className="w-4 h-4" />
                <span className="text-[10px]">P1</span>
              </div>
              {streak >= 10 && (
                <span className="text-amber-400 text-sm animate-ping -ml-1">🔥</span>
              )}
            </motion.div>
          </div>
        </div>

        {/* Lane 2: Opponent / AI */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-bold px-1">
            <span className="flex items-center gap-1.5 text-pink-400">
              <span>{room.players.guest?.avatar || "🤖"}</span>
              <span>{room.players.guest?.name || (isAIMode ? "Cyber AI" : "Player 2")}</span>
            </span>
            <span className="text-pink-400 font-mono">{Math.round(guestProgress)}%</span>
          </div>

          <div className="relative h-12 w-full bg-muted/40 rounded-2xl border border-border/50 overflow-hidden flex items-center px-2">
            <div className="absolute inset-x-0 h-0.5 border-b border-dashed border-white/20 top-1/2 -translate-y-1/2" />
            <div className="absolute right-0 inset-y-0 w-4 bg-[repeating-linear-gradient(45deg,#fff,#fff_4px,#000_4px,#000_8px)] opacity-60" />

            {/* Guest Race Car */}
            <motion.div
              className="relative z-10 flex items-center"
              style={{ left: `calc(${guestProgress}% - 40px)` }}
              animate={{ x: 0 }}
              transition={{ ease: "easeOut", duration: 0.2 }}
            >
              <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-black text-xs shadow-md shadow-pink-500/40 flex items-center gap-1.5 border border-pink-400">
                <Car className="w-4 h-4" />
                <span className="text-[10px]">P2</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 3. Target Passage Prompt & Live Highlighting */}
      <div className="w-full bg-card/90 backdrop-blur-xl border border-border/70 rounded-2xl p-4 mb-3 shadow-lg leading-relaxed text-sm font-medium">
        <span className="text-emerald-400 bg-emerald-500/10 px-0.5 rounded">
          {promptText.slice(0, matchedChars)}
        </span>
        <span className="border-b-2 border-primary font-bold text-foreground">
          {promptText.slice(matchedChars, matchedChars + 1)}
        </span>
        <span className="text-muted-foreground/60">
          {promptText.slice(matchedChars + 1)}
        </span>
      </div>

      {/* 4. Type Input Field */}
      <div className="w-full relative">
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={handleInputChange}
          placeholder="Start typing the passage above..."
          className={`w-full h-12 px-4 rounded-xl border-2 bg-background/90 text-foreground font-mono text-sm tracking-wide shadow-inner focus:outline-none transition-all ${
            isCurrentlyValid
              ? "border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
              : "border-red-500 bg-red-500/5 focus:ring-2 focus:ring-red-500/20"
          }`}
        />
        {!isCurrentlyValid && (
          <span className="absolute right-3 top-3.5 text-xs text-red-400 font-bold animate-pulse">
            Fix Typo!
          </span>
        )}
      </div>
    </div>
  );
};
