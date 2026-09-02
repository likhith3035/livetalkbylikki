import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GameRoomState, TicTacToeState } from "../../types";
import { gameAudio } from "../../services/gameSoundService";
import { sendGameMove } from "../../services/gameRoomService";

interface TicTacToeGameProps {
  room: GameRoomState<TicTacToeState>;
  myPlayerId: string;
  isMyTurn: boolean;
  onLocalMove?: (updatedRoom: GameRoomState<TicTacToeState>) => void;
}

type TicTacToeCell = "" | "X" | "O";

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function checkTicTacToeWinner(board: TicTacToeCell[]): { winner: TicTacToeCell | null; line: number[] | null } {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combo };
    }
  }
  return { winner: null, line: null };
}

export function getSmartAIMove(
  board: TicTacToeCell[],
  aiSymbol: "X" | "O",
  difficulty: "easy" | "medium" | "hard" = "medium"
): number {
  const humanSymbol = aiSymbol === "X" ? "O" : "X";
  const available = board.map((cell, idx) => (!cell ? idx : null)).filter((idx): idx is number => idx !== null);
  if (available.length === 0) return 0;

  // Casual Easy Bot: 70% random mistake rate
  if (difficulty === "easy" && Math.random() < 0.7) {
    return available[Math.floor(Math.random() * available.length)];
  }

  // Challenger Medium Bot: 35% random mistake rate
  if (difficulty === "medium" && Math.random() < 0.35) {
    return available[Math.floor(Math.random() * available.length)];
  }

  // Check if AI can win immediately
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      const copy = [...board];
      copy[i] = aiSymbol;
      if (checkTicTacToeWinner(copy).winner === aiSymbol) return i;
    }
  }

  // Check if human can win and block
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      const copy = [...board];
      copy[i] = humanSymbol;
      if (checkTicTacToeWinner(copy).winner === humanSymbol) return i;
    }
  }

  // Take Center if available
  if (!board[4]) return 4;

  // Take Corners
  const corners = [0, 2, 6, 8].filter((idx) => !board[idx]);
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  // Any remaining cell
  return available[0] ?? 0;
}

export const TicTacToeGame: React.FC<TicTacToeGameProps> = ({ room, myPlayerId, isMyTurn, onLocalMove }) => {
  const state = room.gameState || { board: Array(9).fill(""), winningLine: null };
  const rawBoard = state.board || [];
  const board: TicTacToeCell[] = Array.from({ length: 9 }, (_, i) => rawBoard[i] || "");

  const isHost = room.players.host.id === myPlayerId;
  const mySymbol: "X" | "O" = isHost ? "X" : "O";
  const currentSymbol: "X" | "O" = room.currentTurn === room.players.host.id ? "X" : "O";

  const handleCellClick = async (index: number) => {
    if (board[index] || room.status === "round_over" || room.status === "game_over") return;
    if (room.mode !== "local" && !isMyTurn) return;

    const newBoard = [...board];
    const moveSymbol = room.mode === "local" ? currentSymbol : mySymbol;
    newBoard[index] = moveSymbol;
    gameAudio.playMove();

    const { winner, line } = checkTicTacToeWinner(newBoard);
    const isFull = newBoard.every((cell) => cell === "X" || cell === "O");
    const isOver = !!winner || isFull;

    let winnerPlayerId: string | null = null;
    let nextHostScore = room.players.host.score;
    let nextGuestScore = room.players.guest?.score || 0;

    if (winner) {
      if (room.mode === "local") {
        winnerPlayerId = moveSymbol === "X" ? room.players.host.id : (room.players.guest?.id || "local_player_2");
      } else {
        winnerPlayerId = winner === mySymbol ? myPlayerId : (isHost ? room.players.guest?.id || null : room.players.host.id);
      }

      if (winnerPlayerId === room.players.host.id) {
        nextHostScore += 1;
      } else if (winnerPlayerId) {
        nextGuestScore += 1;
      }

      if (winnerPlayerId === myPlayerId || room.mode === "local") {
        gameAudio.playWin();
      } else {
        gameAudio.playLose();
      }
    } else if (isFull) {
      winnerPlayerId = "draw";
      gameAudio.playDraw();
    }

    const nextTurnId = isOver
      ? room.currentTurn
      : room.currentTurn === room.players.host.id
      ? (room.players.guest?.id || (room.mode === "ai" ? "ai_opponent" : "local_player_2"))
      : room.players.host.id;

    const updatedState: TicTacToeState = {
      board: newBoard,
      winningLine: line,
    };

    if (room.mode === "local") {
      const updatedRoom: GameRoomState<TicTacToeState> = {
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
      const updatedRoom: GameRoomState<TicTacToeState> = {
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
          const aiDifficulty = room.rules?.aiDifficulty || "medium";
          const aiMoveIndex = getSmartAIMove(newBoard, "O", aiDifficulty);
          const aiBoard = [...newBoard];
          aiBoard[aiMoveIndex] = "O";
          gameAudio.playMove();

          const aiResult = checkTicTacToeWinner(aiBoard);
          const aiFull = aiBoard.every((cell) => cell === "X" || cell === "O");
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

          const aiUpdatedState: TicTacToeState = {
            board: aiBoard,
            winningLine: aiResult.line,
          };

          const aiUpdatedRoom: GameRoomState<TicTacToeState> = {
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
        }, 500);
      }
      return;
    }

    // Multiplayer (Online / Friend QR)
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
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 select-none w-full max-w-[320px] xs:max-w-sm mx-auto touch-manipulation">
      <div className="grid grid-cols-3 gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-card border-2 border-border shadow-2xl w-full aspect-square relative">
        {board.map((cell, index) => {
          const isWinningCell = state.winningLine?.includes(index);
          return (
            <motion.button
              key={index}
              whileHover={{ scale: cell || (!isMyTurn && room.mode !== "local") ? 1 : 1.03 }}
              whileTap={{ scale: cell || (!isMyTurn && room.mode !== "local") ? 1 : 0.96 }}
              onClick={() => handleCellClick(index)}
              disabled={!!cell || (room.mode !== "local" && !isMyTurn)}
              className={`aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center text-3xl sm:text-5xl font-black transition-all duration-200 border ${
                isWinningCell
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-400 scale-105 shadow-lg shadow-emerald-500/20"
                  : cell
                  ? "bg-muted/60 border-border/80 text-foreground"
                  : "bg-muted/20 hover:bg-muted/40 border-border/40 hover:border-primary/50 cursor-pointer"
              } ${
                cell === "X" ? "text-violet-400" : cell === "O" ? "text-cyan-400" : ""
              }`}
            >
              {cell && (
                <motion.span
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 450, damping: 20 }}
                >
                  {cell}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
