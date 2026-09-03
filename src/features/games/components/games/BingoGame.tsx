import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameRoomState, BingoGameState } from "../../types";
import { gameAudio } from "../../services/gameSoundService";
import { sendGameMove } from "../../services/gameRoomService";
import {
  Sparkles,
  Zap,
  Trophy,
  Shuffle,
  Flame,
  Check,
  Eye,
  Star,
  Lock,
  LockOpen,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BingoGameProps {
  room: GameRoomState<BingoGameState>;
  myPlayerId: string;
  isMyTurn: boolean;
  onLocalMove?: (updatedRoom: GameRoomState<BingoGameState>) => void;
}

// ── AI Persona Configuration ──

export interface BingoAIPersona {
  id: "lucy" | "baron" | "omega";
  name: string;
  avatar: string;
  title: string;
  color: string;
  quotes: {
    start: string[];
    onCall: string[];
    onLineComplete: string[];
    onOpponentLine: string[];
    onWin: string[];
    onLose: string[];
  };
}

export const BINGO_AI_PERSONAS: Record<string, BingoAIPersona> = {
  lucy: {
    id: "lucy",
    name: "Lucky Lucy",
    avatar: "🍀",
    title: "Casual Caller (Easy)",
    color: "#10b981",
    quotes: {
      start: ["Let's see who has the luck of the draw!", "May the best card win!"],
      onCall: ["Calling my lucky number!", "Hope this one helps both of us!", "Number out!"],
      onLineComplete: ["Yay! That's another line for B-I-N-G-O!", "One step closer to victory!"],
      onOpponentLine: ["Nice line! You're catching up fast!", "Ooh, good call!"],
      onWin: ["BINGO! Woohoo, that was a super fun duel!", "Lucky stars were on my side!"],
      onLose: ["Congratulations! Your card was unbeatable!", "Amazing game, let's rematch!"],
    },
  },
  baron: {
    id: "baron",
    name: "Bingo Baron",
    avatar: "🎩",
    title: "Tactician Caller (Medium)",
    color: "#f59e0b",
    quotes: {
      start: ["Card arranged with mathematical precision. Let us begin.", "Watch the diagonals closely."],
      onCall: ["Calculated number selected.", "Opening strategic intersections.", "Calling this critical tile."],
      onLineComplete: ["Aha! Line secured. The marquee illuminates.", "Another letter crossed."],
      onOpponentLine: ["A commendable line, but my strategy remains superior.", "I anticipated that."],
      onWin: ["BINGO declared! Precision and foresight triumph.", "Flawless card execution."],
      onLose: ["Splendid match! You outmaneuvered the Baron.", "A rare defeat, well earned!"],
    },
  },
  omega: {
    id: "omega",
    name: "Omega Caller",
    avatar: "👑",
    title: "Mastermind Bot (Hard)",
    color: "#ec4899",
    quotes: {
      start: ["Simulating all 12 line intersections. Maximum efficiency engaged.", "Permutations locked."],
      onCall: ["Multi-vector intersection targeted.", "Extracting maximum line synergy.", "Executing prime call."],
      onLineComplete: ["B-I-N-G-O sequence progressing at 98.4% efficiency.", "Line captured."],
      onOpponentLine: ["Minor line completed by opponent. Adjusting vector matrix.", "Calculated in probability model."],
      onWin: ["BINGO! 5 lines verified. Absolute victory achieved.", "Statistical supremacy confirmed."],
      onLose: ["Anomalous line sequence observed. Outstanding execution, human.", "Remarkable victory."],
    },
  },
};

// ── Line Detection Algorithm ──

export interface BingoLinesResult {
  completedLineIds: string[];
  count: number;
}

export function calculateBingoLines(card: number[][], stampedNumbers: number[]): BingoLinesResult {
  if (!card || card.length !== 5) return { completedLineIds: [], count: 0 };
  const stampedSet = new Set(stampedNumbers);
  const completed: string[] = [];

  // 1. Check 5 Rows
  for (let r = 0; r < 5; r++) {
    let rowComplete = true;
    for (let c = 0; c < 5; c++) {
      if (!stampedSet.has(card[r][c])) {
        rowComplete = false;
        break;
      }
    }
    if (rowComplete) completed.push(`row-${r}`);
  }

  // 2. Check 5 Columns
  for (let c = 0; c < 5; c++) {
    let colComplete = true;
    for (let r = 0; r < 5; r++) {
      if (!stampedSet.has(card[r][c])) {
        colComplete = false;
        break;
      }
    }
    if (colComplete) completed.push(`col-${c}`);
  }

  // 3. Check Main Diagonal ↘
  let diagMainComplete = true;
  for (let i = 0; i < 5; i++) {
    if (!stampedSet.has(card[i][i])) {
      diagMainComplete = false;
      break;
    }
  }
  if (diagMainComplete) completed.push("diag-main");

  // 4. Check Anti Diagonal ↗
  let diagAntiComplete = true;
  for (let i = 0; i < 5; i++) {
    if (!stampedSet.has(card[i][4 - i])) {
      diagAntiComplete = false;
      break;
    }
  }
  if (diagAntiComplete) completed.push("diag-anti");

  return {
    completedLineIds: completed,
    count: completed.length,
  };
}

// ── Smart AI Opponent for Bingo ──

export function getSmartBingoAIMove(
  aiCard: number[][],
  stampedNumbers: number[],
  difficulty: "easy" | "medium" | "hard" = "medium"
): number {
  const stampedSet = new Set(stampedNumbers);
  const unstampedNumbers: number[] = [];

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const num = aiCard[r][c];
      if (!stampedSet.has(num)) {
        unstampedNumbers.push(num);
      }
    }
  }

  if (unstampedNumbers.length === 0) return 1;

  // Easy mode: Random call
  if (difficulty === "easy" && Math.random() < 0.65) {
    return unstampedNumbers[Math.floor(Math.random() * unstampedNumbers.length)];
  }

  // Medium mode: 30% random
  if (difficulty === "medium" && Math.random() < 0.3) {
    return unstampedNumbers[Math.floor(Math.random() * unstampedNumbers.length)];
  }

  // Hard mode: Evaluate lines that are closest to completion (4/5 or 3/5)
  let bestScore = -1;
  let bestNumbers: number[] = [];

  for (const num of unstampedNumbers) {
    const simulated = [...stampedNumbers, num];
    const { count } = calculateBingoLines(aiCard, simulated);

    let lineContribution = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (aiCard[r][c] === num) {
          const rowUnstamped = aiCard[r].filter((n) => !stampedSet.has(n)).length;
          if (rowUnstamped === 1) lineContribution += 60;
          else if (rowUnstamped === 2) lineContribution += 20;

          let colUnstamped = 0;
          for (let rowIdx = 0; rowIdx < 5; rowIdx++) {
            if (!stampedSet.has(aiCard[rowIdx][c])) colUnstamped++;
          }
          if (colUnstamped === 1) lineContribution += 60;
          else if (colUnstamped === 2) lineContribution += 20;

          if (r === c) {
            let diag1Unstamped = 0;
            for (let i = 0; i < 5; i++) {
              if (!stampedSet.has(aiCard[i][i])) diag1Unstamped++;
            }
            if (diag1Unstamped === 1) lineContribution += 60;
            else if (diag1Unstamped === 2) lineContribution += 20;
          }

          if (r + c === 4) {
            let diag2Unstamped = 0;
            for (let i = 0; i < 5; i++) {
              if (!stampedSet.has(aiCard[i][4 - i])) diag2Unstamped++;
            }
            if (diag2Unstamped === 1) lineContribution += 60;
            else if (diag2Unstamped === 2) lineContribution += 20;
          }
        }
      }
    }

    const totalWeight = count * 100 + lineContribution;
    if (totalWeight > bestScore) {
      bestScore = totalWeight;
      bestNumbers = [num];
    } else if (totalWeight === bestScore) {
      bestNumbers.push(num);
    }
  }

  if (bestNumbers.length > 0) {
    return bestNumbers[Math.floor(Math.random() * bestNumbers.length)];
  }

  return unstampedNumbers[0];
}

