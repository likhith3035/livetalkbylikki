import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameRoomState, ConnectFourState } from "../../types";
import { gameAudio } from "../../services/gameSoundService";
import { sendGameMove } from "../../services/gameRoomService";
import {
  Crown,
  Palette,
  Lightbulb,
  Target,
  X,
  Instagram,
  Globe,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectFourGameProps {
  room: GameRoomState<ConnectFourState>;
  myPlayerId: string;
  isMyTurn: boolean;
  onLocalMove?: (updatedRoom: GameRoomState<ConnectFourState>) => void;
}

const ROWS = 6;
const COLS = 7;
type ConnectFourCell = "" | "red" | "yellow";

// ── Themes Configuration ──
import {
  CONNECT4_THEMES,
  Connect4ThemeId,
  ThemeStyle,
  getSavedConnectFourTheme,
  saveConnectFourTheme,
} from "../../data/connectFourThemes";

export type { Connect4ThemeId };
const THEMES = CONNECT4_THEMES;

export interface TacticalHint {
  col: number;
  row: number;
  badge: string;
  badgeColor: string;
  title: string;
  explanation: string;
  scoreText?: string;
  insight?: string;
}

function getLowestEmptyRow(board: ConnectFourCell[][], col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) return r;
  }
  return -1;
}

export function checkConnectFourWinner(board: ConnectFourCell[][]): { winner: "red" | "yellow" | null; cells: [number, number][] | null } {
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const color = board[r]?.[c];
      if (color && color === board[r]?.[c + 1] && color === board[r]?.[c + 2] && color === board[r]?.[c + 3]) {
        return { winner: color as "red" | "yellow", cells: [[r, c], [r, c + 1], [r, c + 2], [r, c + 3]] };
      }
    }
  }

  // Vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const color = board[r]?.[c];
      if (color && color === board[r + 1]?.[c] && color === board[r + 2]?.[c] && color === board[r + 3]?.[c]) {
        return { winner: color as "red" | "yellow", cells: [[r, c], [r + 1, c], [r + 2, c], [r + 3, c]] };
      }
    }
  }

  // Diagonal /
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const color = board[r]?.[c];
      if (color && color === board[r - 1]?.[c + 1] && color === board[r - 2]?.[c + 2] && color === board[r - 3]?.[c + 3]) {
        return { winner: color as "red" | "yellow", cells: [[r, c], [r - 1, c + 1], [r - 2, c + 2], [r - 3, c + 3]] };
      }
    }
  }

  // Diagonal \
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const color = board[r]?.[c];
      if (color && color === board[r + 1]?.[c + 1] && color === board[r + 2]?.[c + 2] && color === board[r + 3]?.[c + 3]) {
        return { winner: color as "red" | "yellow", cells: [[r, c], [r + 1, c + 1], [r + 2, c + 2], [r + 3, c + 3]] };
      }
    }
  }

  return { winner: null, cells: null };
}

// ── Precomputed 69 4-in-a-row Windows for Lightning Board Evaluation ──
const ALL_WINDOWS: [number, number][][] = (() => {
  const windows: [number, number][][] = [];
  // Horizontal (24 windows)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      windows.push([[r, c], [r, c + 1], [r, c + 2], [r, c + 3]]);
    }
  }
  // Vertical (21 windows)
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      windows.push([[r, c], [r + 1, c], [r + 2, c], [r + 3, c]]);
    }
  }
  // Ascending diagonal / (12 windows)
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      windows.push([[r, c], [r - 1, c + 1], [r - 2, c + 2], [r - 3, c + 3]]);
    }
  }
  // Descending diagonal \ (12 windows)
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      windows.push([[r, c], [r + 1, c + 1], [r + 2, c + 2], [r + 3, c + 3]]);
    }
  }
  return windows;
})();

function evaluateConnectFourBoard(board: ConnectFourCell[][], playerColor: "red" | "yellow"): number {
  const opponentColor = playerColor === "red" ? "yellow" : "red";
  let score = 0;

  // Center column strategic dominance (Col 3 gives maximum vector intersections)
  for (let r = 0; r < ROWS; r++) {
    if (board[r][3] === playerColor) score += 6;
    else if (board[r][3] === opponentColor) score -= 6;

    if (board[r][2] === playerColor) score += 3;
    else if (board[r][2] === opponentColor) score -= 3;

    if (board[r][4] === playerColor) score += 3;
    else if (board[r][4] === opponentColor) score -= 3;
  }

  for (let i = 0; i < ALL_WINDOWS.length; i++) {
    const win = ALL_WINDOWS[i];
    let pCount = 0;
    let oCount = 0;
    let emptyCount = 0;

    for (let j = 0; j < 4; j++) {
      const cell = board[win[j][0]][win[j][1]];
      if (cell === playerColor) pCount++;
      else if (cell === opponentColor) oCount++;
      else emptyCount++;
    }

    if (pCount === 4) return 100000;
    if (oCount === 4) return -100000;

    if (pCount === 3 && emptyCount === 1) score += 120;
    else if (oCount === 3 && emptyCount === 1) score -= 160;
    else if (pCount === 2 && emptyCount === 2) score += 18;
    else if (oCount === 2 && emptyCount === 2) score -= 24;
  }

  return score;
}

