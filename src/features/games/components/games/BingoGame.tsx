import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameRoomState, BingoGameState } from "../../types";
import { gameAudio } from "../../services/gameSoundService";
import { gameHaptics } from "../../services/gameHapticsService";
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
  Wand2,
  Trash2,
  Shield,
  ArrowRight,
  Gamepad2,
  CheckCircle2,
  RotateCcw,
  ArrowLeftRight,
  ListOrdered,
  Layers,
  Undo2,
  X,
  Clock,
  AlertTriangle,
  Move,
  Grab,
  PenTool,
} from "lucide-react";
import { toast } from "sonner";
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

export const DEFAULT_BINGO_TURN_TIMER = 15;

/**
 * Smart AFK Auto-Call helper for Bingo:
 * Returns the strategic optimal unstamped tile to advance completed lines.
 */
export function getBingoAFKAutoMove(
  card: number[][],
  stampedNumbers: number[]
): number {
  return getSmartBingoAIMove(card, stampedNumbers, "hard");
}

// ── Card Creation, Normalization & Customization Utilities ──

export function createEmptyBingoCard(): number[][] {
  return Array.from({ length: 5 }, () => Array(5).fill(0));
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

export function generateSequentialBingoCard(direction: "rows" | "cols" = "rows"): number[][] {
  const card: number[][] = [];
  if (direction === "rows") {
    let n = 1;
    for (let r = 0; r < 5; r++) {
      const row: number[] = [];
      for (let c = 0; c < 5; c++) {
        row.push(n++);
      }
      card.push(row);
    }
  } else {
    for (let r = 0; r < 5; r++) {
      const row: number[] = [];
      for (let c = 0; c < 5; c++) {
        row.push(c * 5 + r + 1);
      }
      card.push(row);
    }
  }
  return card;
}

export function generateSpiralBingoCard(): number[][] {
  const card = Array.from({ length: 5 }, () => Array(5).fill(0));
  let top = 0;
  let bottom = 4;
  let left = 0;
  let right = 4;
  let num = 1;

  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) card[top][c] = num++;
    top++;
    for (let r = top; r <= bottom; r++) card[r][right] = num++;
    right--;
    if (top <= bottom) {
      for (let c = right; c >= left; c--) card[bottom][c] = num++;
      bottom--;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r--) card[r][left] = num++;
      left++;
    }
  }
  return card;
}

export function validateBingoCard(card: number[][]): boolean {
  if (!card || !Array.isArray(card) || card.length !== 5) return false;
  const flat = card.flat();
  if (flat.length !== 25) return false;
  const unique = new Set<number>();
  for (const num of flat) {
    if (typeof num !== "number" || num < 1 || num > 25 || unique.has(num)) {
      return false;
    }
    unique.add(num);
  }
  return unique.size === 25;
}

export function autoFillRemainingCard(partialCard: number[][]): number[][] {
  const current =
    partialCard && Array.isArray(partialCard) && partialCard.length === 5
      ? partialCard.map((row) => (Array.isArray(row) ? [...row] : Object.values(row || {})))
      : createEmptyBingoCard();

  const used = new Set<number>();
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const val = Number(current[r]?.[c] || 0);
      if (val >= 1 && val <= 25) {
        used.add(val);
      }
    }
  }

  const unused: number[] = [];
  for (let i = 1; i <= 25; i++) {
    if (!used.has(i)) unused.push(i);
  }

  // Shuffle unused
  for (let i = unused.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unused[i], unused[j]] = [unused[j], unused[i]];
  }

  let unusedIdx = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const val = Number(current[r]?.[c] || 0);
      if (val < 1 || val > 25) {
        current[r][c] = unused[unusedIdx++] || 1;
      }
    }
  }

  return current;
}

export function normalizeBingoCard(card: any): number[][] | null {
  if (!card) return null;
  if (Array.isArray(card) && card.length === 5) {
    return card.map((row) => (Array.isArray(row) ? row : Object.values(row || {})));
  }
  if (typeof card === "object") {
    const rows = Object.values(card);
    if (rows.length === 5) {
      return rows.map((row) => (Array.isArray(row) ? row : Object.values(row || {})));
    }
  }
  return null;
}

// ── Drag Types ──

export interface BingoDragSource {
  type: "bank" | "cell";
  num: number;
  r?: number;
  c?: number;
}

export interface BingoDragState {
  source: BingoDragSource;
  x: number;
  y: number;
  hoverCell: { r: number; c: number } | null;
}

// ── Main Bingo Blitz Duel Deluxe Component ──

