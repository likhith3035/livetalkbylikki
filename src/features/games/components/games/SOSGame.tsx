import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameRoomState, SOSGameState, SOSLine } from "../../types";
import { gameAudio } from "../../services/gameSoundService";
import { sendGameMove } from "../../services/gameRoomService";
import {
  Sparkles,
  Zap,
  Flame,
  Trophy,
  Bomb,
  HelpCircle,
  Shield,
  Bot,
  Swords,
  Crown,
  Grid3X3,
  RotateCcw,
} from "lucide-react";

interface SOSGameProps {
  room: GameRoomState<SOSGameState>;
  myPlayerId: string;
  isMyTurn: boolean;
  onLocalMove?: (updatedRoom: GameRoomState<SOSGameState>) => void;
}

// ── Particle Sparks Engine for SOS Line Explosions ──

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

// ── AI Persona Configuration ──

export interface AIPersona {
  id: "rookie" | "viper" | "overlord";
  name: string;
  avatar: string;
  title: string;
  color: string;
  quotes: {
    start: string[];
    onMove: string[];
    onScore: string[];
    onOpponentScore: string[];
    onWin: string[];
    onLose: string[];
  };
}

export const AI_PERSONAS: Record<string, AIPersona> = {
  rookie: {
    id: "rookie",
    name: "Cyber-Rookie",
    avatar: "🤖",
    title: "Casual Bot (Easy)",
    color: "#38bdf8",
    quotes: {
      start: ["Hi! Let's play a friendly game of SOS!", "Hope I make good moves today!"],
      onMove: ["Placing my letter here...", "How about this spot?", "Let's try this one!"],
      onScore: ["Yay! I got an SOS! Extra turn!", "Woohoo! Point for me!"],
      onOpponentScore: ["Whoa, great move!", "Oof, I didn't see that coming!"],
      onWin: ["Gg! That was super fun!", "Thanks for playing with me!"],
      onLose: ["You're awesome! Rematch soon?", "Well played, human!"],
    },
  },
  viper: {
    id: "viper",
    name: "Neon Viper",
    avatar: "⚡",
    title: "Tactician Bot (Medium)",
    color: "#fbbf24",
    quotes: {
      start: ["Get ready! Speed and precision win this arena.", "Let's see if you can keep up!"],
      onMove: ["Setting my grid trap...", "Calculated placement.", "Watch this flank."],
      onScore: ["Boom! Multi-streak unlocked!", "Bonus turn is mine, let's keep going!"],
      onOpponentScore: ["Nice reflex, but I'm adapting.", "You got lucky there."],
      onWin: ["Victory claimed! Precision always triumphs.", "Good attempt, try a faster trap!"],
      onLose: ["Impressive tactics! You actually outmaneuvered me.", "Respect! Next round will be tougher!"],
    },
  },
  overlord: {
    id: "overlord",
    name: "Quantum Overlord",
    avatar: "👑",
    title: "Grandmaster Bot (Hard)",
    color: "#f43f5e",
    quotes: {
      start: ["Initiating quantum predictive algorithms. Resistance is futile.", "All grid permutations simulated."],
      onMove: ["Minimax evaluation complete. Optimal node selected.", "Securing spatial dominance."],
      onScore: ["Inevitability manifest. +1 SOS recorded.", "Multi-vector sequence completed. Bonus phase engaged."],
      onOpponentScore: ["A localized anomaly. It will not alter the statistical outcome.", "Noted in anomaly registry."],
      onWin: ["Simulations verified. Total quantum dominance achieved.", "Your strategy was mathematically suboptimal."],
      onLose: ["Impossible... A quantum divergence occurred. Fascinating.", "You have surpassed my predictive bounds."],
    },
  },
};

// ── 4-Way S-O-S Line Detection Algorithm ──

export interface SOSDetectionResult {
  newLines: SOSLine[];
  scoreGained: number;
}

function getCanonicalLineKey(r1: number, c1: number, r2: number, c2: number): string {
  if (r1 < r2 || (r1 === r2 && c1 <= c2)) {
    return `${r1},${c1}-${r2},${c2}`;
  }
  return `${r2},${c2}-${r1},${c1}`;
}

