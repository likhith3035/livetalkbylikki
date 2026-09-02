import React from "react";
import { motion } from "framer-motion";
import { GameRoomState, ConnectFourCell, ConnectFourState } from "../../types";
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

export function checkConnectFourWinner(board: ConnectFourCell[][]): { winner: "red" | "yellow" | null; cells: [number, number][] | null } {
  // Check horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const color = board[r]?.[c];
      if (color && color === board[r]?.[c + 1] && color === board[r]?.[c + 2] && color === board[r]?.[c + 3]) {
        return { winner: color as "red" | "yellow", cells: [[r, c], [r, c + 1], [r, c + 2], [r, c + 3]] };
      }
    }
  }

  // Check vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const color = board[r]?.[c];
      if (color && color === board[r + 1]?.[c] && color === board[r + 2]?.[c] && color === board[r + 3]?.[c]) {
        return { winner: color as "red" | "yellow", cells: [[r, c], [r + 1, c], [r + 2, c], [r + 3, c]] };
      }
    }
  }

  // Check diagonal down-right
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const color = board[r]?.[c];
      if (color && color === board[r + 1]?.[c + 1] && color === board[r + 2]?.[c + 2] && color === board[r + 3]?.[c + 3]) {
        return { winner: color as "red" | "yellow", cells: [[r, c], [r + 1, c + 1], [r + 2, c + 2], [r + 3, c + 3]] };
      }
    }
  }

  // Check diagonal up-right
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const color = board[r]?.[c];
      if (color && color === board[r - 1]?.[c + 1] && color === board[r - 2]?.[c + 2] && color === board[r - 3]?.[c + 3]) {
        return { winner: color as "red" | "yellow", cells: [[r, c], [r - 1, c + 1], [r - 2, c + 2], [r - 3, c + 3]] };
      }
    }
  }

  return { winner: null, cells: null };
}

export function getBestConnectFourAIMove(board: ConnectFourCell[][], aiColor: "red" | "yellow"): number {
  const humanColor = aiColor === "red" ? "yellow" : "red";

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

  return 0;
}

function getLowestEmptyRow(board: ConnectFourCell[][], col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r]?.[col]) return r;
  }
  return -1;
}

export const ConnectFourGame: React.FC<ConnectFourGameProps> = ({ room, myPlayerId, isMyTurn, onLocalMove }) => {
  const state = room.gameState || {
    board: Array(6).fill("").map(() => Array(7).fill("")),
    winningCells: null,
    lastDroppedCol: null,
  };
  const rawBoard = state.board || [];
  const board: ConnectFourCell[][] = Array.from({ length: 6 }, (_, r) =>
    Array.from({ length: 7 }, (_, c) => rawBoard[r]?.[c] || "")
  );

  const isHost = room.players.host.id === myPlayerId;
  const myColor: "red" | "yellow" = isHost ? "red" : "yellow";
  const currentColor: "red" | "yellow" = room.currentTurn === room.players.host.id ? "red" : "yellow";

  const handleColumnClick = async (col: number) => {
    if (room.status === "round_over" || room.status === "game_over") return;
    if (room.mode !== "local" && !isMyTurn) return;

    const row = getLowestEmptyRow(board, col);
    if (row === -1) return;

    const moveColor = room.mode === "local" ? currentColor : myColor;
    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = moveColor;
    gameAudio.playDrop();

    const { winner, cells } = checkConnectFourWinner(newBoard);
    const isFull = newBoard[0].every((cell) => cell === "red" || cell === "yellow");
    const isOver = !!winner || isFull;

    let winnerPlayerId: string | null = null;
    let nextHostScore = room.players.host.score;
    let nextGuestScore = room.players.guest?.score || 0;

    if (winner) {
      if (room.mode === "local") {
        winnerPlayerId = moveColor === "red" ? room.players.host.id : (room.players.guest?.id || "local_player_2");
      } else {
        winnerPlayerId = winner === myColor ? myPlayerId : (isHost ? room.players.guest?.id || null : room.players.host.id);
      }

      if (winnerPlayerId === room.players.host.id) {
        nextHostScore += 1;
      } else if (winnerPlayerId) {
        nextGuestScore += 1;
      }

      gameAudio.playWin();
    } else if (isFull) {
      winnerPlayerId = "draw";
      gameAudio.playDraw();
    }

    const nextTurnId = room.currentTurn === room.players.host.id
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
      let updatedRoom: GameRoomState<ConnectFourState> = {
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

      // AI Response Move
      if (!isOver) {
        setTimeout(() => {
          const aiCol = getBestConnectFourAIMove(newBoard, "yellow");
          const aiRow = getLowestEmptyRow(newBoard, aiCol);
          if (aiRow === -1) return;

          const aiBoard = newBoard.map((r) => [...r]);
          aiBoard[aiRow][aiCol] = "yellow";
          gameAudio.playDrop();

          const aiResult = checkConnectFourWinner(aiBoard);
          const aiFull = aiBoard[0].every((c) => c === "red" || c === "yellow");
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
            board: aiBoard,
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
        }, 600);
      }
      return;
    }

    // Multiplayer
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
    <div className="flex flex-col items-center justify-center p-2 select-none w-full max-w-lg mx-auto">
      <div className="p-3 sm:p-5 rounded-3xl bg-blue-950/60 backdrop-blur-xl border-2 border-blue-500/40 shadow-2xl shadow-blue-500/15 w-full">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {Array(COLS).fill(0).map((_, col) => (
            <button
              key={col}
              onClick={() => handleColumnClick(col)}
              disabled={room.mode !== "local" && !isMyTurn}
              className="flex flex-col gap-1.5 sm:gap-2.5 p-1 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer group"
            >
              {Array(ROWS).fill(0).map((_, row) => {
                const cell = board[row][col];
                const isWinning = state.winningCells?.some(([r, c]) => r === row && c === col);
                return (
                  <div
                    key={`${row}-${col}`}
                    className={`w-8 h-8 sm:w-11 sm:h-11 md:w-13 md:h-13 rounded-full border border-black/40 flex items-center justify-center transition-all ${
                      cell === "red"
                        ? "bg-gradient-to-br from-rose-500 to-red-600 shadow-md shadow-rose-500/30"
                        : cell === "yellow"
                        ? "bg-gradient-to-br from-amber-300 to-yellow-500 shadow-md shadow-amber-500/30"
                        : "bg-background/80 group-hover:bg-muted/40"
                    } ${isWinning ? "ring-4 ring-emerald-400 animate-bounce" : ""}`}
                  >
                    {cell && (
                      <div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-white/25" />
                    )}
                  </div>
                );
              })}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