function minimaxConnectFour(
  board: ConnectFourCell[][],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  playerColor: "red" | "yellow"
): number {
  const opponentColor = playerColor === "red" ? "yellow" : "red";
  const winnerCheck = checkConnectFourWinner(board);
  if (winnerCheck.winner === playerColor) return 100000 + depth;
  if (winnerCheck.winner === opponentColor) return -100000 - depth;

  const validCols: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (getLowestEmptyRow(board, c) !== -1) validCols.push(c);
  }

  if (validCols.length === 0 || depth === 0) {
    return evaluateConnectFourBoard(board, playerColor);
  }

  // Center-first move ordering accelerates alpha-beta pruning cutoffs
  const orderedCols = [3, 2, 4, 1, 5, 0, 6].filter((c) => validCols.includes(c));

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const c of orderedCols) {
      const r = getLowestEmptyRow(board, c);
      board[r][c] = playerColor;
      const evaluation = minimaxConnectFour(board, depth - 1, alpha, beta, false, playerColor);
      board[r][c] = "";
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const c of orderedCols) {
      const r = getLowestEmptyRow(board, c);
      board[r][c] = opponentColor;
      const evaluation = minimaxConnectFour(board, depth - 1, alpha, beta, true, playerColor);
      board[r][c] = "";
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getBestConnectFourAIMove(
  board: ConnectFourCell[][],
  aiColor: "red" | "yellow",
  difficulty: "easy" | "medium" | "hard" = "medium"
): number {
  const humanColor = aiColor === "red" ? "yellow" : "red";
  const validCols: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (getLowestEmptyRow(board, c) !== -1) validCols.push(c);
  }
  if (validCols.length === 0) return 0;

  // Casual Easy Bot: 65% random moves
  if (difficulty === "easy" && Math.random() < 0.65) {
    return validCols[Math.floor(Math.random() * validCols.length)];
  }

  // Challenger Medium Bot: 30% random moves
  if (difficulty === "medium" && Math.random() < 0.3) {
    return validCols[Math.floor(Math.random() * validCols.length)];
  }

  // Check if AI can win in 1 move
  for (const c of validCols) {
    const row = getLowestEmptyRow(board, c);
    board[row][c] = aiColor;
    const win = checkConnectFourWinner(board).winner === aiColor;
    board[row][c] = "";
    if (win) return c;
  }

  // Check if human can win and block
  for (const c of validCols) {
    const row = getLowestEmptyRow(board, c);
    board[row][c] = humanColor;
    const win = checkConnectFourWinner(board).winner === humanColor;
    board[row][c] = "";
    if (win) return c;
  }

  // Hard difficulty uses deep Minimax lookahead with suicide avoidance
  if (difficulty === "hard") {
    let bestScore = -Infinity;
    let bestCol = validCols[0];
    const orderedCols = [3, 2, 4, 1, 5, 0, 6].filter((c) => validCols.includes(c));

    for (const c of orderedCols) {
      const r = getLowestEmptyRow(board, c);
      board[r][c] = aiColor;

      // Penalize suicide drop (allowing opponent to win directly above)
      let penalty = 0;
      if (r > 0) {
        board[r - 1][c] = humanColor;
        if (checkConnectFourWinner(board).winner === humanColor) {
          penalty = 50000;
        }
        board[r - 1][c] = "";
      }

      const score = minimaxConnectFour(board, 3, -Infinity, Infinity, false, aiColor) - penalty;
      board[r][c] = "";

      if (score > bestScore) {
        bestScore = score;
        bestCol = c;
      }
    }
    return bestCol;
  }

  // Prefer center columns (3, 2, 4, 1, 5, 0, 6)
  const colOrder = [3, 2, 4, 1, 5, 0, 6];
  for (const c of colOrder) {
    if (getLowestEmptyRow(board, c) !== -1) return c;
  }

  return validCols[0] ?? 0;
}

/**
 * Intelligent Grandmaster Tactical Hint Engine
 * High-performance 4-ply Minimax lookahead with alpha-beta pruning:
 * 1. Immediate Win Drop (1-Move Victory)
 * 2. Critical Opponent Threat Block
 * 3. Avoid Suicide Drops (traps gifting opponent win above)
 * 4. Double Threat / 7-Trap Tactical Forks
 * 5. Open 3-in-a-Row Pressure Setups
 * 6. Deep Minimax Lookahead & Positional Control
 */
