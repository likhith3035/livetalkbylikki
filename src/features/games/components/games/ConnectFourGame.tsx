import React, { useState } from "react";
import { motion } from "framer-motion";
import { GameRoomState, ConnectFourState } from "../../types";
import { gameAudio } from "../../services/gameSoundService";
import { sendGameMove } from "../../services/gameRoomService";

interface ConnectFourGameProps {
  room: GameRoomState<ConnectFourState>;
  myPlayerId: string;
  isMyTurn: boolean;
  onLocalMove?: (updatedRoom: GameRoomState<ConnectFourState>) => void;
}

const ROWS = 6;
const COLS = 7;
type ConnectFourCell = "" | "red" | "yellow";

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
  for (let c = 0; c < COLS; c++) {
    const row = getLowestEmptyRow(board, c);
    if (row !== -1) {
      board[row][c] = aiColor;
      const win = checkConnectFourWinner(board).winner === aiColor;
      board[row][c] = "";
      if (win) return c;
    }
  }

  // Check if human can win and block
  for (let c = 0; c < COLS; c++) {
    const row = getLowestEmptyRow(board, c);
    if (row !== -1) {
      board[row][c] = humanColor;
      const win = checkConnectFourWinner(board).winner === humanColor;
      board[row][c] = "";
      if (win) return c;
    }
  }

  // Prefer center columns (3, 2, 4, 1, 5, 0, 6)
  const colOrder = [3, 2, 4, 1, 5, 0, 6];
  for (const c of colOrder) {
    if (getLowestEmptyRow(board, c) !== -1) return c;
  }

  return validCols[0] ?? 0;
}

export const ConnectFourGame: React.FC<ConnectFourGameProps> = ({ room, myPlayerId, isMyTurn, onLocalMove }) => {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  const state = room.gameState || {
    board: Array(ROWS).fill("").map(() => Array(COLS).fill("")),
    winningCells: null,
    lastDroppedCol: null,
  };

  const rawBoard = state.board || [];
  const board: ConnectFourCell[][] = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => (rawBoard[r]?.[c] as ConnectFourCell) || "")
  );

  const isHost = room.players.host.id === myPlayerId;
  const myColor: "red" | "yellow" = isHost ? "red" : "yellow";
  const currentColor: "red" | "yellow" = room.currentTurn === room.players.host.id ? "red" : "yellow";

  const handleDropChip = async (col: number) => {
    const row = getLowestEmptyRow(board, col);
    if (row === -1 || room.status === "round_over" || room.status === "game_over") return;
    if (room.mode !== "local" && !isMyTurn) return;

    const newBoard = board.map((r) => [...r]);
    const dropColor = room.mode === "local" ? currentColor : myColor;
    newBoard[row][col] = dropColor;
    gameAudio.playDrop();

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
        setTimeout(() => {
          const aiDiff = room.rules?.aiDifficulty || "medium";
          const aiCol = getBestConnectFourAIMove(newBoard, "yellow", aiDiff);
          const aiRow = getLowestEmptyRow(newBoard, aiCol);
          if (aiRow !== -1) {
            newBoard[aiRow][aiCol] = "yellow";
            gameAudio.playDrop();

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
    <div className="flex flex-col items-center justify-center p-1 sm:p-2 select-none w-full max-w-[340px] xs:max-w-sm sm:max-w-md mx-auto touch-manipulation">
      {/* Column Hover Indicator Drop Bar */}
      <div className="grid grid-cols-7 gap-1 xs:gap-1.5 sm:gap-2 w-full px-2 sm:px-3 mb-1.5 sm:mb-2 h-6 sm:h-7">
        {Array.from({ length: COLS }).map((_, c) => {
          const isHovered = hoveredCol === c;
          const canDrop = getLowestEmptyRow(board, c) !== -1;
          const previewColor = room.mode === "local" ? currentColor : myColor;

          return (
            <div key={c} className="flex items-center justify-center">
              {isHovered && canDrop && (isMyTurn || room.mode === "local") && (
                <motion.div
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={`w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 rounded-full shadow-md ${
                    previewColor === "red"
                      ? "bg-rose-500 shadow-rose-500/40"
                      : "bg-amber-400 shadow-amber-400/40"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Connect 4 Vertical Board */}
      <div className="p-2 xs:p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-blue-600 border-2 sm:border-4 border-blue-700 shadow-2xl w-full">
        <div className="grid grid-cols-7 gap-1 xs:gap-1.5 sm:gap-2.5">
          {Array.from({ length: COLS }).map((_, colIdx) => (
            <div
              key={colIdx}
              onMouseEnter={() => setHoveredCol(colIdx)}
              onMouseLeave={() => setHoveredCol(null)}
              onClick={() => handleDropChip(colIdx)}
              className="flex flex-col gap-1 xs:gap-1.5 sm:gap-2.5 cursor-pointer rounded-xl sm:rounded-2xl hover:bg-blue-500/20 p-0.5 transition-colors active:scale-98"
            >
              {Array.from({ length: ROWS }).map((_, rowIdx) => {
                const cell = board[rowIdx][colIdx];
                const isWinning = state.winningCells?.some(([r, c]) => r === rowIdx && c === colIdx);

                return (
                  <div
                    key={rowIdx}
                    className={`aspect-square rounded-full border sm:border-2 md:border-3 flex items-center justify-center transition-all ${
                      cell === "red"
                        ? "bg-rose-500 border-rose-600 shadow-inner"
                        : cell === "yellow"
                        ? "bg-amber-400 border-amber-500 shadow-inner"
                        : "bg-blue-950/80 border-blue-800/80 shadow-inner"
                    } ${isWinning ? "ring-2 sm:ring-4 ring-white animate-bounce scale-105" : ""}`}
                  >
                    {cell && (
                      <motion.div
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 350, damping: 20 }}
                        className="w-3/4 h-3/4 rounded-full bg-white/20"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