export function detectSOSAtMove(
  board: string[][],
  row: number,
  col: number,
  letter: "S" | "O" | "?",
  playerId: string,
  playerColor: string,
  existingLines: SOSLine[] = []
): SOSDetectionResult {
  const gridSize = board.length;
  const existingKeys = new Set(
    existingLines.map((l) => getCanonicalLineKey(l.startRow, l.startCol, l.endRow, l.endCol))
  );

  const foundLines: SOSLine[] = [];

  const checkMatch = (r: number, c: number, expected: "S" | "O"): boolean => {
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return false;
    const cellVal = board[r][c];
    if (cellVal === "?") return true; // Wildcard acts as both S and O
    return cellVal === expected;
  };

  const checkAndAdd = (
    r1: number,
    c1: number,
    r2: number,
    c2: number,
    r3: number,
    c3: number,
    dir: "h" | "v" | "d_main" | "d_anti"
  ) => {
    if (checkMatch(r1, c1, "S") && checkMatch(r2, c2, "O") && checkMatch(r3, c3, "S")) {
      let startR = r1, startC = c1, endR = r3, endC = c3;
      if (startR > endR || (startR === endR && startC > endC)) {
        startR = r3;
        startC = c3;
        endR = r1;
        endC = c1;
      }
      const key = `${startR},${startC}-${endR},${endC}`;
      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        foundLines.push({
          id: key,
          startRow: startR,
          startCol: startC,
          endRow: endR,
          endCol: endC,
          direction: dir,
          ownerPlayerId: playerId,
          color: playerColor,
        });
      }
    }
  };

  // Evaluate as 'S' if letter is 'S' or wildcard '?'
  if (letter === "S" || letter === "?") {
    const directions: [number, number, "h" | "v" | "d_main" | "d_anti"][] = [
      [0, 1, "h"], // Right
      [0, -1, "h"], // Left
      [1, 0, "v"], // Down
      [-1, 0, "v"], // Up
      [1, 1, "d_main"], // Down-Right ↘
      [-1, -1, "d_main"], // Up-Left ↖
      [-1, 1, "d_anti"], // Up-Right ↗
      [1, -1, "d_anti"], // Down-Left ↙
    ];

    for (const [dr, dc, dir] of directions) {
      const midR = row + dr;
      const midC = col + dc;
      const endR = row + 2 * dr;
      const endC = col + 2 * dc;
      checkAndAdd(row, col, midR, midC, endR, endC, dir);
    }
  }

  // Evaluate as 'O' if letter is 'O' or wildcard '?'
  if (letter === "O" || letter === "?") {
    const pairs: [number, number, "h" | "v" | "d_main" | "d_anti"][] = [
      [0, 1, "h"], // Horizontal
      [1, 0, "v"], // Vertical
      [1, 1, "d_main"], // Main Diagonal ↘
      [-1, 1, "d_anti"], // Anti Diagonal ↗
    ];

    for (const [dr, dc, dir] of pairs) {
      const r1 = row - dr;
      const c1 = col - dc;
      const r3 = row + dr;
      const c3 = col + dc;
      checkAndAdd(r1, c1, row, col, r3, c3, dir);
    }
  }

  return {
    newLines: foundLines,
    scoreGained: foundLines.length,
  };
}

// ── Smart AI Bot Engine with Personas ──

export interface AIBotMove {
  row: number;
  col: number;
  letter: "S" | "O" | "?";
  usePowerUp?: "2x" | "bomb" | "wildcard";
}