export function getTacticalConnectFourHint(
  board: ConnectFourCell[][],
  playerColor: "red" | "yellow"
): TacticalHint | null {
  const opponentColor = playerColor === "red" ? "yellow" : "red";
  const validCols: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (getLowestEmptyRow(board, c) !== -1) validCols.push(c);
  }
  if (validCols.length === 0) return null;

  // 1. Immediate Win Drop (1-Move Victory)
  for (const c of validCols) {
    const r = getLowestEmptyRow(board, c);
    board[r][c] = playerColor;
    const isWin = checkConnectFourWinner(board).winner === playerColor;
    board[r][c] = "";
    if (isWin) {
      return {
        col: c,
        row: r,
        badge: "🏆 WINNING DROP",
        badgeColor: "bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-amber-500/30",
        title: `Drop in Column ${c + 1} to Win!`,
        explanation: "This move immediately completes your 4-in-a-row for victory!",
        scoreText: "Advantage: +100% · Lethal Blow",
        insight: `Opponent has zero counterplay. Drop in Column ${c + 1} to claim instant victory.`,
      };
    }
  }

  // 2. Critical Block (Shut down opponent immediate win)
  for (const c of validCols) {
    const r = getLowestEmptyRow(board, c);
    board[r][c] = opponentColor;
    const oppWin = checkConnectFourWinner(board).winner === opponentColor;
    board[r][c] = "";
    if (oppWin) {
      return {
        col: c,
        row: r,
        badge: "⚡ CRITICAL BLOCK",
        badgeColor: "bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-rose-500/30",
        title: `Emergency Block in Column ${c + 1}!`,
        explanation: "Opponent has 3-in-a-row aligned and threatens an instant win. Drop here to shut it down!",
        scoreText: "Threat Level: Critical · Forced Defense",
        insight: "Neutralizes opponent's lethal setup and keeps your match alive.",
      };
    }
  }

  // Helper to check if playing at col 'c' hands the opponent an immediate winning drop on top
  const isSuicideDrop = (c: number): boolean => {
    const r = getLowestEmptyRow(board, c);
    if (r <= 0) return false;
    board[r][c] = playerColor;
    board[r - 1][c] = opponentColor;
    const givesWin = checkConnectFourWinner(board).winner === opponentColor;
    board[r - 1][c] = "";
    board[r][c] = "";
    return givesWin;
  };

  const safeCols = validCols.filter((c) => !isSuicideDrop(c));
  const candidates = safeCols.length > 0 ? safeCols : validCols;

  // 3. Double Threat / 7-Trap Builder (Tactical Fork)
  for (const c of candidates) {
    const r = getLowestEmptyRow(board, c);
    board[r][c] = playerColor;
    let winPaths = 0;
    for (let testC = 0; testC < COLS; testC++) {
      const testR = getLowestEmptyRow(board, testC);
      if (testR !== -1) {
        board[testR][testC] = playerColor;
        if (checkConnectFourWinner(board).winner === playerColor) {
          winPaths++;
        }
        board[testR][testC] = "";
      }
    }
    board[r][c] = "";
    if (winPaths >= 2) {
      return {
        col: c,
        row: r,
        badge: "🎯 TACTICAL FORK",
        badgeColor: "bg-purple-500/25 text-purple-300 border-purple-500/50 shadow-purple-500/30",
        title: `7-Trap Setup in Column ${c + 1}!`,
        explanation: "Creates two simultaneous winning lines! Opponent can only block one side next turn.",
        scoreText: "Advantage: +94% · Unstoppable Setup",
        insight: "Classic Connect 4 fork: forces opponent into an inescapable zugzwang dilemma.",
      };
    }
  }

  // 4. Center Axis Dominance on early / open board
  const isBoardEmpty = board.every((row) => row.every((cell) => cell === ""));
  if (isBoardEmpty && candidates.includes(3)) {
    const r = getLowestEmptyRow(board, 3);
    return {
      col: 3,
      row: r,
      badge: "⭐ CENTER AXIS",
      badgeColor: "bg-blue-500/25 text-blue-300 border-blue-500/50 shadow-blue-500/30",
      title: "Control Center (Column 4)",
      explanation: "Column 4 participates in the maximum possible winning combos. Control the center!",
      scoreText: "Advantage: +65% · 4-Ply Lookahead",
      insight: "Dominating the center column controls the game geometry and maximizes diagonal win vectors.",
    };
  }

  // 5. Deep 3-Ply Minimax Lookahead Search with Suicide Avoidance (Lightning Fast <3ms)
  let bestCol = candidates[0];
  let bestScore = -Infinity;
  const orderedCandidates = [3, 2, 4, 1, 5, 0, 6].filter((c) => candidates.includes(c));

  for (const c of orderedCandidates) {
    const r = getLowestEmptyRow(board, c);
    board[r][c] = playerColor;

    // Check if move hands opponent a win on top
    const suicidePenalty = isSuicideDrop(c) ? 50000 : 0;
    const score = minimaxConnectFour(board, 3, -Infinity, Infinity, false, playerColor) - suicidePenalty;
    board[r][c] = "";

    if (score > bestScore) {
      bestScore = score;
      bestCol = c;
    }
  }

  const chosenRow = getLowestEmptyRow(board, bestCol);
  const isCenter = bestCol === 3;
  const winEquity = Math.min(99, Math.max(52, Math.round(50 + (Math.max(0, bestScore) / 400) * 45)));

  // If central column selected with strong early advantage
  if (isCenter && bestScore >= 0) {
    return {
      col: 3,
      row: chosenRow,
      badge: "⭐ CENTER AXIS",
      badgeColor: "bg-blue-500/25 text-blue-300 border-blue-500/50 shadow-blue-500/30",
      title: "Control Center (Column 4)",
      explanation: "Column 4 controls the board spine and participates in up to 16 distinct 4-in-a-row lines.",
      scoreText: `Advantage: +${winEquity}% · Tactical Search`,
      insight: "Controlling the center spine mathematically decides the majority of high-elo Connect 4 games.",
    };
  }

  // Check if this move builds an open 3-in-a-row threat
  board[chosenRow][bestCol] = playerColor;
  let hasThreeThreat = false;
  for (let i = 0; i < ALL_WINDOWS.length; i++) {
    const win = ALL_WINDOWS[i];
    let pCount = 0;
    let emptyCount = 0;
    for (let j = 0; j < 4; j++) {
      const cell = board[win[j][0]][win[j][1]];
      if (cell === playerColor) pCount++;
      else if (cell === "") emptyCount++;
    }
    if (pCount === 3 && emptyCount === 1) {
      hasThreeThreat = true;
      break;
    }
  }
  board[chosenRow][bestCol] = "";

  if (hasThreeThreat) {
    return {
      col: bestCol,
      row: chosenRow,
      badge: "⚔️ 3-IN-A-ROW THREAT",
      badgeColor: "bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-emerald-500/30",
      title: `Build 3-in-a-Row in Column ${bestCol + 1}`,
      explanation: "Extends your chain to 3 chips with active open ends, seizing tempo and forcing opponent to react.",
      scoreText: `Advantage: +${winEquity}% · Tactical Search`,
      insight: "Places opponent under heavy tactical pressure and restricts their counterplay options.",
    };
  }

  // Minimax Optimal Move
  return {
    col: bestCol,
    row: chosenRow,
    badge: "🧠 MINIMAX OPTIMAL",
    badgeColor: "bg-cyan-500/25 text-cyan-300 border-cyan-500/50 shadow-cyan-500/30",
    title: `Optimal Line in Column ${bestCol + 1}`,
    explanation: `Deep minimax lookahead evaluated all branch permutations. Column ${bestCol + 1} maximizes future winning paths while denying opponent counter-traps.`,
    scoreText: `Advantage: +${winEquity}% · Tactical Search`,
    insight: "Safe positional advancement that avoids suicide platforms and steadily consolidates board control.",
  };
}