export const BingoGame: React.FC<BingoGameProps> = ({ room, myPlayerId, isMyTurn, onLocalMove }) => {
  const rawState = room.gameState;

  const isHost = room.players.host.id === myPlayerId;
  const isAIMode = room.mode === "ai";
  const isLocalMode = room.mode === "local";

  // Check if we are currently in Setup/Draft Phase
  const isSetupPhase =
    rawState?.phase === "setup" ||
    (!rawState?.phase &&
      !rawState?.isCardLocked &&
      (!rawState?.stampedNumbers || rawState.stampedNumbers.length === 0) &&
      rawState?.hostReady === false);

  const localHostCardRef = useRef<number[][] | null>(null);
  const localGuestCardRef = useRef<number[][] | null>(null);

  const hostCard: number[][] = useMemo(() => {
    const normalized = normalizeBingoCard(rawState?.hostCard);
    if (normalized) {
      localHostCardRef.current = normalized;
      return normalized;
    }
    if (!localHostCardRef.current) {
      localHostCardRef.current = isSetupPhase ? createEmptyBingoCard() : generateRandomBingoCard();
    }
    return localHostCardRef.current;
  }, [rawState?.hostCard, isSetupPhase]);

  const guestCard: number[][] = useMemo(() => {
    const normalized = normalizeBingoCard(rawState?.guestCard);
    if (normalized) {
      localGuestCardRef.current = normalized;
      return normalized;
    }
    if (!localGuestCardRef.current) {
      localGuestCardRef.current = isSetupPhase ? createEmptyBingoCard() : generateRandomBingoCard();
    }
    return localGuestCardRef.current;
  }, [rawState?.guestCard, isSetupPhase]);

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
  const [wildStampsUsed, setWildStampsUsed] = useState(0);
  const [aiSpeech, setAiSpeech] = useState<string | null>(null);

  // ── Card Draft Builder States (Defaults to Clean Blank Slate 0/25) ──
  const [draftCard, setDraftCard] = useState<number[][]>(() => {
    const raw = isHost || isAIMode ? rawState?.hostCard : rawState?.guestCard;
    const normalized = normalizeBingoCard(raw);
    return normalized || createEmptyBingoCard();
  });
  const [selectedBankNumber, setSelectedBankNumber] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [draftHistory, setDraftHistory] = useState<number[][][]>([]);
  const [hoveredEmptyCell, setHoveredEmptyCell] = useState<{ r: number; c: number } | null>(null);

  // ── Drag & Drop States ──
  const [activeDrag, setActiveDrag] = useState<BingoDragState | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const hasMovedRef = useRef<boolean>(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Local 2-Player draft phase steps: "host_draft" -> "pass_screen" -> "guest_draft"
  const [localDraftStep, setLocalDraftStep] = useState<"host_draft" | "pass_screen" | "guest_draft">("host_draft");
  const [localP1DraftCard, setLocalP1DraftCard] = useState<number[][]>(() =>
    normalizeBingoCard(rawState?.hostCard) || createEmptyBingoCard()
  );
  const [localP2DraftCard, setLocalP2DraftCard] = useState<number[][]>(() =>
    normalizeBingoCard(rawState?.guestCard) || createEmptyBingoCard()
  );

  const BINGO_LETTERS = ["B", "I", "N", "G", "O"];

  const hostColor = "#06b6d4"; // Cyan
  const guestColor = "#f43f5e"; // Rose Pink
  const currentTurnColor = room.currentTurn === room.players.host.id ? hostColor : guestColor;

  const aiDifficulty = room.rules?.aiDifficulty || "medium";
  const personaKey = aiDifficulty === "easy" ? "lucy" : aiDifficulty === "hard" ? "omega" : "baron";
  const aiPersona = BINGO_AI_PERSONAS[personaKey];

  const activePlayerName =
    room.currentTurn === room.players.host.id
      ? room.players.host.name
      : room.players.guest?.name || (isAIMode ? aiPersona.name : "Player 2");

  // ── 15-Second Turn Timer States & Refs ──
  const turnDuration =
    room.rules?.turnTimerSeconds && room.rules.turnTimerSeconds > 0
      ? room.rules.turnTimerSeconds
      : DEFAULT_BINGO_TURN_TIMER;

  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(turnDuration);
  const turnStartTimeRef = useRef<number>(Date.now());
  const lastTurnKeyRef = useRef<string>("");
  const lastTickedSecondRef = useRef<number>(-1);
  const hasAutoCalledRef = useRef<boolean>(false);

  // ── Placed numbers calculation in Builder ──
  const currentActiveDraft = isLocalMode
    ? localDraftStep === "guest_draft"
      ? localP2DraftCard
      : localP1DraftCard
    : draftCard;

  const placedNumbersSet = useMemo(() => {
    const set = new Set<number>();
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const val = currentActiveDraft[r]?.[c] || 0;
        if (val >= 1 && val <= 25) {
          set.add(val);
        }
      }
    }
    return set;
  }, [currentActiveDraft]);

  const placedCount = placedNumbersSet.size;
  const isDraftCardComplete = placedCount === 25 && validateBingoCard(currentActiveDraft);

  // Lowest available number for sequential freeform tapping (1 to 25)
  const nextLowestUnused = useMemo(() => {
    for (let i = 1; i <= 25; i++) {
      if (!placedNumbersSet.has(i)) return i;
    }
    return null;
  }, [placedNumbersSet]);

  // AI Dialogue trigger
  const triggerAiSpeech = useCallback(
    (type: "onCall" | "onLineComplete" | "onOpponentLine") => {
      if (!isAIMode) return;
      const quotes = aiPersona.quotes[type];
      if (!quotes || quotes.length === 0) return;
      const quote = quotes[Math.floor(Math.random() * quotes.length)];
      setAiSpeech(quote);
      setTimeout(() => setAiSpeech(null), 3000);
    },
    [isAIMode, aiPersona]
  );

  // ── Draft Builder Handlers with Undo Support ──

  const updateActiveDraft = useCallback(
    (updater: (prev: number[][]) => number[][]) => {
      if (isLocalMode) {
        if (localDraftStep === "guest_draft") {
          setLocalP2DraftCard((prev) => {
            setDraftHistory((h) => [...h.slice(-15), prev.map((r) => [...r])]);
            return updater(prev);
          });
        } else {
          setLocalP1DraftCard((prev) => {
            setDraftHistory((h) => [...h.slice(-15), prev.map((r) => [...r])]);
            return updater(prev);
          });
        }
      } else {
        setDraftCard((prev) => {
          setDraftHistory((h) => [...h.slice(-15), prev.map((r) => [...r])]);
          return updater(prev);
        });
      }
    },
    [isLocalMode, localDraftStep]
  );

  const handleUndoDraft = useCallback(() => {
    if (draftHistory.length === 0) return;
    gameAudio.playClick();
    const prev = draftHistory[draftHistory.length - 1];
    setDraftHistory((h) => h.slice(0, -1));
    if (isLocalMode) {
      if (localDraftStep === "guest_draft") {
        setLocalP2DraftCard(prev);
      } else {
        setLocalP1DraftCard(prev);
      }
    } else {
      setDraftCard(prev);
    }
    setSelectedCell(null);
    setSelectedBankNumber(null);
  }, [draftHistory, isLocalMode, localDraftStep]);

  // ── Drag & Drop Coordinate Detection ──
  const getGridCellAtPos = useCallback((clientX: number, clientY: number): { r: number; c: number } | null => {
    if (!gridContainerRef.current) return null;
    const rect = gridContainerRef.current.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      return null;
    }
    const c = Math.min(4, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * 5)));
    const r = Math.min(4, Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * 5)));
    return { r, c };
  }, []);

  const handlePointerDownDrag = useCallback(
    (source: BingoDragSource, e: React.PointerEvent) => {
      if (e.button !== 0) return;
      dragPointerIdRef.current = e.pointerId;
      hasMovedRef.current = false;
      startPosRef.current = { x: e.clientX, y: e.clientY };

      const initialHover = getGridCellAtPos(e.clientX, e.clientY);
      setActiveDrag({
        source,
        x: e.clientX,
        y: e.clientY,
        hoverCell: initialHover,
      });
    },
    [getGridCellAtPos]
  );

  // Global Pointer Listeners for Smooth Dragging & Dropping
  useEffect(() => {
    if (!activeDrag) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (dragPointerIdRef.current !== null && e.pointerId !== dragPointerIdRef.current) return;
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      if (dx > 5 || dy > 5) {
        hasMovedRef.current = true;
      }

      const hover = getGridCellAtPos(e.clientX, e.clientY);
      setActiveDrag((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY, hoverCell: hover } : null));
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (dragPointerIdRef.current !== null && e.pointerId !== dragPointerIdRef.current) return;

      if (activeDrag && hasMovedRef.current) {
        const dropCell = getGridCellAtPos(e.clientX, e.clientY);

        if (dropCell) {
          // Dropped on grid cell (r, c)
          const { r, c } = dropCell;
          const source = activeDrag.source;

          if (source.type === "bank") {
            gameAudio.playBingoStamp();
            updateActiveDraft((prev) => {
              const next = prev.map((row) => [...row]);
              for (let rowIdx = 0; rowIdx < 5; rowIdx++) {
                for (let colIdx = 0; colIdx < 5; colIdx++) {
                  if (next[rowIdx][colIdx] === source.num) {
                    next[rowIdx][colIdx] = 0;
                  }
                }
              }
              next[r][c] = source.num;
              return next;
            });
            setSelectedBankNumber(null);
            setSelectedCell(null);
          } else if (source.type === "cell" && source.r !== undefined && source.c !== undefined) {
            // Dragged from cell to cell
            if (source.r !== r || source.c !== c) {
              gameAudio.playBingoStamp();
              updateActiveDraft((prev) => {
                const next = prev.map((row) => [...row]);
                const val1 = next[source.r!][source.c!];
                const val2 = next[r][c];
                next[r][c] = val1;
                next[source.r!][source.c!] = val2;
                return next;
              });
              setSelectedCell(null);
            }
          }
        } else {
          // Dropped outside grid -> Clear from board back to bank
          if (activeDrag.source.type === "cell" && activeDrag.source.r !== undefined && activeDrag.source.c !== undefined) {
            gameAudio.playClick();
            const { r, c } = activeDrag.source;
            updateActiveDraft((prev) => {
              const next = prev.map((row) => [...row]);
              next[r][c] = 0;
              return next;
            });
            setSelectedCell(null);
          }
        }
      }

      setActiveDrag(null);
      dragPointerIdRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [activeDrag, getGridCellAtPos, updateActiveDraft]);

  // ── Cell Click: Freeform Tap-to-Place Sequential Numbering (1..25), Bank Placing & Two-Tap Swap ──
  const handleCellClickInDraft = useCallback(
    (r: number, c: number) => {
      if (hasMovedRef.current) return;
      gameAudio.playClick();

      // 1. If a Bank Number is actively selected: Place it directly
      if (selectedBankNumber !== null) {
        updateActiveDraft((prev) => {
          const next = prev.map((row) => [...row]);
          for (let rowIdx = 0; rowIdx < 5; rowIdx++) {
            for (let colIdx = 0; colIdx < 5; colIdx++) {
              if (next[rowIdx][colIdx] === selectedBankNumber) {
                next[rowIdx][colIdx] = 0;
              }
            }
          }
          next[r][c] = selectedBankNumber;
          return next;
        });

        // Auto-advance bank number to next lowest available
        const updatedUsed = new Set(placedNumbersSet);
        updatedUsed.add(selectedBankNumber);
        let nextToSelect: number | null = null;
        for (let i = 1; i <= 25; i++) {
          if (!updatedUsed.has(i)) {
            nextToSelect = i;
            break;
          }
        }
        setSelectedBankNumber(nextToSelect);
        setSelectedCell(null);
        return;
      }

      // 2. If a Cell is already selected for Swap / Move:
      if (selectedCell !== null) {
        if (selectedCell.r === r && selectedCell.c === c) {
          setSelectedCell(null);
          return;
        }

        // SWAP / MOVE between selectedCell and current (r, c)
        updateActiveDraft((prev) => {
          const next = prev.map((row) => [...row]);
          const val1 = next[selectedCell.r][selectedCell.c];
          const val2 = next[r][c];

          next[r][c] = val1;
          next[selectedCell.r][selectedCell.c] = val2;
          return next;
        });

        setSelectedCell(null);
        return;
      }

      // 3. No Bank number and No Cell selected:
      const currentVal = currentActiveDraft[r][c];
      if (currentVal > 0) {
        // Tapping filled cell -> Select it for SWAP / MOVE
        setSelectedCell({ r, c });
      } else {
        // Tapping empty cell -> FREEFORM CONSECUTIVE TAP-TO-NUMBER (1 -> 2 -> ... -> 25)
        updateActiveDraft((prev) => {
          const next = prev.map((row) => [...row]);
          const used = new Set<number>();
          for (let rowIdx = 0; rowIdx < 5; rowIdx++) {
            for (let colIdx = 0; colIdx < 5; colIdx++) {
              if (next[rowIdx][colIdx] > 0) used.add(next[rowIdx][colIdx]);
            }
          }
          for (let i = 1; i <= 25; i++) {
            if (!used.has(i)) {
              next[r][c] = i;
              break;
            }
          }
          return next;
        });
      }
    },
    [selectedBankNumber, selectedCell, placedNumbersSet, currentActiveDraft, updateActiveDraft]
  );

  const handleClearSelectedCell = useCallback(() => {
    if (!selectedCell) return;
    gameAudio.playClick();
    updateActiveDraft((prev) => {
      const next = prev.map((row) => [...row]);
      next[selectedCell.r][selectedCell.c] = 0;
      return next;
    });
    setSelectedCell(null);
  }, [selectedCell, updateActiveDraft]);

  const handleBankNumberSelect = useCallback(
    (num: number) => {
      if (hasMovedRef.current) return;
      gameAudio.playClick();
      setSelectedCell(null);
      if (selectedBankNumber === num) {
        setSelectedBankNumber(null);
      } else {
        setSelectedBankNumber(num);
      }
    },
    [selectedBankNumber]
  );

  // ── Quick Presets & Layout Generators ──
  const handleShuffleDraft = useCallback(() => {
    gameAudio.playClick();
    const randomized = generateRandomBingoCard();
    updateActiveDraft(() => randomized);
    setSelectedBankNumber(null);
    setSelectedCell(null);
  }, [updateActiveDraft]);

  const handleApplyPresetSequential = useCallback(
    (direction: "rows" | "cols") => {
      gameAudio.playClick();
      const card = generateSequentialBingoCard(direction);
      updateActiveDraft(() => card);
      setSelectedBankNumber(null);
      setSelectedCell(null);
    },
    [updateActiveDraft]
  );

  const handleApplyPresetSpiral = useCallback(() => {
    gameAudio.playClick();
    const card = generateSpiralBingoCard();
    updateActiveDraft(() => card);
    setSelectedBankNumber(null);
    setSelectedCell(null);
  }, [updateActiveDraft]);

  const handleAutoFillDraft = useCallback(() => {
    gameAudio.playClick();
    updateActiveDraft((prev) => autoFillRemainingCard(prev));
    setSelectedBankNumber(null);
    setSelectedCell(null);
  }, [updateActiveDraft]);

  const handleClearDraft = useCallback(() => {
    gameAudio.playClick();
    updateActiveDraft(() => createEmptyBingoCard());
    setSelectedBankNumber(1);
    setSelectedCell(null);
  }, [updateActiveDraft]);

  // ── Lock & Start Match Handlers ──

  const handleLockAndStartAI = useCallback(async () => {
    if (!isDraftCardComplete) return;
    gameAudio.playWin();

    const aiCard = generateRandomBingoCard();
    const updatedState: BingoGameState = {
      ...rawState,
      hostCard: draftCard,
      guestCard: aiCard,
      stampedNumbers: [],
      calledHistory: [],
      hostLines: 0,
      guestLines: 0,
      hostCompletedLines: [],
      guestCompletedLines: [],
      lastCalledNumber: null,
      isCardLocked: true,
      phase: "playing",
      hostReady: true,
      guestReady: true,
    };

    onLocalMove?.({
      ...room,
      gameState: updatedState,
      status: "playing",
      lastMoveTimestamp: Date.now(),
      turnExpiresAt: Date.now() + turnDuration * 1000,
    });
  }, [isDraftCardComplete, draftCard, rawState, room, onLocalMove, turnDuration]);

  const handleLockLocalP1 = useCallback(() => {
    if (!validateBingoCard(localP1DraftCard)) return;
    gameAudio.playClick();
    setLocalDraftStep("pass_screen");
    setSelectedBankNumber(null);
    setSelectedCell(null);
    setDraftHistory([]);
  }, [localP1DraftCard]);

  const handleLockAndStartLocal = useCallback(() => {
    if (!validateBingoCard(localP2DraftCard)) return;
    gameAudio.playWin();

    const updatedState: BingoGameState = {
      ...rawState,
      hostCard: localP1DraftCard,
      guestCard: localP2DraftCard,
      stampedNumbers: [],
      calledHistory: [],
      hostLines: 0,
      guestLines: 0,
      hostCompletedLines: [],
      guestCompletedLines: [],
      lastCalledNumber: null,
      isCardLocked: true,
      phase: "playing",
      hostReady: true,
      guestReady: true,
    };

    onLocalMove?.({
      ...room,
      gameState: updatedState,
      status: "playing",
      lastMoveTimestamp: Date.now(),
      turnExpiresAt: Date.now() + turnDuration * 1000,
    });
  }, [localP1DraftCard, localP2DraftCard, rawState, room, onLocalMove, turnDuration]);

  const handleQuickStartRandomLocal = useCallback(() => {
    gameAudio.playWin();
    const p1 = generateRandomBingoCard();
    const p2 = generateRandomBingoCard();
    const updatedState: BingoGameState = {
      ...rawState,
      hostCard: p1,
      guestCard: p2,
      stampedNumbers: [],
      calledHistory: [],
      hostLines: 0,
      guestLines: 0,
      hostCompletedLines: [],
      guestCompletedLines: [],
      lastCalledNumber: null,
      isCardLocked: true,
      phase: "playing",
      hostReady: true,
      guestReady: true,
    };
    onLocalMove?.({
      ...room,
      gameState: updatedState,
      status: "playing",
      lastMoveTimestamp: Date.now(),
      turnExpiresAt: Date.now() + turnDuration * 1000,
    });
  }, [rawState, room, onLocalMove, turnDuration]);

  const isMyOnlineReady = isHost ? !!rawState?.hostReady : !!rawState?.guestReady;
  const isOpponentOnlineReady = isHost ? !!rawState?.guestReady : !!rawState?.hostReady;
  const opponentPlayerName = isHost ? room.players.guest?.name || "Player 2" : room.players.host.name;

  // Realtime notification & sound when opponent finishes their 5x5 board
  const prevOpponentOnlineReadyRef = useRef(isOpponentOnlineReady);
  useEffect(() => {
    if (!isLocalMode && !isAIMode && isSetupPhase) {
      if (!prevOpponentOnlineReadyRef.current && isOpponentOnlineReady) {
        gameAudio.playPowerUpTrigger();
        gameHaptics.vibrateMedium();
        toast.success(
          `⚡ ${opponentPlayerName} locked their 5x5 board! Ready & waiting for you!`,
          {
            icon: "🎉",
            duration: 4500,
          }
        );
      }
    }
    prevOpponentOnlineReadyRef.current = isOpponentOnlineReady;
  }, [isOpponentOnlineReady, isLocalMode, isAIMode, isSetupPhase, opponentPlayerName]);

  const handleAutoFillAndLockOnline = useCallback(async () => {
    gameAudio.playWin();
    const finalCard = isDraftCardComplete ? draftCard : autoFillRemainingCard(draftCard);
    setDraftCard(finalCard);

    const willBothBeReady = true;

    const updatedState: BingoGameState = {
      ...rawState,
      hostCard: isHost ? finalCard : hostCard,
      guestCard: !isHost ? finalCard : guestCard,
      hostReady: isHost ? true : rawState?.hostReady,
      guestReady: !isHost ? true : rawState?.guestReady,
      phase: "playing",
      isCardLocked: true,
      stampedNumbers: [],
      calledHistory: [],
      hostLines: 0,
      guestLines: 0,
      hostCompletedLines: [],
      guestCompletedLines: [],
      lastCalledNumber: null,
    };

    await sendGameMove(
      room.roomCode,
      updatedState,
      room.currentTurn,
      null,
      false,
      room.players.host.score,
      room.players.guest?.score || 0,
      turnDuration
    );
  }, [
    isDraftCardComplete,
    draftCard,
    isHost,
    rawState,
    hostCard,
    guestCard,
    room.roomCode,
    room.currentTurn,
    room.players.host.score,
    room.players.guest?.score,
    turnDuration,
  ]);

  const handleLockOnlineCard = useCallback(async () => {
    if (!isDraftCardComplete) return;
    gameAudio.playWin();

    const willBothBeReady = isHost ? !!rawState?.guestReady : !!rawState?.hostReady;

    const updatedState: BingoGameState = {
      ...rawState,
      hostCard: isHost ? draftCard : hostCard,
      guestCard: !isHost ? draftCard : guestCard,
      hostReady: isHost ? true : rawState?.hostReady,
      guestReady: !isHost ? true : rawState?.guestReady,
      phase: willBothBeReady ? "playing" : "setup",
      isCardLocked: willBothBeReady,
      stampedNumbers: [],
      calledHistory: [],
      hostLines: 0,
      guestLines: 0,
      hostCompletedLines: [],
      guestCompletedLines: [],
      lastCalledNumber: null,
    };

    await sendGameMove(
      room.roomCode,
      updatedState,
      room.currentTurn,
      null,
      false,
      room.players.host.score,
      room.players.guest?.score || 0,
      willBothBeReady ? turnDuration : 0
    );
  }, [isDraftCardComplete, isHost, rawState, draftCard, hostCard, guestCard, room, turnDuration]);

  const handleUnlockOnlineCard = useCallback(async () => {
    gameAudio.playClick();
    const updatedState: BingoGameState = {
      ...rawState,
      hostReady: isHost ? false : rawState?.hostReady,
      guestReady: !isHost ? false : rawState?.guestReady,
      phase: "setup",
      isCardLocked: false,
    };
    await sendGameMove(
      room.roomCode,
      updatedState,
      room.currentTurn,
      null,
      false,
      room.players.host.score,
      room.players.guest?.score || 0
    );
  }, [isHost, rawState, room]);

  // ── In-Game Call Number Handler ──
  const handleCallNumber = useCallback(
    async (num: number, isWildExtra = false) => {
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
          gameAudio.playDraw();
        } else if (isHostWon) {
          winnerPlayerId = room.players.host.id;
          nextHostScore += 1;
          if (isHost || isLocalMode) {
            gameAudio.playBingoWinFanfare();
          } else {
            gameAudio.playLose();
          }
        } else if (isGuestWon) {
          winnerPlayerId = room.players.guest?.id || (isAIMode ? "ai_opponent" : "local_player_2");
          nextGuestScore += 1;
          if ((!isHost && !isAIMode) || isLocalMode) {
            gameAudio.playBingoWinFanfare();
          } else {
            gameAudio.playLose();
          }
        } else {
          winnerPlayerId = "draw";
          gameAudio.playDraw();
        }
      }

      // If wild extra stamp, turn stays with caller
      const nextTurnId = isWildExtra
        ? actingPlayerId
        : actingPlayerId === room.players.host.id
        ? room.players.guest?.id || (isAIMode ? "ai_opponent" : "local_player_2")
        : room.players.host.id;

      if (wildStampActive) {
        setWildStampActive(false);
        setWildStampsUsed((prev) => prev + 1);
      }

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
        phase: isOver ? "round_over" : "playing",
        hostReady: true,
        guestReady: true,
      };

      const nextRoomState: GameRoomState<BingoGameState> = {
        ...room,
        gameState: updatedGameState,
        currentTurn: nextTurnId,
        status: isOver ? "round_over" : "playing",
        winnerId: winnerPlayerId,
        lastMoveTimestamp: Date.now(),
        turnExpiresAt: isOver ? null : Date.now() + turnDuration * 1000,
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
          turnDuration,
          room.rules?.maxSeriesWins || 2
        );
      }
    },
    [
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
      turnDuration,
    ]
  );

  // AI Opponent auto-trigger during Playing Phase
  const isAITurn = isAIMode && room.status === "playing" && !isSetupPhase && room.currentTurn !== room.players.host.id;
  useEffect(() => {
    if (!isAITurn) return;

    const timer = setTimeout(() => {
      const aiNumber = getSmartBingoAIMove(guestCard, stampedNumbers, aiDifficulty);
      handleCallNumber(aiNumber);
    }, 650 + Math.random() * 400);

    return () => clearTimeout(timer);
  }, [isAITurn, guestCard, stampedNumbers, aiDifficulty, handleCallNumber]);

  // ── 15-Second Turn Countdown & AFK Auto-Call Engine ──
  const currentTurnKey = `${room.currentTurn}_${stampedNumbers.length}_${room.status}_${room.round}`;

  useEffect(() => {
    if (currentTurnKey !== lastTurnKeyRef.current) {
      lastTurnKeyRef.current = currentTurnKey;
      hasAutoCalledRef.current = false;
      lastTickedSecondRef.current = -1;
      turnStartTimeRef.current = Date.now();
      setTurnTimeLeft(turnDuration);
    }
  }, [currentTurnKey, turnDuration]);

  useEffect(() => {
    if (room.status !== "playing" || isSetupPhase) return;

    const interval = setInterval(() => {
      const now = Date.now();
      let remaining: number;

      if (room.turnExpiresAt && room.turnExpiresAt > now) {
        remaining = Math.max(0, Math.ceil((room.turnExpiresAt - now) / 1000));
      } else {
        const elapsed = (now - turnStartTimeRef.current) / 1000;
        remaining = Math.max(0, Math.ceil(turnDuration - elapsed));
      }

      setTurnTimeLeft(remaining);

      // Heartbeat audio tick during the final 5 seconds for the active player's turn
      const isCurrentActiveTurn = isLocalMode || (isAIMode ? isMyTurn : isMyTurn);
      if (remaining > 0 && remaining <= 5 && isCurrentActiveTurn) {
        if (lastTickedSecondRef.current !== remaining) {
          lastTickedSecondRef.current = remaining;
          gameAudio.playHeartbeatTick();
        }
      }

      // AFK Auto-Call when timer reaches 0
      if (remaining === 0 && !hasAutoCalledRef.current) {
        if (isLocalMode) {
          hasAutoCalledRef.current = true;
          const isHostTurn = room.currentTurn === room.players.host.id;
          const activeCard = isHostTurn ? hostCard : guestCard;
          const activeName = isHostTurn ? room.players.host.name : (room.players.guest?.name || "Player 2");
          const autoNum = getBingoAFKAutoMove(activeCard, stampedNumbers);

          toast.info(`⏰ ${activeName} timed out! Auto-called #${autoNum}`, {
            icon: "⚡",
            duration: 2500,
          });
          handleCallNumber(autoNum);
        } else if (isAIMode) {
          if (isMyTurn) {
            hasAutoCalledRef.current = true;
            const autoNum = getBingoAFKAutoMove(myCard, stampedNumbers);
            toast.info(`⏰ Turn timed out! Auto-called #${autoNum} for you`, {
              icon: "⚡",
              duration: 2500,
            });
            handleCallNumber(autoNum);
          }
        } else {
          // Online Multiplayer
          if (isMyTurn) {
            hasAutoCalledRef.current = true;
            const autoNum = getBingoAFKAutoMove(myCard, stampedNumbers);
            toast.info(`⏰ Turn timed out! Auto-called #${autoNum} for you`, {
              icon: "⚡",
              duration: 2500,
            });
            handleCallNumber(autoNum);
          }
        }
      }

      // Online Multiplayer Opponent Fallback (AFK referee):
      // If opponent client is inactive/disconnected for turnDuration + 2s (17s total), host client steps in
      if (!isLocalMode && !isAIMode && !isMyTurn && !hasAutoCalledRef.current) {
        const elapsed = (now - turnStartTimeRef.current) / 1000;
        const graceThreshold = isHost ? turnDuration + 2 : turnDuration + 3;
        if (elapsed >= graceThreshold) {
          hasAutoCalledRef.current = true;
          const oppCard = opponentCard;
          const oppName =
            room.currentTurn === room.players.host.id
              ? room.players.host.name
              : room.players.guest?.name || "Opponent";
          const autoNum = getBingoAFKAutoMove(oppCard, stampedNumbers);
          toast.info(`⏰ ${oppName} is AFK! Auto-called #${autoNum} to keep match moving`, {
            icon: "⚡",
            duration: 2500,
          });
          handleCallNumber(autoNum);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [
    room.status,
    room.turnExpiresAt,
    room.currentTurn,
    room.players.host.id,
    room.players.host.name,
    room.players.guest?.name,
    isSetupPhase,
    isLocalMode,
    isAIMode,
    isMyTurn,
    isHost,
    turnDuration,
    hostCard,
    guestCard,
    myCard,
    opponentCard,
    stampedNumbers,
    handleCallNumber,
  ]);

  // Audio & Letter Unlock sync for incoming moves
  const prevLinesCountRef = useRef(myLinesResult.count);
  const prevLastCalledRef = useRef(lastCalledNumber);

  useEffect(() => {
    if (lastCalledNumber !== null && lastCalledNumber !== prevLastCalledRef.current) {
      prevLastCalledRef.current = lastCalledNumber;
      gameAudio.playBingoCall();
      gameAudio.playBingoStamp();
    }
  }, [lastCalledNumber]);

  useEffect(() => {
    if (myLinesResult.count > prevLinesCountRef.current) {
      const newLines = myLinesResult.count;
      gameAudio.playBingoLetterUnlock(newLines);
      const letterUnlocked = BINGO_LETTERS[Math.min(newLines - 1, 4)];
      setUnlockedLetterBanner(`🎉 Unlocked [ ${letterUnlocked} ]! (${newLines}/5 Lines)`);
      const timer = setTimeout(() => setUnlockedLetterBanner(null), 2500);
      prevLinesCountRef.current = newLines;
      return () => clearTimeout(timer);
    }
    prevLinesCountRef.current = myLinesResult.count;
  }, [myLinesResult.count, BINGO_LETTERS]);

  // Reshuffle card during playing phase if no calls yet
  const handleReshuffleCard = async () => {
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
      isCardLocked: true,
      phase: "playing",
      hostReady: true,
      guestReady: true,
    };
    if (isLocalMode || isAIMode) {
      onLocalMove?.({
        ...room,
        gameState: updatedState,
      });
    } else {
      await sendGameMove(room.roomCode, updatedState, room.currentTurn, null, false);
    }
    gameAudio.playClick();
  };

  // Recent called numbers history list
  const recentCalls = useMemo(() => {
    return stampedNumbers.slice(-4).reverse();
  }, [stampedNumbers]);

  // SVG Golden Line Lasers Overlay
  const renderCompletedLineLasers = () => {
    return myLinesResult.completedLineIds.map((lineId) => {
      let x1 = 0,
        y1 = 0,
        x2 = 0,
        y2 = 0;

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

  // ══════════════════════════════════════════════════════════════════
  // ── VIEW 1: SETUP & CUSTOM CARD DRAFT PHASE (BLANK SLATE) ──
  // ══════════════════════════════════════════════════════════════════

  if (isSetupPhase) {
    // ── Local 2-Player Pass Device Shield Screen ──
    if (isLocalMode && localDraftStep === "pass_screen") {
      return (
        <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-4 select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full p-6 rounded-3xl bg-card/85 backdrop-blur-2xl border-2 border-primary/40 shadow-2xl flex flex-col items-center text-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
              <Shield className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Player 1 Card Locked!</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Pass Device to Player 2</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Keep cards secret! Hand the device to <strong>{room.players.guest?.name || "Player 2"}</strong> to craft
                their 25-number board.
              </p>
            </div>

            <Button
              type="button"
              variant="default"
              size="lg"
              onClick={() => {
                gameAudio.playClick();
                setLocalDraftStep("guest_draft");
                setSelectedBankNumber(null);
                setSelectedCell(null);
                setDraftHistory([]);
              }}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-black shadow-lg shadow-rose-500/25 rounded-2xl h-12 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <span>I'm Player 2 — Craft My Board</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      );
    }

    const draftPlayerTitle = isLocalMode
      ? localDraftStep === "guest_draft"
        ? `${room.players.guest?.name || "Player 2"} (Guest) Board Setup`
        : `${room.players.host.name} (Player 1) Board Setup`
      : isAIMode
      ? "Craft Your 5x5 Bingo Board"
      : isHost
      ? `${room.players.host.name} (Host Card Builder)`
      : `${room.players.guest?.name || "Player 2"} (Guest Card Builder)`;

    const selectedCellValue = selectedCell ? currentActiveDraft[selectedCell.r]?.[selectedCell.c] : null;

    return (
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-2 select-none">
        {/* ── Realtime Opponent Ready Alert Banner ── */}
        {!isLocalMode && !isAIMode && (
          <div className="w-full mb-2.5">
            {isOpponentOnlineReady ? (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="w-full p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-cyan-500/25 border-2 border-emerald-400/70 shadow-[0_0_18px_rgba(16,185,129,0.35)] flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-black text-emerald-300 truncate">
                      ⚡ {opponentPlayerName} locked their 5x5 board!
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {isDraftCardComplete
                        ? "Lock your card below to start match!"
                        : `${25 - placedCount} slots remaining — or tap Quick-Fill!`}
                    </span>
                  </div>
                </div>

                {!isDraftCardComplete && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAutoFillAndLockOnline}
                    className="h-8 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shrink-0 shadow-md shadow-emerald-500/30 flex items-center gap-1 cursor-pointer animate-pulse"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Quick Ready ⚡</span>
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className="w-full px-3 py-1.5 rounded-xl bg-card/50 border border-border/50 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Opponent: <strong className="text-foreground">{opponentPlayerName}</strong>
                </span>
                <span className="text-amber-400/90 font-mono text-[10px]">
                  Drafting 5x5 board... ⏳
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Top Header & Freeform Sequential Prompt ── */}
        <div className="w-full mb-3 p-3 rounded-2xl bg-card/75 backdrop-blur-md border border-border/60 shadow-lg flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-1 px-1">
            <div className="flex items-center gap-1.5 font-black text-sm text-foreground">
              <PenTool className="w-4 h-4 text-amber-400" />
              <span>{draftPlayerTitle}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {draftHistory.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleUndoDraft}
                  title="Undo last change"
                  className="h-6 px-2 text-[10px] font-bold rounded-lg text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>Undo</span>
                </Button>
              )}
              <div
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border transition-all ${
                  isDraftCardComplete
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    : "bg-amber-500/15 border-amber-400/60 text-amber-300"
                }`}
              >
                {placedCount} / 25 Placed
              </div>
            </div>
          </div>

          {/* Dynamic Contextual Helper Banner: Next Number to Place */}
          <div className="w-full px-2.5 py-2 rounded-xl bg-muted/40 border border-border/40 mt-1 flex items-center justify-between text-xs">
            {activeDrag && hasMovedRef.current ? (
              <div className="flex items-center gap-1.5 text-amber-300 font-extrabold animate-pulse">
                <Move className="w-3.5 h-3.5" />
                <span>
                  Dragging #{activeDrag.source.num} • Drop on any cell to place/swap!
                </span>
              </div>
            ) : selectedCell && selectedCellValue ? (
              <div className="flex items-center justify-between w-full text-amber-300 font-bold">
                <span className="flex items-center gap-1">
                  <ArrowLeftRight className="w-3.5 h-3.5 animate-pulse" />
                  <span>
                    Swapping <strong>#{selectedCellValue}</strong>: Tap another cell to swap / move
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleClearSelectedCell}
                  className="text-rose-400 hover:text-rose-300 text-[10px] underline cursor-pointer ml-1"
                >
                  Clear cell
                </button>
              </div>
            ) : selectedBankNumber !== null ? (
              <div className="flex items-center justify-between w-full text-amber-300 font-bold">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Placing <strong>#{selectedBankNumber}</strong>: Tap or Drag onto grid
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedBankNumber(null)}
                  className="text-muted-foreground hover:text-foreground text-[10px] cursor-pointer ml-1"
                >
                  <X className="w-3 h-3 inline" />
                </button>
              </div>
            ) : isDraftCardComplete ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> All 25 numbers placed! Ready to lock card.
              </span>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-muted-foreground flex items-center gap-1">
                  <span>Tap any empty box to place</span>
                </span>
                <motion.div
                  key={nextLowestUnused}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/60 shadow-sm"
                >
                  <span className="text-[10px] font-bold text-amber-300">Next:</span>
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-sm">
                    {nextLowestUnused || 1}
                  </span>
                </motion.div>
              </div>
            )}
          </div>

          {/* Quick Presets & Smart Layout Bar */}
          <div className="flex items-center justify-center gap-1 w-full mt-2.5 pt-2 border-t border-border/40 overflow-x-auto no-scrollbar">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShuffleDraft}
              title="Shuffle All Numbers"
              className="flex-1 h-7 text-[10px] font-bold rounded-xl bg-card/60 hover:bg-muted/80 border-border/60 flex items-center justify-center gap-1 px-2"
            >
              <Shuffle className="w-3 h-3 text-amber-400" />
              <span>Shuffle</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleApplyPresetSequential("rows")}
              title="Arrange numbers 1-25 row by row"
              className="flex-1 h-7 text-[10px] font-bold rounded-xl bg-card/60 hover:bg-muted/80 border-border/60 flex items-center justify-center gap-1 px-2"
            >
              <ListOrdered className="w-3 h-3 text-indigo-400" />
              <span>1–25 Row</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleApplyPresetSpiral}
              title="Arrange numbers 1-25 in a spiral pattern"
              className="flex-1 h-7 text-[10px] font-bold rounded-xl bg-card/60 hover:bg-muted/80 border-border/60 flex items-center justify-center gap-1 px-2"
            >
              <Layers className="w-3 h-3 text-pink-400" />
              <span>Spiral</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDraftCardComplete}
              onClick={handleAutoFillDraft}
              title="Auto-fill empty remaining cells"
              className="flex-1 h-7 text-[10px] font-bold rounded-xl bg-card/60 hover:bg-muted/80 border-border/60 flex items-center justify-center gap-1 px-2 disabled:opacity-40"
            >
              <Wand2 className="w-3 h-3 text-cyan-400" />
              <span>Auto-Fill</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={placedCount === 0}
              onClick={handleClearDraft}
              title="Clear all numbers (Blank Slate)"
              className="h-7 text-[10px] font-bold rounded-xl bg-card/60 hover:bg-rose-500/10 hover:text-rose-400 border-border/60 flex items-center justify-center gap-1 px-2 disabled:opacity-40"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>Clear</span>
            </Button>
          </div>
        </div>

        {/* ── 5x5 Draft Grid (Blank Slate with Ghost Previews & Drag Support) ── */}
        <div
          ref={gridContainerRef}
          className="relative w-full aspect-square max-w-[min(370px,calc(100vw-2rem))] bg-card/80 backdrop-blur-2xl p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border-2 border-border/80 shadow-[0_0_25px_rgba(0,0,0,0.4)] flex items-center justify-center touch-none select-none"
        >
          <div className="w-full h-full grid grid-cols-5 grid-rows-5 gap-1.5 sm:gap-2">
            {currentActiveDraft.map((row, r) =>
              row.map((num, c) => {
                const isFilled = num >= 1 && num <= 25;
                const isCellSelectedForSwap = selectedCell?.r === r && selectedCell?.c === c;
                const isSelectedBankNumMatch = selectedBankNumber !== null && selectedBankNumber === num;
                const isHoveredByDrag = activeDrag?.hoverCell?.r === r && activeDrag?.hoverCell?.c === c;
                const isHoveredEmpty = hoveredEmptyCell?.r === r && hoveredEmptyCell?.c === c && !isFilled;

                return (
                  <motion.div
                    key={`draft-${r}-${c}`}
                    whileHover={{ scale: isFilled ? 1.05 : 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={() => !isFilled && setHoveredEmptyCell({ r, c })}
                    onMouseLeave={() => setHoveredEmptyCell(null)}
                    onPointerDown={(e) => {
                      if (isFilled) {
                        handlePointerDownDrag({ type: "cell", num, r, c }, e);
                      }
                    }}
                    onClick={() => handleCellClickInDraft(r, c)}
                    className={`relative flex items-center justify-center rounded-xl font-black text-lg sm:text-xl transition-all duration-150 cursor-pointer ${
                      isHoveredByDrag
                        ? "bg-amber-400/40 border-2 border-amber-300 text-amber-100 ring-4 ring-amber-400/60 scale-105 shadow-[0_0_20px_rgba(245,158,11,0.6)] z-20"
                        : isCellSelectedForSwap
                        ? "bg-amber-500/35 border-2 border-amber-400 text-amber-200 ring-4 ring-amber-400/50 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.5)] z-10"
                        : isSelectedBankNumMatch
                        ? "bg-amber-500/25 border-2 border-amber-300 text-amber-200 ring-2 ring-amber-300/40"
                        : isFilled
                        ? "bg-primary/25 border-2 border-primary/60 text-primary-foreground hover:bg-primary/35 shadow-sm"
                        : isHoveredEmpty
                        ? "bg-amber-500/10 border-2 border-dashed border-amber-400/80 text-amber-300/70"
                        : "bg-background/40 hover:bg-muted/60 border border-dashed border-border/70 text-muted-foreground/40"
                    }`}
                  >
                    {isFilled ? (
                      <span>{num}</span>
                    ) : isHoveredEmpty ? (
                      <span className="text-sm font-extrabold text-amber-300 opacity-80">
                        {selectedBankNumber || nextLowestUnused || "+"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono opacity-30 text-muted-foreground">
                        {r * 5 + c + 1}
                      </span>
                    )}

                    {/* Swap Indicator Badge on active cell */}
                    {isCellSelectedForSwap && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[9px] font-black shadow-sm"
                      >
                        ⇄
                      </motion.div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Floating Drag Avatar / Follow Cursor Preview ── */}
        {activeDrag && hasMovedRef.current && (
          <div
            className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 select-none"
            style={{ left: activeDrag.x, top: activeDrag.y }}
          >
            <motion.div
              initial={{ scale: 0.8, rotate: 0 }}
              animate={{ scale: 1.25, rotate: 6 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-[0_15px_35px_rgba(245,158,11,0.6)] border-2 border-white ring-4 ring-amber-300/60"
            >
              <span>{activeDrag.source.num}</span>
            </motion.div>
          </div>
        )}

        {/* ── Number Bank (1 to 25) with Direct Drag-Out Support ── */}
        <div className="w-full mt-3 p-3 rounded-2xl bg-card/65 backdrop-blur-md border border-border/50 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between px-1 text-[11px] font-bold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Gamepad2 className="w-3.5 h-3.5 text-primary" /> Number Bank (1–25)
            </span>
            <span className="text-[10px]">
              {selectedBankNumber ? (
                <span className="text-amber-300 font-extrabold">Placing: #{selectedBankNumber}</span>
              ) : (
                "Tap or drag onto grid"
              )}
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 sm:gap-1.5 w-full touch-none select-none">
            {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => {
              const isPlaced = placedNumbersSet.has(n);
              const isSelected = selectedBankNumber === n;
              const isNextSequential = n === nextLowestUnused && selectedBankNumber === null;

              return (
                <div
                  key={`bank-${n}`}
                  onPointerDown={(e) => handlePointerDownDrag({ type: "bank", num: n }, e)}
                  onClick={() => handleBankNumberSelect(n)}
                  className={`h-7 sm:h-8 rounded-lg font-black text-xs transition-all flex items-center justify-center cursor-pointer border select-none ${
                    isSelected
                      ? "bg-amber-500 border-amber-300 text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.6)] scale-105 ring-2 ring-amber-300"
                      : isNextSequential
                      ? "bg-amber-500/25 border-2 border-amber-400 text-amber-300 ring-2 ring-amber-400/40 animate-pulse font-extrabold"
                      : isPlaced
                      ? "bg-muted/40 border-border/40 text-muted-foreground/40 hover:text-muted-foreground"
                      : "bg-background/80 hover:bg-primary/20 border-primary/40 text-foreground shadow-sm hover:scale-105"
                  }`}
                >
                  <span>{n}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Ready & Lock Card Action Bar ── */}
        <div className="w-full mt-3 flex flex-col gap-2">
          {isLocalMode ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleQuickStartRandomLocal}
                className="flex-1 rounded-2xl h-11 text-xs font-bold border-border/60 bg-card/60"
              >
                <Shuffle className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
                <span className="truncate">Quick Start (Both Random)</span>
              </Button>

              {localDraftStep === "host_draft" ? (
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  disabled={!isDraftCardComplete}
                  onClick={handleLockLocalP1}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black shadow-lg shadow-cyan-500/25 rounded-2xl h-11 text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="truncate">Lock Player 1 Card</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  disabled={!isDraftCardComplete}
                  onClick={handleLockAndStartLocal}
                  className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-black shadow-lg shadow-rose-500/25 rounded-2xl h-11 text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="truncate">Start 2-Player Match</span>
                </Button>
              )}
            </div>
          ) : isAIMode ? (
            <Button
              type="button"
              variant="default"
              size="lg"
              disabled={!isDraftCardComplete}
              onClick={handleLockAndStartAI}
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-slate-950 font-black shadow-xl shadow-emerald-500/25 rounded-2xl h-12 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isDraftCardComplete ? `Lock Card & Play vs ${aiPersona.name} 🚀` : `Tap empty boxes to place remaining (${25 - placedCount} left)`}</span>
            </Button>
          ) : (
            /* Online Multiplayer Mode */
            <div className="w-full flex flex-col gap-2">
              {/* Opponent Status Indicator */}
              <div className="w-full px-3 py-1.5 rounded-xl bg-card/60 border border-border/50 flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">Opponent Status:</span>
                <span className={isOpponentOnlineReady ? "text-emerald-400 flex items-center gap-1" : "text-amber-400"}>
                  {isOpponentOnlineReady ? "Ready! 🟢" : "Drafting card... ⏳"}
                </span>
              </div>

              {isMyOnlineReady ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 py-2.5 px-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-black text-xs text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Card Locked! Waiting for opponent...</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    onClick={handleUnlockOnlineCard}
                    className="rounded-2xl h-11 text-xs font-bold"
                  >
                    <LockOpen className="w-3.5 h-3.5 mr-1" />
                    <span>Unlock</span>
                  </Button>
                </div>
              ) : isOpponentOnlineReady && !isDraftCardComplete ? (
                <div className="flex flex-col gap-2 w-full">
                  <Button
                    type="button"
                    variant="default"
                    size="lg"
                    onClick={handleAutoFillAndLockOnline}
                    className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-950 font-black shadow-xl shadow-emerald-500/25 rounded-2xl h-12 text-sm flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>⚡ Quick Auto-Fill & Start Match Now!</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    disabled
                    className="w-full rounded-2xl h-9 text-xs font-bold border-border/60 bg-card/60 opacity-60"
                  >
                    <Lock className="w-3.5 h-3.5 mr-1" />
                    <span>Or place remaining ({25 - placedCount} left) manually</span>
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  size="lg"
                  disabled={!isDraftCardComplete}
                  onClick={handleLockOnlineCard}
                  className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-primary-foreground font-black shadow-xl shadow-primary/25 rounded-2xl h-12 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {isDraftCardComplete
                      ? isOpponentOnlineReady
                        ? "Opponent Ready! Lock to Begin 🚀"
                        : "Lock Card & Ready 🔒"
                      : `Tap empty boxes to place remaining (${25 - placedCount} left)`}
                  </span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // ── VIEW 2: ACTIVE MATCH PLAYING PHASE ──
  // ══════════════════════════════════════════════════════════════════

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

      {/* ── 15-Second Turn Countdown with AFK Auto-Call Bar ── */}
      {room.status === "playing" && (
        <div className="w-full mb-2.5 px-3 py-2 rounded-2xl bg-card/75 backdrop-blur-md border border-border/60 shadow-sm flex flex-col gap-1.5 transition-colors">
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-1.5 min-w-0">
              {turnTimeLeft <= 5 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-bounce shrink-0" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span
                className={`truncate ${
                  turnTimeLeft <= 5 ? "text-rose-400 font-black animate-pulse" : "text-foreground"
                }`}
              >
                {turnTimeLeft <= 5
                  ? `⚠️ ${turnTimeLeft}s • Auto-pick imminent!`
                  : isLocalMode
                  ? `${activePlayerName}'s Turn`
                  : isMyTurn
                  ? "Your Turn — Pick a Number"
                  : `${activePlayerName} Calling...`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider hidden xs:inline">
                AFK Auto-Pick
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono shadow-sm transition-all ${
                  turnTimeLeft <= 5
                    ? "bg-rose-500/25 text-rose-400 border border-rose-500/50 shadow-rose-500/20 animate-pulse scale-105"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {turnTimeLeft}s
              </span>
            </div>
          </div>

          {/* Smooth Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-muted/60 overflow-hidden relative">
            <motion.div
              className={`h-full rounded-full transition-all duration-200 ${
                turnTimeLeft <= 5
                  ? "bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                  : "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, (turnTimeLeft / turnDuration) * 100))}%` }}
            />
          </div>
        </div>
      )}

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
            <span>
              Waiting for <strong className="text-foreground">{activePlayerName}</strong>...
            </span>
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
              title={
                wildStampsUsed >= 1
                  ? "Wild Star Stamp already used"
                  : "Wild Star Stamp (Stamp 1 free tile, 1 per match)"
              }
              disabled={wildStampsUsed >= 1}
              onClick={() => {
                if (wildStampsUsed >= 1) return;
                setWildStampActive(!wildStampActive);
                if (!wildStampActive) gameAudio.playPowerUpTrigger();
              }}
              className={`flex items-center gap-1 py-1 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                wildStampActive
                  ? "bg-purple-500/30 border-purple-400 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.5)] scale-105"
                  : wildStampsUsed >= 1
                  ? "bg-card/20 border-border/30 text-muted-foreground/40 cursor-not-allowed"
                  : "bg-card/40 border-border/60 text-purple-400 hover:bg-purple-500/10"
              }`}
            >
              <Star className="w-3.5 h-3.5 text-purple-400" />
              <span>{wildStampsUsed >= 1 ? "Wild (Used)" : "Wild Stamp (1x)"}</span>
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