export function getSmartSOSAIMove(
  board: string[][],
  existingLines: SOSLine[],
  aiPlayerId: string,
  difficulty: "easy" | "medium" | "hard" = "medium"
): AIBotMove {
  const gridSize = board.length;
  const emptyCells: [number, number][] = [];

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (!board[r][c]) {
        emptyCells.push([r, c]);
      }
    }
  }

  if (emptyCells.length === 0) {
    return { row: 0, col: 0, letter: "S" };
  }

  // Easy mode (Cyber-Rookie): 65% random moves
  if (difficulty === "easy" && Math.random() < 0.65) {
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const randomLetter: "S" | "O" = Math.random() < 0.5 ? "S" : "O";
    return { row: randomCell[0], col: randomCell[1], letter: randomLetter };
  }

  // Medium mode (Neon Viper): 25% random moves
  if (difficulty === "medium" && Math.random() < 0.25) {
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const randomLetter: "S" | "O" = Math.random() < 0.5 ? "S" : "O";
    return { row: randomCell[0], col: randomCell[1], letter: randomLetter };
  }

  // ── Step 1: Immediate SOS Capture ──
  let bestScore = 0;
  let winningMoves: AIBotMove[] = [];

  for (const [r, c] of emptyCells) {
    for (const letter of ["S", "O"] as const) {
      board[r][c] = letter;
      const res = detectSOSAtMove(board, r, c, letter, aiPlayerId, "#ec4899", existingLines);
      board[r][c] = "";

      if (res.scoreGained > bestScore) {
        bestScore = res.scoreGained;
        winningMoves = [{ row: r, col: c, letter }];
      } else if (res.scoreGained === bestScore && res.scoreGained > 0) {
        winningMoves.push({ row: r, col: c, letter });
      }
    }
  }

  if (bestScore > 0 && winningMoves.length > 0) {
    return winningMoves[Math.floor(Math.random() * winningMoves.length)];
  }

  // ── Step 2: Trap Avoidance & Minimax Safety ──
  const safeMoves: { move: AIBotMove; hazard: number }[] = [];

  for (const [r, c] of emptyCells) {
    for (const letter of ["S", "O"] as const) {
      board[r][c] = letter;

      let opponentMaxScore = 0;
      for (const [or, oc] of emptyCells) {
        if (or === r && oc === c) continue;
        for (const oletter of ["S", "O"] as const) {
          board[or][oc] = oletter;
          const oppRes = detectSOSAtMove(board, or, oc, oletter, "opponent", "#06b6d4", existingLines);
          board[or][oc] = "";
          if (oppRes.scoreGained > opponentMaxScore) {
            opponentMaxScore = oppRes.scoreGained;
          }
        }
      }

      board[r][c] = "";
      safeMoves.push({
        move: { row: r, col: c, letter },
        hazard: opponentMaxScore,
      });
    }
  }

  safeMoves.sort((a, b) => a.hazard - b.hazard);

  const minHazard = safeMoves[0]?.hazard ?? 0;
  const bestSafeMoves = safeMoves.filter((m) => m.hazard === minHazard);

  if (bestSafeMoves.length > 0) {
    return bestSafeMoves[Math.floor(Math.random() * bestSafeMoves.length)].move;
  }

  return { row: emptyCells[0][0], col: emptyCells[0][1], letter: "S" };
}

// ── Main Super SOS Neon Duel Deluxe Component ──