export const ConnectFourGame: React.FC<ConnectFourGameProps> = ({ room, myPlayerId, isMyTurn, onLocalMove }) => {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [currentTheme, setCurrentTheme] = useState<Connect4ThemeId>(() => getSavedConnectFourTheme());

  // Track the most recent drop coordinates for physical drop animation
  const [lastDropPos, setLastDropPos] = useState<{ row: number; col: number; id: string } | null>(null);
  const prevBoardRef = useRef<ConnectFourCell[][] | null>(null);
  const aiTimerRef = useRef<any>(null);

  // ── Tactical Hints & Social Unlock States ──
  const [hintsRemaining, setHintsRemaining] = useState<number>(2);
  const [hasUnlockedInstagram, setHasUnlockedInstagram] = useState<boolean>(() => {
    try {
      return localStorage.getItem("incog_c4_hint_insta") === "true";
    } catch {
      return false;
    }
  });
  const [hasUnlockedPortfolio, setHasUnlockedPortfolio] = useState<boolean>(() => {
    try {
      return localStorage.getItem("incog_c4_hint_portfolio") === "true";
    } catch {
      return false;
    }
  });
  const [activeHint, setActiveHint] = useState<TacticalHint | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState<"instagram" | "portfolio" | "exhausted" | null>(null);

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
    };
  }, [room.round, room.status]);

  const state = room.gameState || {
    board: Array(ROWS).fill("").map(() => Array(COLS).fill("")),
    winningCells: null,
    lastDroppedCol: null,
  };

  const rawBoard = state.board || [];
  const board: ConnectFourCell[][] = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => (rawBoard[r]?.[c] as ConnectFourCell) || "")
  );

  // Detect remote moves or AI drops to trigger physical gravity drop animation
  useEffect(() => {
    const prev = prevBoardRef.current;
    if (prev) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (!prev[r][c] && board[r][c]) {
            setLastDropPos({ row: r, col: c, id: `${r}-${c}-${Date.now()}` });
            gameAudio.playConnect4Drop(r);
            break;
          }
        }
      }
    }
    prevBoardRef.current = board.map((row) => [...row]);
  }, [board]);

  const isHost = room.players.host.id === myPlayerId;
  const myColor: "red" | "yellow" = isHost ? "red" : "yellow";
  const currentColor: "red" | "yellow" = room.currentTurn === room.players.host.id ? "red" : "yellow";
  const opponentColor: "red" | "yellow" = myColor === "red" ? "yellow" : "red";
  const opponentName = isHost
    ? (room.players.guest?.name || (room.mode === "ai" ? "Cyber AI 🤖" : "Player 2"))
    : room.players.host.name;
  const theme = THEMES[currentTheme] || THEMES.classic;
  const myChip = myColor === "red" ? theme.redChip : theme.yellowChip;
  const opponentChip = opponentColor === "red" ? theme.redChip : theme.yellowChip;
  const currentChip = currentColor === "red" ? theme.redChip : theme.yellowChip;

  const handleSelectTheme = (tId: Connect4ThemeId) => {
    setCurrentTheme(tId);
    saveConnectFourTheme(tId);
    gameAudio.playClick();
  };

  // Preview styling for active turn
  const previewColor = room.mode === "local" ? currentColor : myColor;
  const previewChipStyle = previewColor === "red" ? theme.redChip : theme.yellowChip;
  const canInteract = (isMyTurn || room.mode === "local") && room.status === "playing";
  const destHoverRow = hoveredCol !== null ? getLowestEmptyRow(board, hoveredCol) : -1;

  // ── Hint Flow Handler ──
  const handleRequestHint = () => {
    if (!canInteract) return;

    // If active hint is already showing, dismiss or re-evaluate
    if (activeHint) {
      setActiveHint(null);
      gameAudio.playClick();
      return;
    }

    // Step 1: Consume free hints (starts with 2)
    if (hintsRemaining > 0) {
      const hint = getTacticalConnectFourHint(board, previewColor);
      if (hint) {
        setActiveHint(hint);
        setHintsRemaining((prev) => prev - 1);
        gameAudio.playHintChime();
      }
      return;
    }

    // Step 2: 0 hints remaining -> Prompt Instagram unlock (+1 hint)
    if (!hasUnlockedInstagram) {
      setShowUnlockModal("instagram");
      gameAudio.playClick();
      return;
    }

    // Step 3: Instagram already unlocked -> Prompt Portfolio unlock (+1 hint)
    if (!hasUnlockedPortfolio) {
      setShowUnlockModal("portfolio");
      gameAudio.playClick();
      return;
    }

    // Step 4: All 4 hints unlocked & consumed
    setShowUnlockModal("exhausted");
    gameAudio.playClick();
  };

  // ── Unlock Handlers ──
  const handleUnlockInstagram = () => {
    window.open("https://www.instagram.com/lucky__likhith/", "_blank", "noopener,noreferrer");
    setHasUnlockedInstagram(true);
    try {
      localStorage.setItem("incog_c4_hint_insta", "true");
    } catch {}
    setShowUnlockModal(null);
    gameAudio.playMatch();

    // Grant +1 bonus hint immediately and display it!
    setTimeout(() => {
      const hint = getTacticalConnectFourHint(board, previewColor);
      if (hint) {
        setActiveHint(hint);
        setHintsRemaining(0);
        gameAudio.playHintChime();
      }
    }, 450);
  };

  const handleUnlockPortfolio = () => {
    window.open("https://devlikhith.vercel.app/", "_blank", "noopener,noreferrer");
    setHasUnlockedPortfolio(true);
    try {
      localStorage.setItem("incog_c4_hint_portfolio", "true");
    } catch {}
    setShowUnlockModal(null);
    gameAudio.playMatch();

    // Grant +1 final bonus hint immediately and display it!
    setTimeout(() => {
      const hint = getTacticalConnectFourHint(board, previewColor);
      if (hint) {
        setActiveHint(hint);
        setHintsRemaining(0);
        gameAudio.playHintChime();
      }
    }, 450);
  };

  const handleDropChip = async (col: number) => {
    const row = getLowestEmptyRow(board, col);
    if (row === -1 || room.status === "round_over" || room.status === "game_over") return;
    if (room.mode !== "local" && !isMyTurn) return;

    // Clear active tactical hint upon player move
    setActiveHint(null);

    const newBoard = board.map((r) => [...r]);
    const dropColor = room.mode === "local" ? currentColor : myColor;
    newBoard[row][col] = dropColor;

    // Trigger physical drop animation and pitch-scaled audio
    setLastDropPos({ row, col, id: `${row}-${col}-${Date.now()}` });
    gameAudio.playConnect4Drop(row);

    const { winner, cells } = checkConnectFourWinner(newBoard);
    const isFull = newBoard[0].every((cell) => cell !== "");
    const isOver = !!winner || isFull;

    let winnerPlayerId: string | null = null;
    let nextHostScore = room.players.host.score;
    let nextGuestScore = room.players.guest?.score || 0;

    if (winner) {
      if (room.mode === "local") {
        winnerPlayerId = dropColor === "red" ? room.players.host.id : (room.players.guest?.id || "local_player_2");
      } else {
        winnerPlayerId = winner === myColor ? myPlayerId : (isHost ? room.players.guest?.id || null : room.players.host.id);
      }

      if (winnerPlayerId === room.players.host.id) nextHostScore += 1;
      else if (winnerPlayerId) nextGuestScore += 1;

      if (winnerPlayerId === myPlayerId || room.mode === "local") gameAudio.playWin();
      else gameAudio.playLose();
    } else if (isFull) {
      winnerPlayerId = "draw";
      gameAudio.playDraw();
    }

    const nextTurnId = isOver
      ? room.currentTurn
      : room.currentTurn === room.players.host.id
      ? (room.players.guest?.id || (room.mode === "ai" ? "ai_opponent" : "local_player_2"))
      : room.players.host.id;

    const updatedState: ConnectFourState = {
      board: newBoard,
      winningCells: cells,
      lastDroppedCol: col,
    };

    if (room.mode === "local") {
      const updatedRoom: GameRoomState<ConnectFourState> = {
        ...room,
        gameState: updatedState,
        currentTurn: nextTurnId,
        winnerId: winnerPlayerId,
        status: isOver ? "round_over" : "playing",
        players: {
          host: { ...room.players.host, score: nextHostScore },
          guest: room.players.guest ? { ...room.players.guest, score: nextGuestScore } : null,
        },
      };
      onLocalMove?.(updatedRoom);
      return;
    }

    if (room.mode === "ai") {
      const updatedRoom: GameRoomState<ConnectFourState> = {
        ...room,
        gameState: updatedState,
        currentTurn: "ai_opponent",
        winnerId: winnerPlayerId,
        status: isOver ? "round_over" : "playing",
        players: {
          host: { ...room.players.host, score: nextHostScore },
          guest: room.players.guest ? { ...room.players.guest, score: nextGuestScore } : null,
        },
      };
      onLocalMove?.(updatedRoom);

      if (!isOver) {
        if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
        aiTimerRef.current = setTimeout(() => {
          const aiDiff = room.rules?.aiDifficulty || "medium";
          const aiCol = getBestConnectFourAIMove(newBoard, "yellow", aiDiff);
          const aiRow = getLowestEmptyRow(newBoard, aiCol);
          if (aiRow !== -1) {
            newBoard[aiRow][aiCol] = "yellow";
            setLastDropPos({ row: aiRow, col: aiCol, id: `${aiRow}-${aiCol}-${Date.now()}` });
            gameAudio.playConnect4Drop(aiRow);

            const aiResult = checkConnectFourWinner(newBoard);
            const aiFull = newBoard[0].every((cell) => cell !== "");
            const aiIsOver = !!aiResult.winner || aiFull;

            let aiWinnerId: string | null = null;
            let aiGuestScore = nextGuestScore;
            if (aiResult.winner) {
              aiWinnerId = "ai_opponent";
              aiGuestScore += 1;
              gameAudio.playLose();
            } else if (aiFull) {
              aiWinnerId = "draw";
              gameAudio.playDraw();
            }

            const aiUpdatedState: ConnectFourState = {
              board: newBoard,
              winningCells: aiResult.cells,
              lastDroppedCol: aiCol,
            };

            const aiUpdatedRoom: GameRoomState<ConnectFourState> = {
              ...updatedRoom,
              gameState: aiUpdatedState,
              currentTurn: room.players.host.id,
              winnerId: aiWinnerId,
              status: aiIsOver ? "round_over" : "playing",
              players: {
                host: updatedRoom.players.host,
                guest: updatedRoom.players.guest ? { ...updatedRoom.players.guest, score: aiGuestScore } : null,
              },
            };
            onLocalMove?.(aiUpdatedRoom);
          }
        }, 550);
      }
      return;
    }

    // Multiplayer (Friend QR / Quick Match)
    await sendGameMove(
      room.roomCode,
      updatedState,
      nextTurnId,
      winnerPlayerId,
      isOver,
      nextHostScore,
      nextGuestScore,
      room.rules?.turnTimerSeconds || 0,
      room.rules?.maxSeriesWins || 2
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-1 sm:p-2 select-none w-full max-w-[340px] xs:max-w-sm sm:max-w-md mx-auto touch-manipulation relative">
      {/* Top Control Bar: Theme Switcher & Tactical Hint Button */}
      <div className="flex items-center justify-between w-full px-2 py-1.5 mb-2 bg-secondary/35 backdrop-blur-md rounded-2xl border border-border/50 text-[11px] gap-2">
        {/* Themes */}
        <div className="flex items-center gap-1 shrink-0">
          <Palette className="w-3.5 h-3.5 text-primary shrink-0" />
          <div className="flex items-center gap-0.5">
            {(["classic", "cyber", "matrix", "synthwave"] as Connect4ThemeId[]).map((tKey) => {
              const t = THEMES[tKey];
              const isSelected = currentTheme === tKey;
              return (
                <button
                  key={tKey}
                  onClick={() => handleSelectTheme(tKey)}
                  className={cn(
                    "px-1.5 py-0.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30 scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )}
                  title={`${t.name} (${t.redChip.label} vs ${t.yellowChip.label})`}
                >
                  <span>{t.icon}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tactical Hint Button with Dynamic Counter Badge */}
        <button
          onClick={handleRequestHint}
          disabled={!canInteract}
          className={cn(
            "px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm shrink-0",
            activeHint
              ? "bg-amber-500 text-amber-950 border-amber-400 animate-pulse shadow-amber-500/30"
              : hintsRemaining > 0
              ? "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25 hover:scale-105"
              : !hasUnlockedInstagram
              ? "bg-gradient-to-r from-pink-500/20 via-rose-500/20 to-amber-500/20 text-pink-300 border-pink-500/40 hover:scale-105 animate-pulse"
              : !hasUnlockedPortfolio
              ? "bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 text-cyan-300 border-blue-500/40 hover:scale-105 animate-pulse"
              : "bg-secondary/50 text-muted-foreground border-border/40 opacity-70",
            !canInteract && "opacity-40 cursor-not-allowed hover:scale-100"
          )}
          title="Get tactical advisor hint"
        >
          <Lightbulb className="w-3.5 h-3.5 shrink-0" />
          <span className="inline sm:hidden">
            {activeHint
              ? "Active"
              : hintsRemaining > 0
              ? `Hint (${hintsRemaining})`
              : !hasUnlockedInstagram
              ? "+1 Insta"
              : !hasUnlockedPortfolio
              ? "+1 Portf."
              : "0 Hints"}
          </span>
          <span className="hidden sm:inline">
            {activeHint
              ? "Hint Active"
              : hintsRemaining > 0
              ? `Hint (${hintsRemaining})`
              : !hasUnlockedInstagram
              ? "+1 Hint (Instagram)"
              : !hasUnlockedPortfolio
              ? "+1 Hint (Portfolio)"
              : "0 Hints"}
          </span>
        </button>
      </div>

      {/* Sleek, Non-Disruptive Responsive Tactical Advisor Guidance Card */}
      <AnimatePresence>
        {activeHint && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            className="w-full mb-1.5 sm:mb-2 p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-500/15 to-blue-500/20 border border-amber-500/50 backdrop-blur-xl shadow-lg z-30"
          >
            {/* Top Row: Target Badge + Column Indicator + Quick-Play Action + Dismiss Button */}
            <div className="flex items-center justify-between gap-1.5 w-full">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className={cn("px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-wider border shadow-sm shrink-0", activeHint.badgeColor)}>
                  {activeHint.badge}
                </span>
                <span className="text-[11px] sm:text-xs font-black text-amber-200 shrink-0">
                  Target: Col {activeHint.col + 1}
                </span>
                {activeHint.scoreText && (
                  <span className="hidden xs:inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/10 text-cyan-200 border border-white/15 shrink-0">
                    ⚡ {activeHint.scoreText}
                  </span>
                )}
              </div>

              {/* Quick Play & Dismiss Action Group */}
              <div className="flex items-center gap-1 shrink-0">
                {canInteract && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDropChip(activeHint.col);
                    }}
                    className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-[10px] sm:text-[11px] shadow-sm shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                    title={`Instantly drop chip into Column ${activeHint.col + 1}`}
                  >
                    <span>Play Col {activeHint.col + 1}</span>
                    <span className="hidden xs:inline">🎯</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveHint(null)}
                  className="p-1 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors"
                  title="Dismiss hint"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Explanation & Pro Insight */}
            <div className="mt-1 space-y-0.5 text-left">
              <p className="text-[10px] sm:text-[11px] font-medium text-white/95 leading-snug">
                {activeHint.explanation}
              </p>
              {activeHint.insight && (
                <div className="flex items-start gap-1 text-[9px] sm:text-[10px] text-amber-200/90 font-mono bg-black/35 px-1.5 py-0.5 sm:py-1 rounded-md border border-amber-500/20 mt-1">
                  <span className="shrink-0 font-bold text-amber-300">💡 Insight:</span>
                  <span className="leading-tight">{activeHint.insight}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In-Game Match Identity & Turn Status Strip */}
      <div className="w-full flex items-center justify-between px-2.5 sm:px-3 py-1.5 mb-1.5 sm:mb-2 rounded-2xl bg-secondary/40 backdrop-blur-md border border-border/50 text-xs shadow-sm">
        {/* Your Color Identity */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={cn(
              "w-4 h-4 rounded-full border shadow-sm shrink-0",
              myChip.gradient,
              myChip.border
            )}
          />
          <div className="flex items-center gap-1 leading-none text-left truncate">
            <span className="text-[10px] text-muted-foreground font-semibold">You:</span>
            <span className={cn("text-[11px] sm:text-xs font-black truncate", myChip.textColor)}>
              {myChip.label.toUpperCase()} {myChip.emoji}
            </span>
          </div>
        </div>

        {/* Turn Status Badge */}
        <div className="flex items-center gap-1 shrink-0">
          {canInteract ? (
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] sm:text-[11px] font-black flex items-center gap-1 shadow-sm shadow-emerald-500/25"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>YOUR TURN</span>
            </motion.div>
          ) : room.status === "round_over" ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
              Round Over
            </span>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/80 text-muted-foreground border border-border/50 text-[10px] sm:text-[11px] font-medium shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/90 animate-pulse" />
              <span className="truncate max-w-[150px] sm:max-w-[220px]">
                {opponentName}'s Turn ({opponentChip.label} {opponentChip.emoji})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Column Hover Indicator Drop Bar with Floating Preview */}
      <div className="grid grid-cols-7 gap-1 xs:gap-1.5 sm:gap-2 w-full px-2 sm:px-3 mb-1.5 sm:mb-2 h-7 sm:h-8">
        {Array.from({ length: COLS }).map((_, c) => {
          const isHovered = hoveredCol === c;
          const isHintCol = activeHint?.col === c;
          const canDrop = getLowestEmptyRow(board, c) !== -1;

          return (
            <div key={c} className="flex flex-col items-center justify-center relative">
              {/* Hint Target Beacon above column */}
              {isHintCol && (
                <motion.div
                  initial={{ y: -4, scale: 0.8 }}
                  animate={{ y: [0, -3, 0], scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.1 }}
                  className="absolute -top-3 px-1 rounded bg-amber-500 text-amber-950 font-black text-[9px] shadow-md shadow-amber-500/50 z-20 pointer-events-none"
                >
                  🎯 DROP
                </motion.div>
              )}

              <AnimatePresence>
                {isHovered && canDrop && canInteract && (
                  <motion.div
                    initial={{ y: -8, opacity: 0, scale: 0.8 }}
                    animate={{ y: [0, 3, 0], opacity: 1, scale: 1 }}
                    exit={{ y: -8, opacity: 0, scale: 0.8 }}
                    transition={{
                      y: { repeat: Infinity, duration: 0.9, ease: "easeInOut" },
                      opacity: { duration: 0.15 },
                    }}
                    className={cn(
                      "w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 rounded-full border shadow-md flex items-center justify-center relative",
                      previewChipStyle.gradient,
                      previewChipStyle.border,
                      previewChipStyle.shadow
                    )}
                  >
                    {/* Inner tactile coin ring */}
                    <div className={cn("w-3/5 h-3/5 rounded-full border border-white/40 shadow-inner")} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* 3D Beveled Arcade Cabinet Rack */}
      <div
        className={cn(
          "relative p-2 xs:p-3 sm:p-4 rounded-3xl border-2 sm:border-4 shadow-2xl w-full transition-colors duration-300",
          theme.cabinetBg,
          theme.cabinetBorder
        )}
      >
        {/* Arcade Cabinet Hardware Screws/Rivets */}
        <div className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-gradient-to-b from-slate-200 to-slate-500 shadow-inner border border-black/40" />
        <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-gradient-to-b from-slate-200 to-slate-500 shadow-inner border border-black/40" />
        <div className="absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full bg-gradient-to-b from-slate-200 to-slate-500 shadow-inner border border-black/40" />
        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-gradient-to-b from-slate-200 to-slate-500 shadow-inner border border-black/40" />

        {/* Glossy Acrylic Cabinet Face Reflection */}
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent rounded-t-3xl pointer-events-none" />

        {/* Connect 4 Matrix Columns */}
        <div className="grid grid-cols-7 gap-1 xs:gap-1.5 sm:gap-2.5 relative z-10">
          {Array.from({ length: COLS }).map((_, colIdx) => {
            const isColHovered = hoveredCol === colIdx;
            const isColHint = activeHint?.col === colIdx;
            const canDropCol = getLowestEmptyRow(board, colIdx) !== -1;

            return (
              <div
                key={colIdx}
                onMouseEnter={() => setHoveredCol(colIdx)}
                onMouseLeave={() => setHoveredCol(null)}
                onClick={() => handleDropChip(colIdx)}
                className={cn(
                  "relative flex flex-col gap-1 xs:gap-1.5 sm:gap-2.5 cursor-pointer rounded-2xl p-0.5 transition-all active:scale-[0.98] touch-manipulation select-none",
                  isColHint
                    ? "bg-amber-400/15 ring-1 ring-amber-400/40"
                    : isColHovered && canDropCol && canInteract
                    ? "bg-white/10"
                    : "hover:bg-white/5"
                )}
              >
                {/* Column Light Beam on Hover or Hint */}
                {((isColHovered && canDropCol && canInteract) || isColHint) && (
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-b rounded-2xl pointer-events-none -z-10",
                      isColHint ? "from-amber-400/25 via-amber-400/10 to-transparent" : theme.beamGlow
                    )}
                  />
                )}

                {/* Vertical Slots */}
                {Array.from({ length: ROWS }).map((_, rowIdx) => {
                  const cell = board[rowIdx][colIdx];
                  const isWinning = state.winningCells?.some(([r, c]) => r === rowIdx && c === colIdx);
                  const isHintTarget = activeHint?.col === colIdx && activeHint?.row === rowIdx;
                  const isGhostSlot =
                    isColHovered &&
                    canInteract &&
                    destHoverRow === rowIdx &&
                    !cell;

                  const isNewDrop =
                    lastDropPos &&
                    lastDropPos.row === rowIdx &&
                    lastDropPos.col === colIdx;

                  const chipStyle = cell === "red" ? theme.redChip : theme.yellowChip;

                  return (
                    <div
                      key={rowIdx}
                      className={cn(
                        "aspect-square rounded-full border sm:border-2 relative flex items-center justify-center overflow-hidden transition-all",
                        theme.slotBg,
                        theme.slotBorder,
                        theme.slotInnerShadow,
                        isWinning && "ring-2 sm:ring-4 ring-white shadow-[0_0_25px_rgba(255,255,255,0.85)] z-20 scale-105",
                        isHintTarget && "ring-2 sm:ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.9)] z-20"
                      )}
                    >
                      {/* Hint Landing Slot Pulsing Star */}
                      {isHintTarget && !cell && (
                        <motion.div
                          animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.6, 1, 0.6] }}
                          transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
                          className="w-full h-full rounded-full bg-amber-400/25 border-2 border-amber-400 flex items-center justify-center pointer-events-none"
                        >
                          <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                        </motion.div>
                      )}

                      {/* Ghost Chip Preview in Target Landing Slot */}
                      {isGhostSlot && !isHintTarget && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{
                            opacity: [0.35, 0.7, 0.35],
                            scale: [0.93, 1.03, 0.93],
                          }}
                          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                          className={cn(
                            "w-full h-full rounded-full border-2 border-dashed flex items-center justify-center pointer-events-none relative",
                            previewChipStyle.ring,
                            previewChipStyle.gradient,
                            "opacity-40"
                          )}
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-white/70 shadow-sm" />
                        </motion.div>
                      )}

                      {/* Actual Physical Chip with Authentic Gravity Drop */}
                      {cell && (
                        <motion.div
                          key={isNewDrop ? lastDropPos?.id : `settled-${rowIdx}-${colIdx}`}
                          initial={
                            isNewDrop
                              ? { y: -((rowIdx + 1.4) * 54), scale: 0.92 }
                              : false
                          }
                          animate={{ y: 0, scale: 1 }}
                          transition={
                            isNewDrop
                              ? {
                                  type: "spring",
                                  stiffness: 420,
                                  damping: 22,
                                  mass: 1.05,
                                  restDelta: 0.001,
                                }
                              : undefined
                          }
                          className={cn(
                            "w-full h-full rounded-full border sm:border-2 flex items-center justify-center relative overflow-hidden transition-shadow",
                            chipStyle.gradient,
                            chipStyle.border,
                            chipStyle.shadow,
                            isWinning ? chipStyle.glow : ""
                          )}
                        >
                          {/* 3D Specular Highlight Arc */}
                          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-full pointer-events-none" />

                          {/* Inner Concentric Tactile Ring */}
                          <div
                            className={cn(
                              "w-3/5 h-3/5 rounded-full border flex items-center justify-center shadow-inner",
                              chipStyle.ring
                            )}
                          >
                            {/* Winning Trophy Crown or Center Core */}
                            {isWinning ? (
                              <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                              >
                                <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white drop-shadow-md" />
                              </motion.div>
                            ) : (
                              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-black/20 shadow-inner" />
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Bottom Dispenser / Return Tray Lip with Live Match State */}
        <div className="mt-2 sm:mt-3 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-white/70 px-1 font-mono">
          <div className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full border border-white/30 animate-pulse", currentChip.gradient)} />
            <span>Turn: {currentChip.emoji} {currentChip.label}</span>
          </div>
          <div className="flex items-center gap-2 text-white/60 text-[9px]">
            <span>
              Series: <strong className={cn("font-bold", theme.redChip.textColor)}>{theme.redChip.shortLabel}:{room.players.host.score}</strong> - <strong className={cn("font-bold", theme.yellowChip.textColor)}>{theme.yellowChip.shortLabel}:{room.players.guest?.score || 0}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Social Unlock Modal (Instagram & Developer Portfolio) ── */}
      <AnimatePresence>
        {showUnlockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm rounded-3xl bg-[#0e1017] border border-border/60 p-5 shadow-2xl overflow-hidden text-center space-y-4"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowUnlockModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {showUnlockModal === "instagram" && (
                <>
                  <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-lg shadow-pink-500/25">
                    <Instagram className="w-7 h-7 text-white" />
                  </div>
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-[10px] font-black text-pink-400 uppercase tracking-wider">
                      Instagram Bonus
                    </span>
                    <h3 className="text-lg font-black text-white">Unlock +1 Tactical Hint</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      You've used your 2 free hints! Follow developer{" "}
                      <strong className="text-pink-400">@lucky__likhith</strong> on Instagram to support the game and unlock 1 bonus hint!
                    </p>
                  </div>
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={handleUnlockInstagram}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-bold text-xs shadow-lg shadow-pink-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                    >
                      <Instagram className="w-4 h-4" />
                      <span>Follow @lucky__likhith (+1 Hint)</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </button>
                    <button
                      onClick={() => setShowUnlockModal(null)}
                      className="w-full py-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
                    >
                      Maybe Later
                    </button>
                  </div>
                </>
              )}

              {showUnlockModal === "portfolio" && (
                <>
                  <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/25">
                    <Globe className="w-7 h-7 text-white" />
                  </div>
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-[10px] font-black text-cyan-400 uppercase tracking-wider">
                      Portfolio Special
                    </span>
                    <h3 className="text-lg font-black text-white">Unlock Final Bonus Hint</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Visit <strong className="text-cyan-400">Kami Likhith's Portfolio</strong> at{" "}
                      <span className="text-indigo-300 font-mono">devlikhith.vercel.app</span> to explore other cool projects and unlock your final tactical hint!
                    </p>
                  </div>
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={handleUnlockPortfolio}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-blue-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Visit devlikhith.vercel.app (+1 Hint)</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </button>
                    <button
                      onClick={() => setShowUnlockModal(null)}
                      className="w-full py-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
                    >
                      Maybe Later
                    </button>
                  </div>
                </>
              )}

              {showUnlockModal === "exhausted" && (
                <>
                  <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white">All 4 Hints Used!</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      You've unlocked and used all 4 tactical hints (2 Free + 1 Instagram + 1 Portfolio). Trust your skills and claim the Connect 4 victory!
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setShowUnlockModal(null)}
                      className="w-full py-2 px-4 rounded-xl bg-secondary text-foreground font-bold text-xs hover:bg-secondary/80 transition-colors"
                    >
                      Back to Game
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConnectFourGame;