export function generateRandomBingoCard(): number[][] {
  const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  const card: number[][] = [];
  for (let r = 0; r < 5; r++) {
    card.push(numbers.slice(r * 5, (r + 1) * 5));
  }
  return card;
}

// ── Main Bingo Blitz Duel Deluxe Component ──

export const BingoGame: React.FC<BingoGameProps> = ({ room, myPlayerId, isMyTurn, onLocalMove }) => {
  const rawState = room.gameState;

  const isHost = room.players.host.id === myPlayerId;
  const isAIMode = room.mode === "ai";
  const isLocalMode = room.mode === "local";

  const hostCard: number[][] = useMemo(() => {
    if (rawState?.hostCard && Array.isArray(rawState.hostCard) && rawState.hostCard.length === 5) {
      return rawState.hostCard;
    }
    return generateRandomBingoCard();
  }, [rawState?.hostCard]);

  const guestCard: number[][] = useMemo(() => {
    if (rawState?.guestCard && Array.isArray(rawState.guestCard) && rawState.guestCard.length === 5) {
      return rawState.guestCard;
    }
    return generateRandomBingoCard();
  }, [rawState?.guestCard]);

  const myCard = isHost || isAIMode ? hostCard : guestCard;
  const opponentCard = isHost || isAIMode ? guestCard : hostCard;

  const stampedNumbers: number[] = useMemo(() => {
    return Array.isArray(rawState?.stampedNumbers) ? rawState.stampedNumbers : [];
  }, [rawState?.stampedNumbers]);

  const stampedSet = useMemo(() => new Set(stampedNumbers), [stampedNumbers]);
  const lastCalledNumber = rawState?.lastCalledNumber ?? null;

  // Calculate Lines & B-I-N-G-O progression
  const hostLinesResult = useMemo(() => calculateBingoLines(hostCard, stampedNumbers), [hostCard, stampedNumbers]);
  const guestLinesResult = useMemo(() => calculateBingoLines(guestCard, stampedNumbers), [guestCard, stampedNumbers]);

  const myLinesResult = isHost || isAIMode ? hostLinesResult : guestLinesResult;
  const opponentLinesResult = isHost || isAIMode ? guestLinesResult : hostLinesResult;

  const [hoverNumber, setHoverNumber] = useState<number | null>(null);
  const [showOpponentRadar, setShowOpponentRadar] = useState(false);
  const [unlockedLetterBanner, setUnlockedLetterBanner] = useState<string | null>(null);
  const [wildStampActive, setWildStampActive] = useState(false);
  const [aiSpeech, setAiSpeech] = useState<string | null>(null);

  const BINGO_LETTERS = ["B", "I", "N", "G", "O"];

  const hostColor = "#06b6d4"; // Cyan
  const guestColor = "#f43f5e"; // Rose Pink
  const currentTurnColor = room.currentTurn === room.players.host.id ? hostColor : guestColor;

  const aiDifficulty = room.rules?.aiDifficulty || "medium";
  const personaKey = aiDifficulty === "easy" ? "lucy" : aiDifficulty === "hard" ? "omega" : "baron";
  const aiPersona = BINGO_AI_PERSONAS[personaKey];

  const activePlayerName = room.currentTurn === room.players.host.id
    ? room.players.host.name
    : room.players.guest?.name || (isAIMode ? aiPersona.name : "Player 2");

  // AI Dialogue trigger
  const triggerAiSpeech = useCallback((type: "onCall" | "onLineComplete" | "onOpponentLine") => {
    if (!isAIMode) return;
    const quotes = aiPersona.quotes[type];
    if (!quotes || quotes.length === 0) return;
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    setAiSpeech(quote);
    setTimeout(() => setAiSpeech(null), 3000);
  }, [isAIMode, aiPersona]);

  // Call number handler
  const handleCallNumber = useCallback(async (num: number, isWildExtra = false) => {
    if (stampedSet.has(num) || room.status === "round_over" || room.status === "game_over") return;

    const isCurrentlyAITurn = isAIMode && room.currentTurn !== room.players.host.id;
    if (!isLocalMode) {
      if (isAIMode) {
        if (!isMyTurn && !isCurrentlyAITurn) return;
      } else {
        if (!isMyTurn) return;
      }
    }

    const actingPlayerId = isLocalMode || isCurrentlyAITurn ? room.currentTurn : myPlayerId;
    const nextStamped = [...stampedNumbers, num];

    // Audio cues
    gameAudio.playBingoCall();
    gameAudio.playBingoStamp();

    // Recalculate lines
    const nextHostRes = calculateBingoLines(hostCard, nextStamped);
    const nextGuestRes = calculateBingoLines(guestCard, nextStamped);

    const prevMyLines = isHost ? hostLinesResult.count : guestLinesResult.count;
    const newMyLines = isHost ? nextHostRes.count : nextGuestRes.count;

    if (newMyLines > prevMyLines) {
      gameAudio.playBingoLetterUnlock(newMyLines);
      const letterUnlocked = BINGO_LETTERS[Math.min(newMyLines - 1, 4)];
      setUnlockedLetterBanner(`🎉 Unlocked [ ${letterUnlocked} ]! (${newMyLines}/5 Lines)`);
      setTimeout(() => setUnlockedLetterBanner(null), 2500);

      if (actingPlayerId === room.players.host.id) {
        triggerAiSpeech("onOpponentLine");
      } else {
        triggerAiSpeech("onLineComplete");
      }
    } else if (actingPlayerId !== room.players.host.id) {
      triggerAiSpeech("onCall");
    }

    // Check B-I-N-G-O Win Condition (5 completed lines)
    const isHostWon = nextHostRes.count >= 5;
    const isGuestWon = nextGuestRes.count >= 5;
    const isOver = isHostWon || isGuestWon || nextStamped.length >= 25;

    let winnerPlayerId: string | null = null;
    let nextHostScore = room.players.host.score;
    let nextGuestScore = room.players.guest?.score || 0;

    if (isOver) {
      if (isHostWon && isGuestWon) {
        winnerPlayerId = "draw";
      } else if (isHostWon) {
        winnerPlayerId = room.players.host.id;
        nextHostScore += 1;
        gameAudio.playBingoWinFanfare();
      } else if (isGuestWon) {
        winnerPlayerId = room.players.guest?.id || "guest_player";
        nextGuestScore += 1;
        gameAudio.playBingoWinFanfare();
      } else {
        winnerPlayerId = "draw";
      }
    }

    // If wild extra stamp, turn stays with caller
    const nextTurnId = isWildExtra
      ? actingPlayerId
      : actingPlayerId === room.players.host.id
      ? room.players.guest?.id || "guest_player"
      : room.players.host.id;

    if (wildStampActive) setWildStampActive(false);

    const updatedGameState: BingoGameState = {
      hostCard,
      guestCard,
      stampedNumbers: nextStamped,
      calledHistory: [
        ...(rawState?.calledHistory || []),
        { number: num, calledBy: actingPlayerId, timestamp: Date.now() },
      ],
      hostLines: nextHostRes.count,
      guestLines: nextGuestRes.count,
      hostCompletedLines: nextHostRes.completedLineIds,
      guestCompletedLines: nextGuestRes.completedLineIds,
      lastCalledNumber: num,
      isCardLocked: true,
    };

    const nextRoomState: GameRoomState<BingoGameState> = {
      ...room,
      gameState: updatedGameState,
      currentTurn: nextTurnId,
      status: isOver ? "round_over" : "playing",
      winnerId: winnerPlayerId,
      lastMoveTimestamp: Date.now(),
      players: {
        host: {
          ...room.players.host,
          score: nextHostScore,
        },
        guest: room.players.guest
          ? {
              ...room.players.guest,
              score: nextGuestScore,
            }
          : null,
      },
    };

    if (isLocalMode || isAIMode) {
      onLocalMove?.(nextRoomState);
    } else {
      await sendGameMove(
        room.roomCode,
        updatedGameState,
        nextTurnId,
        winnerPlayerId,
        isOver,
        nextHostScore,
        nextGuestScore,
        room.rules?.turnTimerSeconds || 0,
        room.rules?.maxSeriesWins || 2
      );
    }
  }, [
    stampedSet,
    stampedNumbers,
    hostCard,
    guestCard,
    hostLinesResult.count,
    guestLinesResult.count,
    isHost,
    room,
    isLocalMode,
    isAIMode,
    isMyTurn,
    myPlayerId,
    wildStampActive,
    onLocalMove,
    rawState?.calledHistory,
    BINGO_LETTERS,
    triggerAiSpeech,
  ]);

  // AI Opponent auto-trigger
  const isAITurn = isAIMode && room.status === "playing" && room.currentTurn !== room.players.host.id;
  useEffect(() => {
    if (!isAITurn) return;

    const timer = setTimeout(() => {
      const aiNumber = getSmartBingoAIMove(guestCard, stampedNumbers, aiDifficulty);
      handleCallNumber(aiNumber);
    }, 650 + Math.random() * 400);

    return () => clearTimeout(timer);
  }, [isAITurn, guestCard, stampedNumbers, aiDifficulty, handleCallNumber]);

  // Reshuffle card
  const handleReshuffleCard = () => {
    if (stampedNumbers.length > 0) return;
    const newCard = generateRandomBingoCard();
    const updatedState: BingoGameState = {
      ...rawState,
      hostCard: isHost || isLocalMode ? newCard : hostCard,
      guestCard: !isHost && !isLocalMode ? newCard : guestCard,
      stampedNumbers: [],
      calledHistory: [],
      hostLines: 0,
      guestLines: 0,
      hostCompletedLines: [],
      guestCompletedLines: [],
      lastCalledNumber: null,
      isCardLocked: false,
    };
    onLocalMove?.({
      ...room,
      gameState: updatedState,
    });
    gameAudio.playClick();
  };

  // Recent called numbers history list
  const recentCalls = useMemo(() => {
    return stampedNumbers.slice(-4).reverse();
  }, [stampedNumbers]);

  // SVG Golden Line Lasers Overlay
  const renderCompletedLineLasers = () => {
    return myLinesResult.completedLineIds.map((lineId) => {
      let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

      if (lineId.startsWith("row-")) {
        const r = parseInt(lineId.replace("row-", ""), 10);
        y1 = ((r + 0.5) / 5) * 100;
        y2 = y1;
        x1 = 5;
        x2 = 95;
      } else if (lineId.startsWith("col-")) {
        const c = parseInt(lineId.replace("col-", ""), 10);
        x1 = ((c + 0.5) / 5) * 100;
        x2 = x1;
        y1 = 5;
        y2 = 95;
      } else if (lineId === "diag-main") {
        x1 = 5;
        y1 = 5;
        x2 = 95;
        y2 = 95;
      } else if (lineId === "diag-anti") {
        x1 = 95;
        y1 = 5;
        x2 = 5;
        y2 = 95;
      }

      return (
        <g key={lineId} className="pointer-events-none">
          {/* Golden Laser Glow */}
          <line
            x1={`${x1}%`}
            y1={`${y1}%`}
            x2={`${x2}%`}
            y2={`${y2}%`}
            stroke="#f59e0b"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.4"
            style={{ filter: "blur(5px)" }}
          />
          {/* Bright Core Laser */}
          <motion.line
            x1={`${x1}%`}
            y1={`${y1}%`}
            x2={`${x2}%`}
            y2={`${y2}%`}
            stroke="#fef08a"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </g>
      );
    });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-2 select-none">
      {/* ── B - I - N - G - O Marquee Tracker ── */}
      <div className="w-full mb-3 p-3 rounded-2xl bg-card/75 backdrop-blur-md border border-border/60 shadow-lg flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-2 px-1 text-xs font-bold text-muted-foreground">
          <span>{isLocalMode ? activePlayerName : isMyTurn ? "Your Card" : "Opponent Calling..."}</span>
          <span className="text-amber-400 font-extrabold flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> 5 Lines = BINGO!
          </span>
        </div>

        {/* 5 Glowing B-I-N-G-O Letter Tiles */}
        <div className="flex items-center justify-center gap-2 w-full max-w-xs">
          {BINGO_LETTERS.map((letter, idx) => {
            const isUnlocked = myLinesResult.count > idx;
            return (
              <motion.div
                key={letter}
                animate={isUnlocked ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : {}}
                transition={{ duration: 0.35 }}
                className={`flex-1 aspect-square max-w-[52px] rounded-xl flex flex-col items-center justify-center font-black text-xl border transition-all ${
                  isUnlocked
                    ? "bg-gradient-to-br from-amber-400 to-yellow-500 border-amber-300 text-slate-950 shadow-[0_0_18px_rgba(245,158,11,0.7)] scale-105"
                    : "bg-muted/40 border-border/60 text-muted-foreground/50"
                }`}
              >
                <span>{letter}</span>
                <span className="text-[9px] font-mono tracking-tighter opacity-80">{idx + 1}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── 3D Calling Ball Marquee & Recent Calls Ribbon ── */}
      <div className="w-full flex items-center justify-between mb-3 px-3 py-2 rounded-2xl bg-card/60 backdrop-blur-md border border-border/50 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <div
            className="w-3 h-3 rounded-full animate-pulse shadow-sm"
            style={{ backgroundColor: currentTurnColor, boxShadow: `0 0 10px ${currentTurnColor}` }}
          />
          {room.status === "round_over" || room.status === "game_over" ? (
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Bingo Complete!
            </span>
          ) : isMyTurn ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Pick a Number to Call!
            </span>
          ) : (
            <span>Waiting for <strong className="text-foreground">{activePlayerName}</strong>...</span>
          )}
        </div>

        {/* 3D Billiard Ball Display */}
        {lastCalledNumber ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono hidden sm:flex">
              {recentCalls.slice(1).map((n) => (
                <span key={n} className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/40">
                  {n}
                </span>
              ))}
            </div>

            <motion.div
              key={lastCalledNumber}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 450, damping: 20 }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-3 py-1 rounded-full border border-amber-400/60 shadow-sm"
            >
              <span className="text-[10px] font-bold text-amber-300">Call:</span>
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-[0_0_10px_rgba(245,158,11,0.6)]">
                {lastCalledNumber}
              </span>
            </motion.div>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground font-mono">No calls yet</span>
        )}
      </div>

      {/* ── AI Persona Dialogue Banner ── */}
      {isAIMode && (
        <div className="w-full mb-3 flex items-center gap-2 p-2 rounded-xl bg-card/50 border border-border/40 backdrop-blur-sm">
          <span className="text-2xl">{aiPersona.avatar}</span>
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between text-[11px]">
              <strong style={{ color: aiPersona.color }}>{aiPersona.name}</strong>
              <span className="text-[10px] text-muted-foreground font-mono">{aiPersona.title}</span>
            </div>
            <p className="text-xs text-foreground/90 font-medium italic mt-0.5 truncate">
              "{aiSpeech || aiPersona.quotes.start[0]}"
            </p>
          </div>
        </div>
      )}

      {/* Floating Letter Unlock Notice */}
      <AnimatePresence>
        {unlockedLetterBanner && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="absolute z-40 top-20 px-4 py-1.5 rounded-full font-black text-xs sm:text-sm tracking-wide shadow-2xl bg-amber-400 text-slate-950 border border-amber-300 flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.6)]"
          >
            <Flame className="w-4 h-4 animate-bounce" />
            {unlockedLetterBanner}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 5x5 Bingo Card Board with SVG Lasers ── */}
      <div className="relative w-full aspect-square max-w-[min(380px,calc(100vw-2rem))] bg-card/75 backdrop-blur-2xl p-2 sm:p-3 rounded-2xl sm:rounded-3xl border-2 border-border/80 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center">
        {/* Dynamic Golden Laser Lines Layer */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {renderCompletedLineLasers()}
        </svg>

        {/* 5x5 Grid Cells */}
        <div className="w-full h-full grid grid-cols-5 grid-rows-5 gap-1.5 sm:gap-2">
          {myCard.map((row, r) =>
            row.map((num, c) => {
              const isStamped = stampedSet.has(num);
              const isHovered = hoverNumber === num;
              const isLatestCall = lastCalledNumber === num;

              return (
                <motion.button
                  key={`${r}-${c}-${num}`}
                  type="button"
                  whileHover={{ scale: isStamped ? 1 : 1.06 }}
                  whileTap={{ scale: isStamped ? 1 : 0.94 }}
                  onMouseEnter={() => setHoverNumber(num)}
                  onMouseLeave={() => setHoverNumber(null)}
                  onClick={() => handleCallNumber(num, wildStampActive)}
                  disabled={isStamped || (room.mode !== "local" && !isMyTurn)}
                  className={`relative flex items-center justify-center rounded-xl font-black text-lg sm:text-xl transition-all duration-150 ${
                    isStamped
                      ? "bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                      : isLatestCall
                      ? "bg-amber-500/25 border-2 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                      : wildStampActive
                      ? "bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400 text-purple-200 cursor-pointer animate-pulse"
                      : "bg-background/50 hover:bg-muted/60 border border-border/50 text-foreground cursor-pointer"
                  }`}
                >
                  <span className={isStamped ? "opacity-40" : "font-extrabold"}>{num}</span>

                  {/* Stamped Checkmark Overlay */}
                  {isStamped && (
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 450, damping: 20 }}
                      className="absolute inset-0 flex items-center justify-center text-emerald-400 pointer-events-none"
                    >
                      <Check className="w-6 h-6 stroke-[3.5]" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Pre-Game Shuffle & In-Game Options ── */}
      <div className="w-full flex items-center justify-between mt-3 px-1">
        {stampedNumbers.length === 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReshuffleCard}
            className="flex items-center gap-1.5 text-xs rounded-xl bg-card/60 hover:bg-muted/80 border-border/60"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto-Shuffle Card</span>
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Wild Star Stamp (Stamp 1 free tile)"
              onClick={() => {
                setWildStampActive(!wildStampActive);
                if (!wildStampActive) gameAudio.playPowerUpTrigger();
              }}
              className={`flex items-center gap-1 py-1 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                wildStampActive
                  ? "bg-purple-500/30 border-purple-400 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.5)] scale-105"
                  : "bg-card/40 border-border/60 text-purple-400 hover:bg-purple-500/10"
              }`}
            >
              <Star className="w-3.5 h-3.5 text-purple-400" />
              <span>Wild Stamp</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowOpponentRadar(!showOpponentRadar)}
            className="flex items-center gap-1 text-xs rounded-xl text-muted-foreground hover:text-foreground"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showOpponentRadar ? "Hide Radar" : "Opponent Radar"}</span>
          </Button>
        </div>
      </div>

      {/* ── Opponent Mini Radar Modal ── */}
      <AnimatePresence>
        {showOpponentRadar && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full mt-3 p-3 rounded-2xl bg-card/90 border border-border/80 backdrop-blur-xl shadow-xl flex flex-col items-center"
          >
            <div className="flex items-center justify-between w-full mb-2 text-xs font-bold">
              <span className="text-rose-400">Opponent Stamp Progress ({opponentLinesResult.count}/5 Lines)</span>
              <span className="text-muted-foreground text-[10px]">Realtime sync</span>
            </div>
            <div className="grid grid-cols-5 grid-rows-5 gap-1 w-full max-w-[200px] aspect-square">
              {opponentCard.map((row, r) =>
                row.map((num, c) => {
                  const isStamped = stampedSet.has(num);
                  return (
                    <div
                      key={`opp-${r}-${c}`}
                      className={`flex items-center justify-center rounded-md text-[10px] font-bold ${
                        isStamped
                          ? "bg-rose-500/30 border border-rose-400 text-rose-300"
                          : "bg-muted/40 border border-border/40 text-muted-foreground/60"
                      }`}
                    >
                      {num}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
