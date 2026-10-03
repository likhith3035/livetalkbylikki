import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameRoomState, DotsBoxesGameState } from "../../types";
import { gameAudio } from "../../services/gameSoundService";
import { sendGameMove } from "../../services/gameRoomService";
import {
  Sparkles,
  Zap,
  Flame,
  Trophy,
  Bot,
  Crown,
  Grid3X3,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

interface DotsBoxesGameProps {
  room: GameRoomState<DotsBoxesGameState>;
  myPlayerId: string;
  isMyTurn: boolean;
  onLocalMove?: (updatedRoom: GameRoomState<DotsBoxesGameState>) => void;
}

const GRID_DOTS = 5; // 5x5 dots = 4x4 boxes (16 boxes)
const BOX_COUNT = (GRID_DOTS - 1) * (GRID_DOTS - 1);

export const DotsBoxesGame: React.FC<DotsBoxesGameProps> = ({
  room,
  myPlayerId,
  isMyTurn,
  onLocalMove,
}) => {
  const state: DotsBoxesGameState = useMemo(() => {
    const raw = room.gameState as any;
    return {
      gridSize: raw?.gridSize || GRID_DOTS,
      lines: raw?.lines || {},
      boxes: raw?.boxes || {},
      hostScore: raw?.hostScore || 0,
      guestScore: raw?.guestScore || 0,
      totalBoxes: raw?.totalBoxes || BOX_COUNT,
      lastMoveLineId: raw?.lastMoveLineId || null,
      lastCompletedBoxes: raw?.lastCompletedBoxes || [],
      chainCount: raw?.chainCount || 0,
      winner: raw?.winner || null,
    };
  }, [room.gameState]);

  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const [comboBanner, setComboBanner] = useState<string | null>(null);
  const aiThinkingRef = useRef(false);

  const isHost = room.players.host.id === myPlayerId;
  const opponent = isHost ? room.players.guest : room.players.host;
  const isAIMode = room.mode === "ai";
  const isLocalMode = room.mode === "local";

  const hostColor = "#3b82f6"; // Blue
  const guestColor = "#ec4899"; // Pink / Magenta

  const currentTurnPlayer =
    room.currentTurn === room.players.host.id
      ? room.players.host
      : room.players.guest || { id: "p2", name: "Player 2", avatar: "🤖" };

  // Helper to check if a specific box (r, c) is complete given the lines record
  const checkBoxCompleted = (r: number, c: number, lines: Record<string, string>): boolean => {
    const top = `h_${r}_${c}`;
    const bottom = `h_${r + 1}_${c}`;
    const left = `v_${r}_${c}`;
    const right = `v_${r}_${c + 1}`;
    return !!(lines[top] && lines[bottom] && lines[left] && lines[right]);
  };

  // Find all newly completed boxes by adding lineId
  const findNewlyCompletedBoxes = (
    lineId: string,
    existingLines: Record<string, string>,
    existingBoxes: Record<string, string>
  ): string[] => {
    const testLines = { ...existingLines, [lineId]: "test" };
    const completed: string[] = [];

    const parts = lineId.split("_");
    const type = parts[0];
    const r = parseInt(parts[1], 10);
    const c = parseInt(parts[2], 10);

    const checkAndAdd = (row: number, col: number) => {
      if (row >= 0 && row < GRID_DOTS - 1 && col >= 0 && col < GRID_DOTS - 1) {
        const boxKey = `${row}_${col}`;
        if (!existingBoxes[boxKey] && checkBoxCompleted(row, col, testLines)) {
          completed.push(boxKey);
        }
      }
    };

    if (type === "h") {
      checkAndAdd(r - 1, c); // Box above
      checkAndAdd(r, c);     // Box below
    } else {
      checkAndAdd(r, c - 1); // Box left
      checkAndAdd(r, c);     // Box right
    }

    return completed;
  };

  // Handle a line click
  const handleLineClick = useCallback(
    async (lineId: string) => {
      if (room.status === "round_over" || room.status === "game_over") return;
      if (state.lines[lineId]) return; // Line already filled
      if (!isMyTurn && !isLocalMode) return;

      const activePlayerId = isLocalMode ? room.currentTurn : myPlayerId;
      const newlyCompleted = findNewlyCompletedBoxes(lineId, state.lines, state.boxes);

      const nextLines = { ...state.lines, [lineId]: activePlayerId };
      const nextBoxes = { ...state.boxes };

      newlyCompleted.forEach((bKey) => {
        nextBoxes[bKey] = activePlayerId;
      });

      const hostPoints = Object.values(nextBoxes).filter((id) => id === room.players.host.id).length;
      const guestPoints = Object.values(nextBoxes).filter((id) => id !== room.players.host.id).length;

      const gotBox = newlyCompleted.length > 0;
      let nextTurn = room.currentTurn;
      const nextChain = gotBox ? state.chainCount + 1 : 0;

      if (gotBox) {
        gameAudio.playWin();
        if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
        setComboBanner(newlyCompleted.length > 1 ? "🔥 DOUBLE BOX COMBO!" : "⚡ BOX CLAIMED! EXTRA TURN!");
        setTimeout(() => setComboBanner(null), 1800);
        // Player gets another turn: nextTurn remains the same activePlayerId
      } else {
        gameAudio.playMove();
        if (navigator.vibrate) navigator.vibrate(25);
        // Switch turn to opponent
        nextTurn =
          room.currentTurn === room.players.host.id
            ? room.players.guest?.id || "guest"
            : room.players.host.id;
      }

      // Check for game completion (all 16 boxes claimed)
      const totalClaimed = Object.keys(nextBoxes).length;
      const isComplete = totalClaimed >= BOX_COUNT;
      let winnerId: string | null = null;

      if (isComplete) {
        if (hostPoints > guestPoints) {
          winnerId = room.players.host.id;
        } else if (guestPoints > hostPoints) {
          winnerId = room.players.guest?.id || "guest";
        } else {
          winnerId = "draw";
        }
      }

      const nextState: DotsBoxesGameState = {
        ...state,
        lines: nextLines,
        boxes: nextBoxes,
        hostScore: hostPoints,
        guestScore: guestPoints,
        lastMoveLineId: lineId,
        lastCompletedBoxes: newlyCompleted,
        chainCount: nextChain,
        winner: winnerId,
      };

      if (isLocalMode) {
        onLocalMove?.({
          ...room,
          gameState: nextState,
          currentTurn: nextTurn,
          winnerId: isComplete ? winnerId : null,
          status: isComplete ? "round_over" : "playing",
        });
      } else {
        await sendGameMove(
          room.roomCode,
          nextState,
          nextTurn,
          isComplete ? winnerId : null,
          isComplete
        );
      }
    },
    [room, state, isMyTurn, isLocalMode, myPlayerId, onLocalMove]
  );

  // AI Turn Logic
  useEffect(() => {
    if (!isAIMode) return;
    if (room.status === "round_over" || room.status === "game_over") return;
    if (room.currentTurn === room.players.host.id) return; // Human turn
    if (aiThinkingRef.current) return;

    aiThinkingRef.current = true;
    const aiTimer = setTimeout(() => {
      // 1. Gather all unoccupied lines
      const allLines: string[] = [];
      // Horizontal lines: (r in 0..GRID_DOTS-1, c in 0..GRID_DOTS-2)
      for (let r = 0; r < GRID_DOTS; r++) {
        for (let c = 0; c < GRID_DOTS - 1; c++) {
          const lId = `h_${r}_${c}`;
          if (!state.lines[lId]) allLines.push(lId);
        }
      }
      // Vertical lines: (r in 0..GRID_DOTS-2, c in 0..GRID_DOTS-1)
      for (let r = 0; r < GRID_DOTS - 1; r++) {
        for (let c = 0; c < GRID_DOTS; c++) {
          const lId = `v_${r}_${c}`;
          if (!state.lines[lId]) allLines.push(lId);
        }
      }

      if (allLines.length === 0) {
        aiThinkingRef.current = false;
        return;
      }

      // Priority 1: Pick any line that immediately completes 1 or 2 boxes!
      let bestMove: string | null = null;
      for (const lineId of allLines) {
        const completed = findNewlyCompletedBoxes(lineId, state.lines, state.boxes);
        if (completed.length > 0) {
          bestMove = lineId;
          break;
        }
      }

      // Priority 2: Pick a safe line that does NOT give away the 3rd side of any box
      if (!bestMove) {
        const safeLines: string[] = [];
        for (const lineId of allLines) {
          const testLines = { ...state.lines, [lineId]: "ai_test" };
          // Check all 16 boxes to see if testLines created a 3-sided box
          let makesThreeSides = false;
          for (let r = 0; r < GRID_DOTS - 1; r++) {
            for (let c = 0; c < GRID_DOTS - 1; c++) {
              const bKey = `${r}_${c}`;
              if (state.boxes[bKey]) continue;
              const sides =
                (testLines[`h_${r}_${c}`] ? 1 : 0) +
                (testLines[`h_${r + 1}_${c}`] ? 1 : 0) +
                (testLines[`v_${r}_${c}`] ? 1 : 0) +
                (testLines[`v_${r}_${c + 1}`] ? 1 : 0);
              if (sides === 3) {
                makesThreeSides = true;
                break;
              }
            }
            if (makesThreeSides) break;
          }
          if (!makesThreeSides) {
            safeLines.push(lineId);
          }
        }
        if (safeLines.length > 0) {
          bestMove = safeLines[Math.floor(Math.random() * safeLines.length)];
        }
      }

      // Priority 3: Fallback to random line if forced to give a box
      if (!bestMove) {
        bestMove = allLines[Math.floor(Math.random() * allLines.length)];
      }

      aiThinkingRef.current = false;
      if (bestMove) {
        handleLineClick(bestMove);
      }
    }, 700);

    return () => clearTimeout(aiTimer);
  }, [isAIMode, room.currentTurn, room.status, state.lines, state.boxes, handleLineClick]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto p-3 sm:p-4 select-none">
      {/* 1. Header Score & Turn Status */}
      <div className="w-full flex items-center justify-between bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl p-3 mb-4 shadow-xl">
        {/* Host (Player 1) */}
        <div className={`flex items-center gap-2.5 ${room.currentTurn === room.players.host.id ? "scale-105" : "opacity-80"} transition-all`}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shadow-md border-2"
            style={{
              backgroundColor: `${hostColor}25`,
              borderColor: hostColor,
              color: hostColor,
            }}
          >
            {room.players.host.avatar || "👤"}
          </div>
          <div>
            <div className="text-xs font-bold text-foreground flex items-center gap-1">
              <span>{room.players.host.name}</span>
              {room.currentTurn === room.players.host.id && (
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              )}
            </div>
            <div className="text-xl font-black text-blue-400">
              {state.hostScore} <span className="text-[10px] text-muted-foreground font-normal">pts</span>
            </div>
          </div>
        </div>

        {/* VS / Turn Pill */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {room.status === "round_over" || room.status === "game_over"
              ? "MATCH COMPLETE"
              : isLocalMode
              ? `${currentTurnPlayer.name}'s Move`
              : isMyTurn
              ? "YOUR TURN"
              : isAIMode
              ? "AI THINKING..."
              : `${opponent?.name || "Opponent"}'s Turn`}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium mt-1">
            {BOX_COUNT - Object.keys(state.boxes).length} boxes left
          </span>
        </div>

        {/* Guest (Player 2 / AI) */}
        <div className={`flex items-center gap-2.5 ${room.currentTurn !== room.players.host.id ? "scale-105" : "opacity-80"} transition-all text-right flex-row-reverse`}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shadow-md border-2"
            style={{
              backgroundColor: `${guestColor}25`,
              borderColor: guestColor,
              color: guestColor,
            }}
          >
            {opponent?.avatar || "🤖"}
          </div>
          <div>
            <div className="text-xs font-bold text-foreground flex items-center justify-end gap-1">
              {room.currentTurn !== room.players.host.id && (
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              )}
              <span>{opponent?.name || (isAIMode ? "AI Bot" : "Player 2")}</span>
            </div>
            <div className="text-xl font-black text-pink-400">
              {state.guestScore} <span className="text-[10px] text-muted-foreground font-normal">pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Combo Banner Animation */}
      <AnimatePresence>
        {comboBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            className="absolute top-24 z-30 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-black text-xs shadow-xl tracking-wider uppercase border border-amber-300"
          >
            {comboBanner}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Interactive Dots & Boxes Board */}
      <div className="relative p-5 bg-card/60 backdrop-blur-2xl border border-border/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-center">
        {/* Subtle grid background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />

        <div className="relative" style={{ width: "min(84vw, 360px)", height: "min(84vw, 360px)" }}>
          {/* A. Render Completed Box Backgrounds (4x4) */}
          {Array.from({ length: GRID_DOTS - 1 }).map((_, r) =>
            Array.from({ length: GRID_DOTS - 1 }).map((_, c) => {
              const bKey = `${r}_${c}`;
              const ownerId = state.boxes[bKey];
              const isHostOwner = ownerId === room.players.host.id;
              const isRecent = state.lastCompletedBoxes?.includes(bKey);

              const leftPct = (c / (GRID_DOTS - 1)) * 100;
              const topPct = (r / (GRID_DOTS - 1)) * 100;
              const sizePct = (1 / (GRID_DOTS - 1)) * 100;

              return (
                <div
                  key={bKey}
                  className="absolute transition-all duration-300 flex items-center justify-center rounded-xl p-1"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${sizePct}%`,
                    height: `${sizePct}%`,
                  }}
                >
                  <AnimatePresence>
                    {ownerId && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 350, damping: 20 }}
                        className={`w-full h-full rounded-xl flex flex-col items-center justify-center shadow-lg border ${
                          isRecent ? "ring-2 ring-amber-400" : ""
                        }`}
                        style={{
                          backgroundColor: isHostOwner ? `${hostColor}35` : `${guestColor}35`,
                          borderColor: isHostOwner ? hostColor : guestColor,
                        }}
                      >
                        <span className="text-xl sm:text-2xl font-black drop-shadow-md">
                          {isHostOwner ? room.players.host.avatar || "👤" : opponent?.avatar || "🤖"}
                        </span>
                        <span
                          className="text-[10px] font-black tracking-wider uppercase mt-0.5"
                          style={{ color: isHostOwner ? hostColor : guestColor }}
                        >
                          {isHostOwner ? "P1" : "P2"}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}

          {/* B. Render Horizontal Lines */}
          {Array.from({ length: GRID_DOTS }).map((_, r) =>
            Array.from({ length: GRID_DOTS - 1 }).map((_, c) => {
              const lineId = `h_${r}_${c}`;
              const ownerId = state.lines[lineId];
              const isHostOwner = ownerId === room.players.host.id;
              const isHovered = hoveredLine === lineId;
              const isRecent = state.lastMoveLineId === lineId;

              const leftPct = (c / (GRID_DOTS - 1)) * 100;
              const topPct = (r / (GRID_DOTS - 1)) * 100;
              const widthPct = (1 / (GRID_DOTS - 1)) * 100;

              return (
                <button
                  key={lineId}
                  disabled={!!ownerId || (!isMyTurn && !isLocalMode)}
                  onMouseEnter={() => setHoveredLine(lineId)}
                  onMouseLeave={() => setHoveredLine(null)}
                  onClick={() => handleLineClick(lineId)}
                  className="absolute z-10 -translate-y-1/2 flex items-center justify-center focus:outline-none cursor-pointer group"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${widthPct}%`,
                    height: "28px", // Generous tap target
                  }}
                  title={`Horizontal Line ${r},${c}`}
                >
                  <div
                    className={`w-[calc(100%-12px)] h-1.5 rounded-full transition-all duration-200 ${
                      ownerId
                        ? isHostOwner
                          ? "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                          : "bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.8)]"
                        : isHovered
                        ? "bg-primary/70 scale-y-125"
                        : "bg-muted/40 group-hover:bg-muted-foreground/30"
                    } ${isRecent ? "ring-2 ring-white/70" : ""}`}
                  />
                </button>
              );
            })
          )}

          {/* C. Render Vertical Lines */}
          {Array.from({ length: GRID_DOTS - 1 }).map((_, r) =>
            Array.from({ length: GRID_DOTS }).map((_, c) => {
              const lineId = `v_${r}_${c}`;
              const ownerId = state.lines[lineId];
              const isHostOwner = ownerId === room.players.host.id;
              const isHovered = hoveredLine === lineId;
              const isRecent = state.lastMoveLineId === lineId;

              const leftPct = (c / (GRID_DOTS - 1)) * 100;
              const topPct = (r / (GRID_DOTS - 1)) * 100;
              const heightPct = (1 / (GRID_DOTS - 1)) * 100;

              return (
                <button
                  key={lineId}
                  disabled={!!ownerId || (!isMyTurn && !isLocalMode)}
                  onMouseEnter={() => setHoveredLine(lineId)}
                  onMouseLeave={() => setHoveredLine(null)}
                  onClick={() => handleLineClick(lineId)}
                  className="absolute z-10 -translate-x-1/2 flex items-center justify-center focus:outline-none cursor-pointer group"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: "28px", // Generous tap target
                    height: `${heightPct}%`,
                  }}
                  title={`Vertical Line ${r},${c}`}
                >
                  <div
                    className={`h-[calc(100%-12px)] w-1.5 rounded-full transition-all duration-200 ${
                      ownerId
                        ? isHostOwner
                          ? "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                          : "bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.8)]"
                        : isHovered
                        ? "bg-primary/70 scale-x-125"
                        : "bg-muted/40 group-hover:bg-muted-foreground/30"
                    } ${isRecent ? "ring-2 ring-white/70" : ""}`}
                  />
                </button>
              );
            })
          )}

          {/* D. Render Grid Dots (5x5) */}
          {Array.from({ length: GRID_DOTS }).map((_, r) =>
            Array.from({ length: GRID_DOTS }).map((_, c) => {
              const leftPct = (c / (GRID_DOTS - 1)) * 100;
              const topPct = (r / (GRID_DOTS - 1)) * 100;

              return (
                <div
                  key={`dot_${r}_${c}`}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-foreground border-2 border-background shadow-md shadow-black/40 pointer-events-none"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                  }}
                />
              );
            })
          )}
        </div>
      </div>

      {/* 3. Controls & Strategy Footer */}
      <div className="w-full flex items-center justify-between text-[11px] text-muted-foreground mt-3 px-2">
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Complete 4 sides of any square to score + bonus turn</span>
        </span>
        {state.chainCount > 1 && (
          <span className="font-bold text-amber-400 animate-pulse">
            🔥 {state.chainCount}x Chain Streak!
          </span>
        )}
      </div>
    </div>
  );
};