export const SOSGame: React.FC<SOSGameProps> = ({ room, myPlayerId, isMyTurn, onLocalMove }) => {
  const rawState = room.gameState;
  const gridSize = rawState?.gridSize || 6;

  const board: string[][] = useMemo(() => {
    if (rawState?.board && Array.isArray(rawState.board) && rawState.board.length === gridSize) {
      return rawState.board.map((row) => (Array.isArray(row) ? [...row] : Array(gridSize).fill("")));
    }
    return Array(gridSize).fill("").map(() => Array(gridSize).fill(""));
  }, [rawState?.board, gridSize]);

  const lines: SOSLine[] = useMemo(() => {
    return Array.isArray(rawState?.lines) ? rawState.lines : [];
  }, [rawState?.lines]);

  const hostScore = rawState?.hostScore ?? 0;
  const guestScore = rawState?.guestScore ?? 0;
  const streakCount = rawState?.streakCount ?? 0;

  const [selectedLetter, setSelectedLetter] = useState<"S" | "O" | "?">("S");
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);
  const [activePowerUp, setActivePowerUp] = useState<"2x" | "bomb" | "wildcard" | null>(null);
  const [bonusTurnBanner, setBonusTurnBanner] = useState<{ text: string; color: string; id: number } | null>(null);
  const [aiSpeech, setAiSpeech] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const isAIMode = room.mode === "ai";
  const isLocalMode = room.mode === "local";

  const hostColor = "#06b6d4"; // Cyan Neon
  const guestColor = "#f43f5e"; // Rose Pink Neon
  const currentTurnColor = room.currentTurn === room.players.host.id ? hostColor : guestColor;

  const aiDifficulty = room.rules?.aiDifficulty || "medium";
  const personaKey = aiDifficulty === "easy" ? "rookie" : aiDifficulty === "hard" ? "overlord" : "viper";
  const aiPersona = AI_PERSONAS[personaKey];

  const activePlayerName = room.currentTurn === room.players.host.id
    ? room.players.host.name
    : room.players.guest?.name || (isAIMode ? aiPersona.name : "Player 2");

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "s" || e.key === "S") {
        setSelectedLetter("S");
        gameAudio.playClick();
      } else if (e.key === "o" || e.key === "O" || e.key === "0") {
        setSelectedLetter("O");
        gameAudio.playClick();
      } else if (e.key === "w" || e.key === "W") {
        setSelectedLetter("?");
        gameAudio.playClick();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Particle Sparks Animation Engine ──
  const spawnLineParticles = useCallback((newLines: SOSLine[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    for (const line of newLines) {
      const x1 = ((line.startCol + 0.5) / gridSize) * w;
      const y1 = ((line.startRow + 0.5) / gridSize) * h;
      const x2 = ((line.endCol + 0.5) / gridSize) * w;
      const y2 = ((line.endRow + 0.5) / gridSize) * h;

      // Spawn 30 glowing sparks along the laser line
      for (let i = 0; i < 30; i++) {
        const t = Math.random();
        const px = x1 + (x2 - x1) * t;
        const py = y1 + (y2 - y1) * t;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1.5;

        particlesRef.current.push({
          x: px,
          y: py,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3.5 + 1.5,
          color: line.color,
          alpha: 1,
          life: 0,
          maxLife: Math.random() * 35 + 25,
        });
      }
    }
  }, [gridSize]);

  // Particle loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;
    const render = () => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        if (p.life >= p.maxLife || p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      isRunning = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // AI Speech bubble generator
  const triggerAiSpeech = useCallback((type: "onMove" | "onScore" | "onOpponentScore") => {
    if (!isAIMode) return;
    const quotes = aiPersona.quotes[type];
    if (!quotes || quotes.length === 0) return;
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    setAiSpeech(quote);
    setTimeout(() => setAiSpeech(null), 3000);
  }, [isAIMode, aiPersona]);

  // Handle cell click / move execution
  const handleCellClick = useCallback(async (
    r: number,
    c: number,
    overrideLetter?: "S" | "O" | "?",
    usedPowerUp?: "2x" | "bomb" | "wildcard"
  ) => {
    if (board[r][c] && usedPowerUp !== "bomb") return;
    if (room.status === "round_over" || room.status === "game_over") return;

    const isCurrentlyAITurn = isAIMode && room.currentTurn !== room.players.host.id;
    if (!isLocalMode) {
      if (isAIMode) {
        if (!isMyTurn && !isCurrentlyAITurn) return;
      } else {
        if (!isMyTurn) return;
      }
    }

    const actingPlayerId = isLocalMode || isCurrentlyAITurn ? room.currentTurn : myPlayerId;
    const actingPlayerColor = actingPlayerId === room.players.host.id ? hostColor : guestColor;
    const currentPowerUp = usedPowerUp || activePowerUp;

    let newBoard = board.map((row) => [...row]);

    // ── Power-Up 1: EMP Bomb Quadrant Blast ──
    if (currentPowerUp === "bomb") {
      gameAudio.playBombExplosion();

      // Clear 3x3 surrounding zone
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const br = r + dr;
          const bc = c + dc;
          if (br >= 0 && br < gridSize && bc >= 0 && bc < gridSize) {
            newBoard[br][bc] = "";
          }
        }
      }
      setActivePowerUp(null);

      const nextRoomState: GameRoomState<SOSGameState> = {
        ...room,
        gameState: {
          gridSize,
          board: newBoard,
          lines,
          hostScore,
          guestScore,
          streakCount: 0,
          lastMove: {
            row: r,
            col: c,
            letter: "?",
            playerId: actingPlayerId,
            newLinesCount: 0,
          },
        },
        currentTurn: actingPlayerId === room.players.host.id ? (room.players.guest?.id || "guest") : room.players.host.id,
        lastMoveTimestamp: Date.now(),
      };

      if (isLocalMode || isAIMode) {
        onLocalMove?.(nextRoomState);
      } else {
        await sendGameMove(
          room.roomCode,
          nextRoomState.gameState,
          nextRoomState.currentTurn,
          null,
          false,
          hostScore,
          guestScore,
          room.rules?.turnTimerSeconds || 0,
          room.rules?.maxSeriesWins || 2
        );
      }
      return;
    }

    const letterToPlace = overrideLetter || (currentPowerUp === "wildcard" ? "?" : selectedLetter);
    newBoard[r][c] = letterToPlace;

    // Detect new SOS lines
    const { newLines, scoreGained } = detectSOSAtMove(
      newBoard,
      r,
      c,
      letterToPlace,
      actingPlayerId,
      actingPlayerColor,
      lines
    );

    const updatedLines = [...lines, ...newLines];
    let nextHostScore = hostScore;
    let nextGuestScore = guestScore;
    const isDoublePoints = currentPowerUp === "2x";
    const actualPointsAdded = isDoublePoints ? scoreGained * 2 : scoreGained;

    if (actingPlayerId === room.players.host.id) {
      nextHostScore += actualPointsAdded;
    } else {
      nextGuestScore += actualPointsAdded;
    }

    const nextStreak = scoreGained > 0 ? streakCount + 1 : 0;
    const isBonusTurn = scoreGained > 0;
    const nextTurnId = isBonusTurn
      ? actingPlayerId
      : actingPlayerId === room.players.host.id
      ? room.players.guest?.id || "guest_player"
      : room.players.host.id;

    // Audio, haptics & visual sparks
    if (isBonusTurn) {
      spawnLineParticles(newLines);
      gameAudio.playComboAscend(nextStreak);

      const comboText = nextStreak > 2 ? "💥 MEGA COMBO!" : nextStreak === 2 ? "⚡ 2x ULTRA STREAK!" : "🔥 SOS STRIKE!";
      setBonusTurnBanner({
        text: `+${actualPointsAdded} ${comboText} EXTRA TURN!`,
        color: actingPlayerColor,
        id: Date.now(),
      });
      setTimeout(() => setBonusTurnBanner(null), 2200);

      if (actingPlayerId === room.players.host.id) {
        triggerAiSpeech("onOpponentScore");
      } else {
        triggerAiSpeech("onScore");
      }
    } else {
      gameAudio.playLetterPlace(letterToPlace === "?" ? "S" : letterToPlace);
      if (actingPlayerId !== room.players.host.id) {
        triggerAiSpeech("onMove");
      }
    }

    if (activePowerUp) {
      setActivePowerUp(null);
    }

    // Check Board Completion (Game Over)
    const isBoardFull = newBoard.every((row) => row.every((cell) => cell !== ""));
    const isOver = isBoardFull;

    let winnerPlayerId: string | null = null;
    let nextSeriesHostScore = room.players.host.score;
    let nextSeriesGuestScore = room.players.guest?.score || 0;

    if (isOver) {
      if (nextHostScore > nextGuestScore) {
        winnerPlayerId = room.players.host.id;
        nextSeriesHostScore += 1;
        gameAudio.playWin();
      } else if (nextGuestScore > nextHostScore) {
        winnerPlayerId = room.players.guest?.id || "guest_player";
        nextSeriesGuestScore += 1;
        gameAudio.playWin();
      } else {
        winnerPlayerId = "draw";
        gameAudio.playDraw();
      }
    }

    const updatedGameState: SOSGameState = {
      gridSize,
      board: newBoard,
      lines: updatedLines,
      hostScore: nextHostScore,
      guestScore: nextGuestScore,
      streakCount: nextStreak,
      lastMove: {
        row: r,
        col: c,
        letter: letterToPlace,
        playerId: actingPlayerId,
        newLinesCount: scoreGained,
      },
    };

    const nextRoomState: GameRoomState<SOSGameState> = {
      ...room,
      gameState: updatedGameState,
      currentTurn: nextTurnId,
      status: isOver ? "round_over" : "playing",
      winnerId: winnerPlayerId,
      lastMoveTimestamp: Date.now(),
      players: {
        host: {
          ...room.players.host,
          score: nextSeriesHostScore,
        },
        guest: room.players.guest
          ? {
              ...room.players.guest,
              score: nextSeriesGuestScore,
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
        nextSeriesHostScore,
        nextSeriesGuestScore,
        room.rules?.turnTimerSeconds || 0,
        room.rules?.maxSeriesWins || 2
      );
    }
  }, [
    board,
    lines,
    hostScore,
    guestScore,
    streakCount,
    activePowerUp,
    room,
    isLocalMode,
    isAIMode,
    isMyTurn,
    myPlayerId,
    selectedLetter,
    onLocalMove,
    hostColor,
    guestColor,
    gridSize,
    spawnLineParticles,
    triggerAiSpeech,
  ]);

  // AI Opponent auto-trigger
  const isAITurn = isAIMode && room.status === "playing" && room.currentTurn !== room.players.host.id;
  useEffect(() => {
    if (!isAITurn) return;

    const timer = setTimeout(() => {
      const aiMove = getSmartSOSAIMove(
        board,
        lines,
        room.players.guest?.id || "ai_bot",
        aiDifficulty
      );
      handleCellClick(aiMove.row, aiMove.col, aiMove.letter, aiMove.usePowerUp);
    }, 650 + Math.random() * 400);

    return () => clearTimeout(timer);
  }, [isAITurn, board, lines, aiDifficulty, room.players.guest?.id, handleCellClick]);

  // Dynamic grid size change handler (for local/AI mode)
  const handleChangeGridSize = (newSize: number) => {
    if (room.mode !== "local" && room.mode !== "ai") return;
    const newBoard = Array(newSize).fill("").map(() => Array(newSize).fill(""));
    const updatedRoom: GameRoomState<SOSGameState> = {
      ...room,
      gameState: {
        gridSize: newSize,
        board: newBoard,
        lines: [],
        hostScore: 0,
        guestScore: 0,
        streakCount: 0,
        lastMove: null,
      },
      status: "playing",
      winnerId: null,
    };
    onLocalMove?.(updatedRoom);
    gameAudio.playClick();
  };

  // SVG laser lines calculation helper
  const renderLaserLines = () => {
    return lines.map((line) => {
      const x1 = ((line.startCol + 0.5) / gridSize) * 100;
      const y1 = ((line.startRow + 0.5) / gridSize) * 100;
      const x2 = ((line.endCol + 0.5) / gridSize) * 100;
      const y2 = ((line.endRow + 0.5) / gridSize) * 100;

      return (
        <g key={line.id} className="pointer-events-none">
          {/* Laser Glow Layer */}
          <line
            x1={`${x1}%`}
            y1={`${y1}%`}
            x2={`${x2}%`}
            y2={`${y2}%`}
            stroke={line.color}
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.4"
            style={{ filter: "blur(5px)" }}
          />
          {/* Bright Core Laser Beam */}
          <motion.line
            x1={`${x1}%`}
            y1={`${y1}%`}
            x2={`${x2}%`}
            y2={`${y2}%`}
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
          {/* Colored Perimeter Beam */}
          <line
            x1={`${x1}%`}
            y1={`${y1}%`}
            x2={`${x2}%`}
            y2={`${y2}%`}
            stroke={line.color}
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.95"
          />
        </g>
      );
    });
  };

  // Score momentum calculations
  const totalPoints = hostScore + guestScore;
  const hostPercentage = totalPoints === 0 ? 50 : Math.max(10, Math.min(90, (hostScore / totalPoints) * 100));
  const emptyCellsCount = useMemo(() => {
    return board.reduce((acc, row) => acc + row.filter((c) => c === "").length, 0);
  }, [board]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-2 select-none">
      {/* ── Real-Time Tug-of-War Momentum Meter ── */}
      <div className="w-full mb-3 p-2.5 rounded-2xl bg-card/70 backdrop-blur-md border border-border/60 shadow-lg">
        <div className="flex items-center justify-between mb-1.5 px-1 text-xs font-black">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span>{room.players.host.name}</span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs">
              {hostScore}
            </span>
          </div>

          <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
            {hostScore === guestScore ? (
              <span className="text-muted-foreground">Tied Battle</span>
            ) : hostScore > guestScore ? (
              <span className="text-cyan-400 font-extrabold flex items-center gap-0.5">
                <Flame className="w-3.5 h-3.5" /> +{hostScore - guestScore} Lead
              </span>
            ) : (
              <span className="text-rose-400 font-extrabold flex items-center gap-0.5">
                <Flame className="w-3.5 h-3.5" /> +{guestScore - hostScore} Lead
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-xs">
              {guestScore}
            </span>
            <span>{room.players.guest?.name || (isAIMode ? aiPersona.name : "Guest")}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
          </div>
        </div>

        {/* Dynamic Dual Color Momentum Bar */}
        <div className="w-full h-2 rounded-full bg-background/80 overflow-hidden flex shadow-inner">
          <motion.div
            className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
            animate={{ width: `${hostPercentage}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
          <motion.div
            className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)] flex-1"
            animate={{ width: `${100 - hostPercentage}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        </div>
      </div>

      {/* ── AI Bot Persona Dialogue Banner ── */}
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

      {/* ── Arena Grid Sizing Selector (for Solo & Local Modes) ── */}
      {(isLocalMode || isAIMode) && (
        <div className="w-full flex items-center justify-center gap-1.5 mb-3 p-1 rounded-xl bg-card/40 border border-border/40">
          <span className="text-[10px] uppercase font-bold text-muted-foreground ml-1 mr-1">Grid:</span>
          {[
            { size: 5, label: "5x5 Blitz" },
            { size: 6, label: "6x6 Classic" },
            { size: 7, label: "7x7 Tactical" },
            { size: 8, label: "8x8 Grand" },
          ].map((item) => (
            <button
              key={item.size}
              type="button"
              onClick={() => handleChangeGridSize(item.size)}
              className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-bold transition-all ${
                gridSize === item.size
                  ? "bg-primary text-primary-foreground shadow-sm scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* ── S / O & Power-Up Action Bar ── */}
      <div className="w-full flex items-center justify-between gap-2 mb-3">
        {/* Letter Selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedLetter("S");
              setActivePowerUp(null);
              gameAudio.playClick();
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-xl font-black text-base transition-all border ${
              selectedLetter === "S" && !activePowerUp
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105"
                : "bg-card/40 border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>S</span>
            <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-muted/80 text-muted-foreground">[S]</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedLetter("O");
              setActivePowerUp(null);
              gameAudio.playClick();
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-xl font-black text-base transition-all border ${
              selectedLetter === "O" && !activePowerUp
                ? "bg-rose-500/20 border-rose-400 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)] scale-105"
                : "bg-card/40 border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>O</span>
            <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-muted/80 text-muted-foreground">[O]</span>
          </button>
        </div>

        {/* Arcade Power-Ups */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="2X Score Overcharge (Next SOS gives +2 points)"
            onClick={() => {
              const next = activePowerUp === "2x" ? null : "2x";
              setActivePowerUp(next);
              if (next) gameAudio.playPowerUpTrigger();
            }}
            className={`flex items-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-all ${
              activePowerUp === "2x"
                ? "bg-amber-500/30 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105 animate-pulse"
                : "bg-card/40 border-border/60 text-amber-400/80 hover:bg-amber-500/10"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>2X</span>
          </button>

          <button
            type="button"
            title="Wildcard Tile (Acts as both S and O)"
            onClick={() => {
              const next = activePowerUp === "wildcard" ? null : "wildcard";
              setActivePowerUp(next);
              setSelectedLetter("?");
              if (next) gameAudio.playPowerUpTrigger();
            }}
            className={`flex items-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-all ${
              activePowerUp === "wildcard"
                ? "bg-purple-500/30 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-105 animate-pulse"
                : "bg-card/40 border-border/60 text-purple-400/80 hover:bg-purple-500/10"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Wild</span>
          </button>

          <button
            type="button"
            title="EMP Bomb (Detonates 3x3 zone)"
            onClick={() => {
              const next = activePowerUp === "bomb" ? null : "bomb";
              setActivePowerUp(next);
              if (next) gameAudio.playPowerUpTrigger();
            }}
            className={`flex items-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-all ${
              activePowerUp === "bomb"
                ? "bg-red-500/30 border-red-400 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-105 animate-pulse"
                : "bg-card/40 border-border/60 text-red-400/80 hover:bg-red-500/10"
            }`}
          >
            <Bomb className="w-3.5 h-3.5 text-red-400" />
            <span>Bomb</span>
          </button>
        </div>
      </div>

      {/* Floating Bonus Turn Banner */}
      <AnimatePresence>
        {bonusTurnBanner && (
          <motion.div
            key={bonusTurnBanner.id}
            initial={{ opacity: 0, y: -15, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.85 }}
            transition={{ duration: 0.25 }}
            className="absolute z-40 top-20 px-4 py-1.5 rounded-full font-black text-xs sm:text-sm tracking-wide shadow-2xl border flex items-center gap-1.5"
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              borderColor: bonusTurnBanner.color,
              color: bonusTurnBanner.color,
              boxShadow: `0 0 25px ${bonusTurnBanner.color}77`,
            }}
          >
            <Flame className="w-4 h-4 animate-bounce" />
            {bonusTurnBanner.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main SOS Board Canvas & Grid Container ── */}
      <div
        ref={gridContainerRef}
        className="relative w-full aspect-square max-w-[390px] bg-card/75 backdrop-blur-2xl p-2.5 rounded-3xl border-2 border-border/80 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden flex items-center justify-center"
      >
        {/* Canvas for Particle Sparks Layer */}
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="absolute inset-0 w-full h-full pointer-events-none z-30"
        />

        {/* Dynamic SVG Laser Layer */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {renderLaserLines()}
        </svg>

        {/* Grid Matrix */}
        <div
          className="w-full h-full grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isCellHovered = hoverCell?.[0] === r && hoverCell?.[1] === c && !cell;
              const isLastMove = rawState?.lastMove?.row === r && rawState?.lastMove?.col === c;

              return (
                <motion.button
                  key={`${r}-${c}`}
                  type="button"
                  whileHover={{ scale: cell ? 1 : 1.05 }}
                  whileTap={{ scale: cell ? 1 : 0.95 }}
                  onMouseEnter={() => setHoverCell([r, c])}
                  onMouseLeave={() => setHoverCell(null)}
                  onClick={() => handleCellClick(r, c)}
                  disabled={(!!cell && activePowerUp !== "bomb") || (room.mode !== "local" && !isMyTurn)}
                  className={`relative flex items-center justify-center rounded-xl font-black transition-all duration-150 ${
                    gridSize >= 7 ? "text-base sm:text-lg" : "text-xl sm:text-2xl"
                  } ${
                    cell
                      ? isLastMove
                        ? "bg-primary/25 border-2 border-primary text-foreground shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                        : "bg-muted/70 border border-border/70 text-foreground"
                      : activePowerUp === "bomb"
                      ? "bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 cursor-crosshair"
                      : "bg-background/50 hover:bg-muted/50 border border-border/40 cursor-pointer"
                  }`}
                >
                  {cell ? (
                    <motion.span
                      initial={{ scale: 0, rotate: -25 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 450, damping: 22 }}
                      className={
                        cell === "S"
                          ? "text-cyan-400 font-extrabold drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                          : cell === "O"
                          ? "text-rose-400 font-extrabold drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                          : "text-purple-400 font-black animate-pulse"
                      }
                    >
                      {cell}
                    </motion.span>
                  ) : isCellHovered && (isLocalMode || isMyTurn) ? (
                    <span className="text-muted-foreground/40 font-bold scale-75 select-none">
                      {activePowerUp === "bomb" ? "💣" : activePowerUp === "wildcard" ? "?" : selectedLetter}
                    </span>
                  ) : null}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Mini Strategy Tip */}
      <div className="mt-3 text-[11px] text-muted-foreground/80 text-center max-w-sm flex items-center justify-center gap-1">
        <Zap className="w-3.5 h-3.5 text-amber-400 inline" />
        <span>Spell <strong>S-O-S</strong> in any direction (↔ ↕ ↗ ↘) to earn points & chain <strong>Extra Turns</strong>!</span>
      </div>
    </div>
  );
};
