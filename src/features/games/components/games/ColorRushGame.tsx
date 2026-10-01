import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameRoomState, ColorRushGameState, ColorRushTimerOption } from "../../types";
import {
  COLOR_RUSH_THEMES,
  COLOR_SWATCHES,
  applyPaintStroke,
  applyPaintPath,
  spawnColorRushPowerUp,
  createInitialColorRushState,
  calculateGridPercentages,
} from "../../data/colorRushData";
import {
  initColorRushAIState,
  stepColorRushAI,
  COLOR_RUSH_AI_PERSONAS,
  ColorRushAIControllerState,
} from "./ColorRushAI";
import { gameAudio } from "../../services/gameSoundService";
import { gameHaptics } from "../../services/gameHapticsService";
import { sendGameMove } from "../../services/gameRoomService";
import { Button } from "@/components/ui/button";
import {
  Timer,
  Palette,
  Zap,
  Flame,
  Snowflake,
  Bomb,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Swords,
  Crown,
} from "lucide-react";
import { triggerConfetti } from "../../services/confettiEffect";

interface ColorRushGameProps {
  room: GameRoomState<ColorRushGameState>;
  myPlayerId: string;
  isMyTurn: boolean;
  onLocalMove?: (updatedRoom: GameRoomState<ColorRushGameState>) => void;
}

