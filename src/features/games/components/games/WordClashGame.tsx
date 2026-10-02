import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameRoomState, WordClashGameState, WordTileResult, WordClashAttempt } from "../../types";
import { gameAudio } from "../../services/gameSoundService";
import { sendGameMove } from "../../services/gameRoomService";
import {
  Trophy,
  Sparkles,
  Zap,
  HelpCircle,
  Delete,
  Check,
  RotateCcw,
  Bot,
} from "lucide-react";

interface WordClashGameProps {
  room: GameRoomState<WordClashGameState>;
  myPlayerId: string;
  isMyTurn: boolean;
  onLocalMove?: (updatedRoom: GameRoomState<WordClashGameState>) => void;
}

const WORD_BANK = [
  "REACT", "CYBER", "FLAME", "PIXEL", "LASER", "NEONS", "RADAR", "TURBO", "CHAMP",
  "GHOST", "BLAST", "POWER", "SONIC", "GLIDE", "STORM", "ALPHA", "BRAVO", "TITAN",
  "SPEED", "SPARK", "VORTX", "NINJA", "MAGIC", "SWORD", "QUEST", "SMART", "BRAIN"
];

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

export const WordClashGame: React.FC<WordClashGameProps> = ({
  room,
  myPlayerId,
  isMyTurn,
  onLocalMove,
}) => {
  const isHost = room.players.host.id === myPlayerId;
  const isAIMode = room.mode === "ai";
  const isLocalMode = room.mode === "local";

  const rawState = room.gameState as any;
  const targetWord = (rawState?.targetWord || "REACT").toUpperCase();
  const clueHint = rawState?.clueHint || "Tech & Arcade Duel";

  const [currentGuess, setCurrentGuess] = useState("");
  const [hostAttempts, setHostAttempts] = useState<WordClashAttempt[]>(rawState?.hostAttempts || []);
  const [guestAttempts, setGuestAttempts] = useState<WordClashAttempt[]>(rawState?.guestAttempts || []);
  const [shakeError, setShakeError] = useState(false);
  const aiThinkingRef = useRef(false);

  // Evaluate letter matches against target
  const evaluateGuess = (guess: string, target: string): WordTileResult[] => {
    const results: WordTileResult[] = Array(5).fill("absent");
    const targetLetters = target.split("");
    const guessLetters = guess.split("");

    // 1. Mark greens (correct)
    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        results[i] = "correct";
        targetLetters[i] = ""; // Consume
        guessLetters[i] = "";
      }
    }

    // 2. Mark yellows (present)
    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] && targetLetters.includes(guessLetters[i])) {
        results[i] = "present";
        const idx = targetLetters.indexOf(guessLetters[i]);
        targetLetters[idx] = ""; // Consume
      }
    }

    return results;
  };

  // Keyboard letter colors from previous attempts
  const letterStatuses = useMemo(() => {
    const map: Record<string, WordTileResult> = {};
    const myAttempts = isHost ? hostAttempts : guestAttempts;

    myAttempts.forEach((attempt) => {
      attempt.word.split("").forEach((char, idx) => {
        const res = attempt.result[idx];
        const existing = map[char];
        if (res === "correct") {
          map[char] = "correct";
        } else if (res === "present" && existing !== "correct") {
          map[char] = "present";
        } else if (!existing) {
          map[char] = "absent";
        }
      });
    });

    return map;
  }, [hostAttempts, guestAttempts, isHost]);

  // Handle key press
  const handleKey = useCallback(
    (key: string) => {
      if (room.status === "round_over" || room.status === "game_over") return;

      if (key === "BACKSPACE") {
        setCurrentGuess((prev) => prev.slice(0, -1));
        gameAudio.playClick();
      } else if (key === "ENTER") {
        if (currentGuess.length !== 5) {
          setShakeError(true);
          setTimeout(() => setShakeError(false), 500);
          return;
        }

        // Submit guess
        const evalResult = evaluateGuess(currentGuess, targetWord);
        const newAttempt: WordClashAttempt = {
          word: currentGuess,
          result: evalResult,
          timestamp: Date.now(),
        };

        const nextHostAttempts = isHost ? [...hostAttempts, newAttempt] : hostAttempts;
        const nextGuestAttempts = !isHost ? [...guestAttempts, newAttempt] : guestAttempts;

        if (isHost) setHostAttempts(nextHostAttempts);
        else setGuestAttempts(nextGuestAttempts);

        setCurrentGuess("");

        const isWin = currentGuess === targetWord;
        const isMaxReached = (isHost ? nextHostAttempts.length : nextGuestAttempts.length) >= 6;

        if (isWin) {
          gameAudio.playWin();
          if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
        } else {
          gameAudio.playMove();
        }

        const isComplete = isWin || isMaxReached;
        const winnerId = isWin ? (isHost ? room.players.host.id : room.players.guest?.id || "guest") : null;

        const nextState: WordClashGameState = {
          targetWord,
          clueHint,
          hostAttempts: nextHostAttempts,
          guestAttempts: nextGuestAttempts,
          hostCurrentWord: "",
          guestCurrentWord: "",
          maxAttempts: 6,
          hostWon: isHost && isWin,
          guestWon: !isHost && isWin,
          revealed: isComplete,
          winner: winnerId,
        };

        if (isLocalMode) {
          onLocalMove?.({
            ...room,
            gameState: nextState,
            winnerId,
            status: isComplete ? "round_over" : "playing",
          });
        } else {
          sendGameMove(room.roomCode, nextState, room.currentTurn, winnerId, isComplete);
        }
      } else if (/^[A-Z]$/.test(key)) {
        if (currentGuess.length < 5) {
          setCurrentGuess((prev) => prev + key);
          gameAudio.playClick();
        }
      }
    },
    [currentGuess, targetWord, isHost, hostAttempts, guestAttempts, isLocalMode, room, clueHint, onLocalMove]
  );

  // Physical keyboard listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === "ENTER" || key === "BACKSPACE" || /^[A-Z]$/.test(key)) {
        handleKey(key);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  // AI Opponent Turn Generator
  useEffect(() => {
    if (!isAIMode) return;
    if (room.status === "round_over" || room.status === "game_over") return;
    if (aiThinkingRef.current) return;
    if (guestAttempts.length >= hostAttempts.length) return; // Wait for player

    aiThinkingRef.current = true;
    const aiTimer = setTimeout(() => {
      // Pick next smart word from word bank
      const unattempted = WORD_BANK.filter((w) => !guestAttempts.some((a) => a.word === w));
      const pick = unattempted[Math.floor(Math.random() * unattempted.length)] || "TURBO";
      const evalRes = evaluateGuess(pick, targetWord);

      const nextGuestAttempts = [...guestAttempts, { word: pick, result: evalRes, timestamp: Date.now() }];
      setGuestAttempts(nextGuestAttempts);

      aiThinkingRef.current = false;
      if (pick === targetWord) {
        handleKey("ENTER"); // Trigger win check
      }
    }, 1200);

    return () => clearTimeout(aiTimer);
  }, [isAIMode, hostAttempts, guestAttempts, targetWord, room.status, handleKey]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto p-3 sm:p-4 select-none">
      {/* 1. Header with Clue Hint */}
      <div className="w-full flex items-center justify-between bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl p-3 mb-3 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔤</span>
          <div>
            <div className="text-xs font-bold text-foreground">Word Clash 1v1</div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Hint: {clueHint}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          <span className="text-blue-400">P1: {hostAttempts.length}/6</span>
          <span className="text-muted-foreground">vs</span>
          <span className="text-pink-400">P2: {guestAttempts.length}/6</span>
        </div>
      </div>

      {/* 2. 6x5 Wordle Matrix (Host Grid) */}
      <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/70 shadow-2xl mb-4">
        {Array.from({ length: 6 }).map((_, rowIdx) => {
          const attempt = hostAttempts[rowIdx];
          const isCurrentRow = rowIdx === hostAttempts.length;

          return (
            <div
              key={rowIdx}
              className={`flex gap-1.5 ${isCurrentRow && shakeError ? "animate-shake" : ""}`}
            >
              {Array.from({ length: 5 }).map((_, colIdx) => {
                let letter = "";
                let status: WordTileResult | "empty" = "empty";

                if (attempt) {
                  letter = attempt.word[colIdx] || "";
                  status = attempt.result[colIdx];
                } else if (isCurrentRow) {
                  letter = currentGuess[colIdx] || "";
                }

                let tileBg = "bg-muted/30 border-border/60 text-foreground";
                if (status === "correct") {
                  tileBg = "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30";
                } else if (status === "present") {
                  tileBg = "bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/30";
                } else if (status === "absent") {
                  tileBg = "bg-zinc-800/80 border-zinc-700 text-zinc-400";
                }

                return (
                  <motion.div
                    key={colIdx}
                    initial={false}
                    animate={letter ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ duration: 0.15 }}
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-lg border-2 transition-all ${tileBg}`}
                  >
                    {letter}
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* 3. Virtual Neon Keyboard */}
      <div className="w-full flex flex-col gap-1.5 px-1 max-w-sm">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1">
            {row.map((k) => {
              const status = letterStatuses[k];
              let keyStyle = "bg-card/90 text-foreground border-border/70 hover:bg-muted";
              if (status === "correct") keyStyle = "bg-emerald-500 text-white border-emerald-400";
              else if (status === "present") keyStyle = "bg-amber-500 text-white border-amber-400";
              else if (status === "absent") keyStyle = "bg-zinc-900 text-zinc-600 border-zinc-800";

              const isWide = k === "ENTER" || k === "BACKSPACE";

              return (
                <button
                  key={k}
                  onClick={() => handleKey(k)}
                  className={`h-11 rounded-lg font-bold text-xs sm:text-sm border shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95 ${keyStyle} ${
                    isWide ? "px-2 text-[10px] sm:text-xs font-black min-w-[50px]" : "w-8 sm:w-9"
                  }`}
                >
                  {k === "BACKSPACE" ? <Delete className="w-4 h-4" /> : k}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