export const ColorRushGame: React.FC<ColorRushGameProps> = ({
  room,
  myPlayerId,
  onLocalMove,
}) => {
  const isHost = room.players.host.id === myPlayerId;
  const isAIMode = room.mode === "ai";
  const isLocalMode = room.mode === "local";

  const rawState = room.gameState;
  const state: ColorRushGameState = useMemo(() => {
    if (rawState && Array.isArray(rawState.grid) && rawState.grid.length === 24 * 24) {
      return rawState;
    }
    return createInitialColorRushState(30);
  }, [rawState]);

  // Local optimistic state for silky smooth 60fps painting
  const [localGrid, setLocalGrid] = useState<number[]>(state.grid);
  const [hostPct, setHostPct] = useState(state.hostPct);
  const [guestPct, setGuestPct] = useState(state.guestPct);
  const [neutralPct, setNeutralPct] = useState(state.neutralPct);
  const [timeLeft, setTimeLeft] = useState(state.timeRemainingSeconds);
  const [isFrozen, setIsFrozen] = useState(state.timeRemainingSeconds <= 0);

  // Sound & Haptics preferences
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Settings modals
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);

  // Canvas references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paintCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hasInitializedCanvasRef = useRef(false);
  const isPointerDownRef = useRef(false);
  const gridRef = useRef<number[]>([...state.grid]);
  const lastSyncTimeRef = useRef(0);
  const activePointersRef = useRef<
    Map<
      number,
      {
        x: number;
        y: number;
        prevX: number;
        prevY: number;
        prevMidX: number;
        prevMidY: number;
        playerNum: 1 | 2;
      }
    >
  >(new Map());
  const aiStateRef = useRef<ColorRushAIControllerState>(initColorRushAIState(24, 24));

  // Active theme
  const currentTheme = COLOR_RUSH_THEMES[state.themeId] || COLOR_RUSH_THEMES.neon_cyber;
  const hostColor = state.hostColor || currentTheme.hostColor;
  const guestColor = state.guestColor || currentTheme.guestColor;

  // Initialize offscreen smooth paint layer
  useEffect(() => {
    if (!paintCanvasRef.current && typeof document !== "undefined") {
      const pc = document.createElement("canvas");
      pc.width = 576;
      pc.height = 576;
      paintCanvasRef.current = pc;
    }
  }, []);

  // Global window pointer listener to ensure no pointer gets stuck when released off-canvas
  useEffect(() => {
    const handleGlobalUp = (e: PointerEvent) => {
      if (activePointersRef.current.has(e.pointerId)) {
        activePointersRef.current.delete(e.pointerId);
        if (activePointersRef.current.size === 0) {
          isPointerDownRef.current = false;
        }
      }
    };
    window.addEventListener("pointerup", handleGlobalUp);
    window.addEventListener("pointercancel", handleGlobalUp);
    return () => {
      window.removeEventListener("pointerup", handleGlobalUp);
      window.removeEventListener("pointercancel", handleGlobalUp);
    };
  }, []);

  // Redraw smooth round shapes on paint canvas from grid (Only used on theme change or cold restore)
  const redrawPaintCanvasFromGrid = useCallback(
    (grid: number[], hCol: string, gCol: string) => {
      let pc = paintCanvasRef.current;
      if (!pc && typeof document !== "undefined") {
        pc = document.createElement("canvas");
        pc.width = 576;
        pc.height = 576;
        paintCanvasRef.current = pc;
      }
      if (!pc) return;
      const pctx = pc.getContext("2d");
      if (!pctx) return;

      pctx.clearRect(0, 0, 576, 576);
      const gridDim = state.gridWidth || 24;
      const cellSize = 576 / gridDim;
      // Overlapping radius ensures adjacent cells seamlessly fuse into continuous organic masses
      const radius = cellSize * 1.6;

      // Draw Host smooth round shapes
      pctx.fillStyle = hCol;
      for (let y = 0; y < gridDim; y++) {
        for (let x = 0; x < gridDim; x++) {
          if (grid[y * gridDim + x] === 1) {
            pctx.beginPath();
            pctx.arc(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, radius, 0, Math.PI * 2);
            pctx.fill();
          }
        }
      }

      // Draw Guest smooth round shapes
      pctx.fillStyle = gCol;
      for (let y = 0; y < gridDim; y++) {
        for (let x = 0; x < gridDim; x++) {
          if (grid[y * gridDim + x] === 2) {
            pctx.beginPath();
            pctx.arc(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, radius, 0, Math.PI * 2);
            pctx.fill();
          }
        }
      }
    },
    [state.gridWidth]
  );

  // Draw real-time smooth fluid vector strokes on the paint canvas with Bezier interpolation
  const drawPaintStrokeOnCanvas = useCallback(
    (
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      playerNum: 1 | 2,
      isTurbo: boolean,
      isPoint: boolean = false,
      controlX?: number,
      controlY?: number
    ) => {
      let pc = paintCanvasRef.current;
      if (!pc && typeof document !== "undefined") {
        pc = document.createElement("canvas");
        pc.width = 576;
        pc.height = 576;
        paintCanvasRef.current = pc;
      }
      if (!pc) return;
      const pctx = pc.getContext("2d");
      if (!pctx) return;

      const pColor = playerNum === 1 ? hostColor : guestColor;
      const baseRadius = 18; // Sleek, perfectly proportioned fluid brush (~36px width)
      const radius = isTurbo ? 28 : baseRadius;

      pctx.fillStyle = pColor;
      pctx.strokeStyle = pColor;
      pctx.lineWidth = radius * 2;
      pctx.lineCap = "round";
      pctx.lineJoin = "round";

      if (isPoint) {
        pctx.beginPath();
        pctx.arc(toX, toY, radius, 0, Math.PI * 2);
        pctx.fill();
      } else {
        pctx.beginPath();
        pctx.moveTo(fromX, fromY);
        if (controlX !== undefined && controlY !== undefined) {
          // Quadratic Bezier curve between points guarantees silky smooth fluid curves
          pctx.quadraticCurveTo(controlX, controlY, toX, toY);
        } else {
          pctx.lineTo(toX, toY);
        }
        pctx.stroke();
      }
    },
    [hostColor, guestColor]
  );

  // Sync state from server/props without wiping the canvas during active play
  useEffect(() => {
    if (state.grid) {
      gridRef.current = [...state.grid];
      setLocalGrid(state.grid);
      setHostPct(state.hostPct);
      setGuestPct(state.guestPct);
      setNeutralPct(state.neutralPct);

      // Only reconstruct from grid ONCE on initial mount if mounting an in-progress game
      if (!hasInitializedCanvasRef.current) {
        hasInitializedCanvasRef.current = true;
        const hasPainted = state.grid.some((v) => v !== 0);
        if (hasPainted) {
          redrawPaintCanvasFromGrid(state.grid, hostColor, guestColor);
        }
      }
    }
  }, [state.grid, state.hostPct, state.guestPct, state.neutralPct, hostColor, guestColor, redrawPaintCanvasFromGrid]);

  // Countdown timer effect
  useEffect(() => {
    if (room.status !== "playing" || isFrozen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFrozen(true);

          if (soundEnabled) {
            if (typeof gameAudio.playRoundEnd === "function") {
              gameAudio.playRoundEnd();
            } else if (typeof gameAudio.playWin === "function") {
              gameAudio.playWin();
            }
          }
          if (hapticsEnabled) gameHaptics.heavy();

          // Calculate final winner and trigger victory celebration
          const winner: "host" | "guest" | "draw" =
            hostPct > guestPct ? "host" : guestPct > hostPct ? "guest" : "draw";

          if (winner !== "draw") {
            const winningColor = winner === "host" ? hostColor : guestColor;
            triggerConfetti({
              particleCount: 80,
              spread: 70,
              origin: { x: 0.5, y: 0.6 },
              colors: [winningColor, "#ffffff", "#f59e0b"],
            });
          }

          const winnerId =
            winner === "host"
              ? room.players.host.id
              : winner === "guest"
              ? (room.players.guest?.id || (isAIMode ? "ai_bot" : "guest"))
              : "draw";

          const nextState = {
            ...state,
            timeRemainingSeconds: 0,
            frozenAt: Date.now(),
            winner,
          };

          if (isHost) {
            if (onLocalMove) {
              onLocalMove({
                ...room,
                status: "round_over",
                winnerId,
                gameState: nextState,
              });
            }
            if (room.mode !== "local" && room.mode !== "ai") {
              sendGameMove(
                room.roomCode,
                nextState,
                myPlayerId,
                winnerId,
                true
              );
            }
          }
          return 0;
        }

        if (prev <= 6 && soundEnabled) {
          gameAudio.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [room.status, isFrozen, hostPct, guestPct, soundEnabled, hapticsEnabled, isHost, onLocalMove, room, state, hostColor, guestColor]);

  // Power-up spawner (every 8-12 seconds on host)
  useEffect(() => {
    if (!isHost || isFrozen || room.status !== "playing") return;

    const spawner = setInterval(() => {
      if (Math.random() < 0.75) {
        const nextState = spawnColorRushPowerUp(state);
        if (nextState !== state && onLocalMove) {
          onLocalMove({
            ...room,
            gameState: nextState,
          });
        }
      }
    }, 8000);

    return () => clearInterval(spawner);
  }, [isHost, isFrozen, room.status, state, onLocalMove, room]);

  // Render Arena Grid to HTML5 Canvas
  const drawArena = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width;
    const height = canvas.height;
    const gridDim = state.gridWidth || 24;
    const cellSize = width / gridDim;

    ctx.clearRect(0, 0, width, height);

    // 1. Plain Board Surface Background (clean, flat, seamless plain board)
    ctx.fillStyle = currentTheme.arenaBackground;
    ctx.fillRect(0, 0, width, height);

    // 2. Render Pure Smooth Paint Layer (Zero box structure, 100% fluid vector paint)
    if (paintCanvasRef.current) {
      ctx.drawImage(paintCanvasRef.current, 0, 0, width, height);
    }

    // 3. Subtle Outer Board Rim (Physical board edge frame, no internal grid/cells)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // 5. Draw active tactical power-ups floating on the plain board
    if (state.powerUps && state.powerUps.length > 0) {
      for (const pu of state.powerUps) {
        if (!pu.active) continue;
        const cx = pu.x * cellSize + cellSize / 2;
        const cy = pu.y * cellSize + cellSize / 2;
        const puRadius = cellSize * 1.1;

        // Glowing pulse halo
        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, puRadius * pulse, 0, Math.PI * 2);
        ctx.fillStyle =
          pu.type === "bomb"
            ? "rgba(239, 68, 68, 0.4)"
            : pu.type === "turbo"
            ? "rgba(245, 158, 11, 0.4)"
            : "rgba(56, 189, 248, 0.4)";
        ctx.fill();

        // Icon representation
        ctx.font = `${Math.floor(cellSize * 1.3)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const iconChar = pu.type === "bomb" ? "💣" : pu.type === "turbo" ? "⚡" : "❄️";
        ctx.fillText(iconChar, cx, cy);
        ctx.restore();
      }
    }
  }, [
    state.gridWidth,
    state.powerUps,
    currentTheme,
    hostColor,
    guestColor,
  ]);

  // RequestAnimationFrame animation loop for rendering
  useEffect(() => {
    let animId: number;
    const loop = () => {
      drawArena();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [drawArena]);

  // Fast in-place paint updates to the grid buffer (zero React allocations, 0.005ms)
  const applyPaintDirectToGrid = useCallback(
    (
      fromCellX: number,
      fromCellY: number,
      toCellX: number,
      toCellY: number,
      playerNum: 1 | 2,
      isTurbo: boolean
    ) => {
      const grid = gridRef.current;
      const gridDim = state.gridWidth || 24;
      const brushRadius = isTurbo ? 2.1 : 1.35;
      const dist = Math.hypot(toCellX - fromCellX, toCellY - fromCellY);
      const steps = Math.max(1, Math.ceil(dist / 0.35));

      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const cx = fromCellX + (toCellX - fromCellX) * t;
        const cy = fromCellY + (toCellY - fromCellY) * t;

        const rFloor = Math.ceil(brushRadius);
        const minX = Math.max(0, Math.floor(cx - rFloor));
        const maxX = Math.min(gridDim - 1, Math.ceil(cx + rFloor));
        const minY = Math.max(0, Math.floor(cy - rFloor));
        const maxY = Math.min(gridDim - 1, Math.ceil(cy + rFloor));

        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            const d = Math.hypot(x - cx, y - cy);
            if (d <= brushRadius) {
              const idx = y * gridDim + x;
              grid[idx] = playerNum;

              // Check power-up collection
              if (state.powerUps && state.powerUps.length > 0) {
                for (const pu of state.powerUps) {
                  if (pu.active && pu.x === x && pu.y === y) {
                    pu.active = false;
                    if (pu.type === "bomb") {
                      const pc = paintCanvasRef.current;
                      if (pc) {
                        const pctx = pc.getContext("2d");
                        if (pctx) {
                          const cellSize = 576 / gridDim;
                          pctx.beginPath();
                          pctx.arc(
                            pu.x * cellSize + cellSize / 2,
                            pu.y * cellSize + cellSize / 2,
                            cellSize * 3.5,
                            0,
                            Math.PI * 2
                          );
                          pctx.fillStyle = playerNum === 1 ? hostColor : guestColor;
                          pctx.fill();
                        }
                      }
                      for (let by = Math.max(0, y - 3); by <= Math.min(gridDim - 1, y + 3); by++) {
                        for (let bx = Math.max(0, x - 3); bx <= Math.min(gridDim - 1, x + 3); bx++) {
                          if (Math.hypot(bx - x, by - y) <= 3.2) {
                            grid[by * gridDim + bx] = playerNum;
                          }
                        }
                      }
                    } else if (pu.type === "turbo") {
                      if (playerNum === 1) state.hostTurboUntil = Date.now() + 4000;
                      else state.guestTurboUntil = Date.now() + 4000;
                    } else if (pu.type === "freeze") {
                      if (playerNum === 1) state.guestFrozenUntil = Date.now() + 2500;
                      else state.hostFrozenUntil = Date.now() + 2500;
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    [state, hostColor, guestColor]
  );

  // Throttled score update to keep UI 120fps responsive without React re-render lag
  const throttleSyncScores = useCallback(() => {
    const now = Date.now();
    if (now - lastSyncTimeRef.current > 100) {
      lastSyncTimeRef.current = now;
      const pcts = calculateGridPercentages(gridRef.current, 24, 24);
      setHostPct(pcts.hostPct);
      setGuestPct(pcts.guestPct);
      setNeutralPct(pcts.neutralPct);
    }
  }, []);

  // Pointer event listeners on canvas (supports multi-touch, drag, and mouse)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isFrozen || room.status !== "playing") return;
    isPointerDownRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // Determine player number based on mode
    let playerNum: 1 | 2 = isHost ? 1 : 2;
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      if (isLocalMode) {
        playerNum = e.clientY - rect.top < rect.height / 2 ? 2 : 1;
      }

      const internalX = ((e.clientX - rect.left) / rect.width) * 576;
      const internalY = ((e.clientY - rect.top) / rect.height) * 576;

      activePointersRef.current.set(e.pointerId, {
        x: internalX,
        y: internalY,
        prevX: internalX,
        prevY: internalY,
        prevMidX: internalX,
        prevMidY: internalY,
        playerNum,
      });

      const now = Date.now();
      const isTurbo = playerNum === 1 ? state.hostTurboUntil > now : state.guestTurboUntil > now;
      drawPaintStrokeOnCanvas(internalX, internalY, internalX, internalY, playerNum, isTurbo, true);

      const gridDim = state.gridWidth || 24;
      const cellX = (internalX / 576) * gridDim;
      const cellY = (internalY / 576) * gridDim;
      applyPaintDirectToGrid(cellX, cellY, cellX, cellY, playerNum, isTurbo);

      if (soundEnabled) {
        if (typeof gameAudio.playPop === "function") gameAudio.playPop();
        else if (typeof gameAudio.playClick === "function") gameAudio.playClick();
      }
      if (hapticsEnabled) gameHaptics.light();

      throttleSyncScores();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current || isFrozen || room.status !== "playing") return;
    const pointer = activePointersRef.current.get(e.pointerId);
    if (!pointer) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const internalX = ((e.clientX - rect.left) / rect.width) * 576;
      const internalY = ((e.clientY - rect.top) / rect.height) * 576;

      const dist = Math.hypot(internalX - pointer.x, internalY - pointer.y);
      if (dist < 1.5) return; // Ignore micro-jitter

      const now = Date.now();
      const isTurbo = pointer.playerNum === 1 ? state.hostTurboUntil > now : state.guestTurboUntil > now;

      // Midpoint quadratic Bezier curve produces continuous, silky-smooth fluid paint
      const midX = (pointer.x + internalX) / 2;
      const midY = (pointer.y + internalY) / 2;

      drawPaintStrokeOnCanvas(
        pointer.prevMidX,
        pointer.prevMidY,
        midX,
        midY,
        pointer.playerNum,
        isTurbo,
        false,
        pointer.x,
        pointer.y
      );

      const gridDim = state.gridWidth || 24;
      const prevCellX = (pointer.x / 576) * gridDim;
      const prevCellY = (pointer.y / 576) * gridDim;
      const curCellX = (internalX / 576) * gridDim;
      const curCellY = (internalY / 576) * gridDim;

      pointer.prevX = pointer.x;
      pointer.prevY = pointer.y;
      pointer.prevMidX = midX;
      pointer.prevMidY = midY;
      pointer.x = internalX;
      pointer.y = internalY;

      applyPaintDirectToGrid(prevCellX, prevCellY, curCellX, curCellY, pointer.playerNum, isTurbo);

      if (soundEnabled && Math.random() < 0.12) {
        if (typeof gameAudio.playPop === "function") gameAudio.playPop();
      }
      if (hapticsEnabled && Math.random() < 0.15) gameHaptics.light();

      throttleSyncScores();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size === 0) {
      isPointerDownRef.current = false;
    }
    if (isFrozen || room.status !== "playing") return;

    const pcts = calculateGridPercentages(gridRef.current, 24, 24);
    setHostPct(pcts.hostPct);
    setGuestPct(pcts.guestPct);
    setNeutralPct(pcts.neutralPct);

    const nextState: ColorRushGameState = {
      ...state,
      grid: [...gridRef.current],
      hostPct: pcts.hostPct,
      guestPct: pcts.guestPct,
      neutralPct: pcts.neutralPct,
      lastMoveTimestamp: Date.now(),
    };

    if (room.mode === "friend" || room.mode === "quickmatch") {
      sendGameMove(room.roomCode, nextState, myPlayerId);
    } else if (onLocalMove) {
      onLocalMove({
        ...room,
        gameState: nextState,
      });
    }
  };

  // Autonomous AI bot loop with smooth fluid painting
  useEffect(() => {
    if (!isAIMode || isFrozen || room.status !== "playing") return;

    const difficulty = room.rules?.aiDifficulty || "medium";
    const persona = COLOR_RUSH_AI_PERSONAS[difficulty] || COLOR_RUSH_AI_PERSONAS.medium;

    const interval = setInterval(() => {
      const prevX = aiStateRef.current.currentX;
      const prevY = aiStateRef.current.currentY;

      const { nextAiState, nextStroke } = stepColorRushAI(
        state,
        aiStateRef.current,
        difficulty,
        2 // AI plays as Guest (player 2)
      );

      aiStateRef.current = nextAiState;

      if (nextStroke) {
        const gridDim = state.gridWidth || 24;
        const fromX = (prevX / gridDim) * 576;
        const fromY = (prevY / gridDim) * 576;
        const toX = (nextStroke.x / gridDim) * 576;
        const toY = (nextStroke.y / gridDim) * 576;

        const isTurbo = state.guestTurboUntil > Date.now();
        drawPaintStrokeOnCanvas(fromX, fromY, toX, toY, 2, isTurbo, false);
        applyPaintDirectToGrid(prevX, prevY, nextStroke.x, nextStroke.y, 2, isTurbo);
        throttleSyncScores();
      }
    }, persona.stepIntervalMs);

    return () => clearInterval(interval);
  }, [isAIMode, isFrozen, room.status, state, room.rules?.aiDifficulty, drawPaintStrokeOnCanvas, applyPaintDirectToGrid, throttleSyncScores]);

  // Restart match handler
  const handleRestartMatch = () => {
    if (soundEnabled) {
      if (typeof gameAudio.playClick === "function") gameAudio.playClick();
    }
    const pc = paintCanvasRef.current;
    if (pc) {
      const pctx = pc.getContext("2d");
      pctx?.clearRect(0, 0, 576, 576);
    }
    const freshState = createInitialColorRushState(
      state.timerDurationSeconds,
      hostColor,
      guestColor,
      state.themeId
    );
    setLocalGrid(freshState.grid);
    setHostPct(0);
    setGuestPct(0);
    setNeutralPct(100);
    setTimeLeft(freshState.timerDurationSeconds);
    setIsFrozen(false);

    if (onLocalMove) {
      onLocalMove({
        ...room,
        status: "playing",
        winnerId: null,
        gameState: freshState,
      });
    }
  };

  // Change timer duration handler
  const handleSelectDuration = (duration: ColorRushTimerOption) => {
    if (soundEnabled) {
      if (typeof gameAudio.playClick === "function") gameAudio.playClick();
    }
    setIsTimerModalOpen(false);
    const freshState = createInitialColorRushState(duration, hostColor, guestColor, state.themeId);
    setLocalGrid(freshState.grid);
    setTimeLeft(duration);
    setIsFrozen(false);

    const pc = paintCanvasRef.current;
    if (pc) {
      const pctx = pc.getContext("2d");
      pctx?.clearRect(0, 0, 576, 576);
    }

    if (onLocalMove) {
      onLocalMove({
        ...room,
        status: "playing",
        winnerId: null,
        gameState: freshState,
      });
    }
  };

  // Select custom color for Player 1 (Host)
  const handleSelectHostColor = (color: string) => {
    if (soundEnabled) {
      if (typeof gameAudio.playClick === "function") gameAudio.playClick();
    }
    const freshState: ColorRushGameState = {
      ...state,
      hostColor: color,
    };
    redrawPaintCanvasFromGrid(state.grid, color, guestColor);
    if (onLocalMove) {
      onLocalMove({
        ...room,
        gameState: freshState,
      });
    }
  };

  // Select custom color for Player 2 (Guest)
  const handleSelectGuestColor = (color: string) => {
    if (soundEnabled) {
      if (typeof gameAudio.playClick === "function") gameAudio.playClick();
    }
    const freshState: ColorRushGameState = {
      ...state,
      guestColor: color,
    };
    redrawPaintCanvasFromGrid(state.grid, hostColor, color);
    if (onLocalMove) {
      onLocalMove({
        ...room,
        gameState: freshState,
      });
    }
  };

  // Select color theme handler
  const handleSelectTheme = (themeId: string) => {
    if (soundEnabled) {
      if (typeof gameAudio.playClick === "function") gameAudio.playClick();
    }
    const th = COLOR_RUSH_THEMES[themeId];
    if (!th) return;
    setIsThemeModalOpen(false);

    const freshState: ColorRushGameState = {
      ...state,
      themeId,
      hostColor: th.hostColor,
      guestColor: th.guestColor,
    };
    redrawPaintCanvasFromGrid(state.grid, th.hostColor, th.guestColor);

    if (onLocalMove) {
      onLocalMove({
        ...room,
        gameState: freshState,
      });
    }
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isHostWinning = hostPct > guestPct;
  const isGuestWinning = guestPct > hostPct;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center select-none safe-area-padding space-y-2 sm:space-y-3">
      {/* ── Top Match Header & HUD ── */}
      <div className="w-full rounded-2xl bg-card/90 border border-border/80 p-2 sm:p-2.5 shadow-lg backdrop-blur-md space-y-1.5 sm:space-y-2">
        {/* Players & Live Timer Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Host Tag */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="h-7 w-7 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-xs shrink-0"
              style={{ backgroundColor: hostColor }}
            >
              {room.players.host.avatar || "👑"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-foreground truncate max-w-[80px] sm:max-w-[120px]">
                  {room.players.host.name}
                </span>
                {isHostWinning && <Crown className="h-3 w-3 text-amber-400 shrink-0" />}
              </div>
              <span className="text-[10px] font-mono font-bold" style={{ color: hostColor }}>
                {hostPct}%
              </span>
            </div>
          </div>

          {/* Center Digital Timer */}
          <div className="flex flex-col items-center">
            <div
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-mono font-black tracking-wider ${
                timeLeft <= 5
                  ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse"
                  : "bg-secondary/60 border-border text-foreground"
              }`}
            >
              <Timer className="h-3 w-3" />
              <span>{formatTime(timeLeft)}</span>
            </div>
            {isFrozen && (
              <span className="text-[8px] font-black uppercase tracking-wider text-cyan-400">
                ❄️ FROZEN
              </span>
            )}
          </div>

          {/* Guest Tag */}
          <div className="flex items-center gap-2 justify-end min-w-0 text-right">
            <div className="min-w-0">
              <div className="flex items-center justify-end gap-1">
                {isGuestWinning && <Crown className="h-3 w-3 text-amber-400 shrink-0" />}
                <span className="text-xs font-bold text-foreground truncate max-w-[80px] sm:max-w-[120px]">
                  {room.players.guest?.name || (isAIMode ? "AI Bot" : "Opponent")}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold" style={{ color: guestColor }}>
                {guestPct}%
              </span>
            </div>
            <div
              className="h-7 w-7 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-xs shrink-0"
              style={{ backgroundColor: guestColor }}
            >
              {room.players.guest?.avatar || (isAIMode ? "🤖" : "⚔️")}
            </div>
          </div>
        </div>

        {/* ── Live Dominance Bar ── */}
        <div className="space-y-0.5">
          <div className="relative h-2.5 w-full rounded-full bg-secondary/80 overflow-hidden flex shadow-inner border border-border/40">
            {/* Host Section */}
            <div
              className="h-full transition-all duration-150 relative"
              style={{ width: `${hostPct}%`, backgroundColor: hostColor }}
            />
            {/* Neutral Gap */}
            <div
              className="h-full transition-all duration-150 bg-black/40"
              style={{ width: `${neutralPct}%` }}
            />
            {/* Guest Section */}
            <div
              className="h-full transition-all duration-150 relative ml-auto"
              style={{ width: `${guestPct}%`, backgroundColor: guestColor }}
            />
          </div>

          <div className="flex justify-between text-[8px] font-mono text-muted-foreground px-0.5">
            <span>{hostPct}% Territory</span>
            <span className="text-white/40">{neutralPct}% Unclaimed</span>
            <span>{guestPct}% Territory</span>
          </div>
        </div>

        {/* Local Mode Split Indicator */}
        {isLocalMode && (
          <div className="flex items-center justify-center gap-1.5 py-0.5 px-2 rounded-full bg-secondary/40 border border-border/50 text-[9px] text-muted-foreground font-medium">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: guestColor }} />
            <span>Top: P2</span>
            <span className="text-white/20">•</span>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hostColor }} />
            <span>Bottom: P1</span>
          </div>
        )}
      </div>

      {/* ── Main Arena Canvas ── */}
      <div className="relative w-full aspect-square max-h-[min(52vh,460px)] max-w-[min(52vh,460px)] sm:max-h-[min(56vh,500px)] sm:max-w-[min(56vh,500px)] rounded-3xl overflow-hidden border-2 border-border shadow-2xl bg-card ring-1 ring-white/10 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={576}
          height={576}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`w-full h-full touch-none select-none cursor-crosshair ${
            isFrozen ? "pointer-events-none" : ""
          }`}
        />

        {/* Frozen Frosted Overlay when time is up */}
        <AnimatePresence>
          {isFrozen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-950/20 backdrop-blur-[1.5px] flex items-center justify-center p-3 text-center z-10 pointer-events-none"
            >
              <div className="px-4 py-2 rounded-2xl bg-card/90 border border-cyan-500/40 shadow-xl backdrop-blur-md flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <span className="text-sm font-black text-foreground">
                  {hostPct > guestPct
                    ? `${room.players.host.name} Captured ${hostPct}%!`
                    : guestPct > hostPct
                    ? `${room.players.guest?.name || "Player 2"} Captured ${guestPct}%!`
                    : "Honorable Draw!"}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Control Bar ── */}
      <div className="w-full max-w-[min(52vh,460px)] sm:max-w-[min(56vh,500px)] flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-2xl bg-card/80 border border-border/80 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          {/* Change Duration */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTimerModalOpen(true)}
            className="text-xs gap-1 rounded-xl h-8 px-2.5"
            title="Custom Timer"
          >
            <Timer className="h-3.5 w-3.5 text-primary" />
            <span className="hidden xs:inline">{state.timerDurationSeconds}s</span>
          </Button>

          {/* Color Themes */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsThemeModalOpen(true)}
            className="text-xs gap-1 rounded-xl h-8 px-2.5"
            title="Color Palette"
          >
            <Palette className="h-3.5 w-3.5 text-pink-400" />
            <span className="hidden xs:inline">Theme</span>
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
            title={soundEnabled ? "Mute Audio" : "Unmute Audio"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>

          {/* Quick Restart */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRestartMatch}
            className="text-xs gap-1 rounded-xl h-8 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </div>

      {/* ── Timer Selection Modal ── */}
      <AnimatePresence>
        {isTimerModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsTimerModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border p-5 rounded-2xl max-w-xs w-full shadow-2xl space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-sm font-bold text-foreground font-display flex items-center gap-1.5">
                <Timer className="h-4 w-4 text-primary" /> Select Match Duration
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[15, 30, 60, 90].map((t) => (
                  <button
                    key={t}
                    onClick={() => handleSelectDuration(t as ColorRushTimerOption)}
                    className={`p-3 rounded-xl border text-center font-mono font-bold transition-all ${
                      state.timerDurationSeconds === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/40 border-border hover:bg-secondary text-foreground"
                    }`}
                  >
                    <p className="text-base">{t}s</p>
                    <p className="text-[10px] opacity-75 font-sans font-normal">
                      {t === 15 ? "Blitz" : t === 30 ? "Standard" : t === 60 ? "Championship" : "Marathon"}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Theme & Palette Modal ── */}
      <AnimatePresence>
        {isThemeModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsThemeModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border p-5 rounded-2xl max-w-sm w-full shadow-2xl space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-sm font-bold text-foreground font-display flex items-center gap-1.5">
                <Palette className="h-4 w-4 text-pink-400" /> Color Theme & Custom Swatches
              </h4>

              <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
                {/* Preset Themes */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Preset Neon Duels
                  </p>
                  <div className="space-y-1.5">
                    {Object.values(COLOR_RUSH_THEMES).map((th) => (
                      <button
                        key={th.id}
                        onClick={() => handleSelectTheme(th.id)}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          state.themeId === th.id
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border/60 bg-secondary/30 hover:bg-secondary/60"
                        }`}
                      >
                        <div className="text-left">
                          <p className="text-xs font-bold text-foreground">{th.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {th.hostName} vs {th.guestName}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className="h-5 w-5 rounded-full shadow-sm"
                            style={{ backgroundColor: th.hostColor }}
                          />
                          <span className="text-[10px] text-muted-foreground">vs</span>
                          <span
                            className="h-5 w-5 rounded-full shadow-sm"
                            style={{ backgroundColor: th.guestColor }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Wish Color Swatches */}
                <div className="space-y-2.5 pt-2 border-t border-border/60">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Pick Your Wish Colors
                  </p>

                  {/* Player 1 (Host) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        {room.players.host.name} (P1)
                      </span>
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: hostColor }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {COLOR_SWATCHES.map((hex) => (
                        <button
                          key={`p1-${hex}`}
                          onClick={() => handleSelectHostColor(hex)}
                          className={`h-6 w-6 rounded-lg transition-transform hover:scale-110 border ${
                            hostColor === hex
                              ? "ring-2 ring-white scale-110 border-transparent shadow-md"
                              : "border-white/10"
                          }`}
                          style={{ backgroundColor: hex }}
                          title={`Select ${hex} for Player 1`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Player 2 (Guest / AI) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        {room.players.guest?.name || (isAIMode ? "AI Bot" : "Player 2")} (P2)
                      </span>
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: guestColor }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {COLOR_SWATCHES.map((hex) => (
                        <button
                          key={`p2-${hex}`}
                          onClick={() => handleSelectGuestColor(hex)}
                          className={`h-6 w-6 rounded-lg transition-transform hover:scale-110 border ${
                            guestColor === hex
                              ? "ring-2 ring-white scale-110 border-transparent shadow-md"
                              : "border-white/10"
                          }`}
                          style={{ backgroundColor: hex }}
                          title={`Select ${hex} for Player 2`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
