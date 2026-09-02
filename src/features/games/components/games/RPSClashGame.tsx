import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameRoomState, RPSChoice, RPSState } from "../../types";
import { gameAudio } from "../../services/gameSoundService";
import { sendGameMove } from "../../services/gameRoomService";

interface RPSClashGameProps {
  room: GameRoomState<RPSState>;
  myPlayerId: string;
  isMyTurn: boolean;
  onLocalMove?: (updatedRoom: GameRoomState<RPSState>) => void;
}

const CHOICES: { id: "rock" | "paper" | "scissors"; label: string; emoji: string; color: string }[] = [
  { id: "rock", label: "Rock", emoji: "🪨", color: "from-amber-500/20 to-orange-600/20 border-amber-500/40" },
  { id: "paper", label: "Paper", emoji: "📄", color: "from-blue-500/20 to-indigo-600/20 border-blue-500/40" },
  { id: "scissors", label: "Scissors", emoji: "✂️", color: "from-rose-500/20 to-pink-600/20 border-rose-500/40" },
];

export function determineRPSWinner(p1: RPSChoice, p2: RPSChoice): "p1" | "p2" | "draw" {
  if (!p1 || !p2) return "draw";
  if (p1 === p2) return "draw";
  if (
    (p1 === "rock" && p2 === "scissors") ||
    (p1 === "paper" && p2 === "rock") ||
    (p1 === "scissors" && p2 === "paper")
  ) {
    return "p1";
  }
  return "p2";
}

export const RPSClashGame: React.FC<RPSClashGameProps> = ({ room, myPlayerId, onLocalMove }) => {
  const state = room.gameState || { hostChoice: "", guestChoice: "", roundWinner: null, revealed: false };
  const isHost = room.players.host.id === myPlayerId;
  const [localChoice, setLocalChoice] = useState<RPSChoice>("");

  const hasMyChoice = isHost ? !!state.hostChoice : !!state.guestChoice;
  const hasOpponentChoice = isHost ? !!state.guestChoice : !!state.hostChoice;

  // Reset local choice on new rounds
  useEffect(() => {
    if (room.status === "playing" && !state.hostChoice && !state.guestChoice) {
      setLocalChoice("");
    }
  }, [room.round, room.status, state.hostChoice, state.guestChoice]);

  const handleSelectChoice = async (choice: "rock" | "paper" | "scissors") => {
    if (room.status === "round_over" || room.status === "game_over") return;
    if (hasMyChoice) return;

    gameAudio.playClick();
    setLocalChoice(choice);

    if (room.mode === "local") {
      if (!state.hostChoice) {
        const nextState: RPSState = { ...state, hostChoice: choice };
        onLocalMove?.({ ...room, gameState: nextState });
        return;
      } else {
        const hostC = state.hostChoice;
        const guestC = choice;
        const outcome = determineRPSWinner(hostC, guestC);

        let winnerId: string | null = null;
        let nextHostScore = room.players.host.score;
        let nextGuestScore = room.players.guest?.score || 0;

        if (outcome === "p1") {
          winnerId = room.players.host.id;
          nextHostScore += 1;
        } else if (outcome === "p2") {
          winnerId = room.players.guest?.id || "local_player_2";
          nextGuestScore += 1;
        } else {
          winnerId = "draw";
        }

        const nextState: RPSState = {
          hostChoice: hostC,
          guestChoice: guestC,
          roundWinner: winnerId,
          revealed: true,
        };

        const updatedRoom = {
          ...room,
          gameState: nextState,
          winnerId,
          status: "round_over" as const,
          players: {
            host: { ...room.players.host, score: nextHostScore },
            guest: room.players.guest ? { ...room.players.guest, score: nextGuestScore } : null,
          },
        };

        if (winnerId === "draw") gameAudio.playDraw();
        else gameAudio.playWin();

        onLocalMove?.(updatedRoom);
        return;
      }
    }

    if (room.mode === "ai") {
      const hostC = choice;
      const aiChoices: ("rock" | "paper" | "scissors")[] = ["rock", "paper", "scissors"];
      const aiC = aiChoices[Math.floor(Math.random() * aiChoices.length)];

      const outcome = determineRPSWinner(hostC, aiC);
      let winnerId: string | null = null;
      let nextHostScore = room.players.host.score;
      let nextGuestScore = room.players.guest?.score || 0;

      if (outcome === "p1") {
        winnerId = room.players.host.id;
        nextHostScore += 1;
      } else if (outcome === "p2") {
        winnerId = "ai_opponent";
        nextGuestScore += 1;
      } else {
        winnerId = "draw";
      }

      const nextState: RPSState = {
        hostChoice: hostC,
        guestChoice: aiC,
        roundWinner: winnerId,
        revealed: true,
      };

      const updatedRoom = {
        ...room,
        gameState: nextState,
        winnerId,
        status: "round_over" as const,
        players: {
          host: { ...room.players.host, score: nextHostScore },
          guest: room.players.guest ? { ...room.players.guest, score: nextGuestScore } : null,
        },
      };

      if (winnerId === room.players.host.id) gameAudio.playWin();
      else if (winnerId === "ai_opponent") gameAudio.playLose();
      else gameAudio.playDraw();

      onLocalMove?.(updatedRoom);
      return;
    }

    // Multiplayer (Friend / Online)
    const newHostChoice = isHost ? choice : state.hostChoice;
    const newGuestChoice = !isHost ? choice : state.guestChoice;

    if (newHostChoice && newGuestChoice) {
      const outcome = determineRPSWinner(newHostChoice, newGuestChoice);
      let winnerId: string | null = null;
      let nextHostScore = room.players.host.score;
      let nextGuestScore = room.players.guest?.score || 0;

      if (outcome === "p1") {
        winnerId = room.players.host.id;
        nextHostScore += 1;
      } else if (outcome === "p2") {
        winnerId = room.players.guest?.id || null;
        if (winnerId) nextGuestScore += 1;
      } else {
        winnerId = "draw";
      }

      const nextState: RPSState = {
        hostChoice: newHostChoice,
        guestChoice: newGuestChoice,
        roundWinner: winnerId,
        revealed: true,
      };

      await sendGameMove(
        room.roomCode,
        nextState,
        room.players.host.id,
        winnerId,
        true,
        nextHostScore,
        nextGuestScore,
        room.rules?.turnTimerSeconds || 0,
        room.rules?.maxSeriesWins || 2
      );
    } else {
      const nextState: RPSState = {
        ...state,
        hostChoice: newHostChoice,
        guestChoice: newGuestChoice,
      };
      await sendGameMove(
        room.roomCode,
        nextState,
        room.currentTurn,
        null,
        false
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full max-w-md select-none">
      {/* Choice Reveal Stage */}
      {state.revealed ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center justify-around w-full p-6 rounded-3xl bg-card border border-border shadow-2xl mb-6"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              {room.players.host.name}
            </span>
            <div className="w-20 h-20 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-4xl shadow-inner">
              {CHOICES.find((c) => c.id === state.hostChoice)?.emoji}
            </div>
            <span className="text-sm font-bold capitalize text-primary">
              {state.hostChoice}
            </span>
          </div>

          <div className="text-2xl font-black text-muted-foreground/40 italic">VS</div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              {room.players.guest?.name || "Player 2"}
            </span>
            <div className="w-20 h-20 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-4xl shadow-inner">
              {CHOICES.find((c) => c.id === state.guestChoice)?.emoji}
            </div>
            <span className="text-sm font-bold capitalize text-cyan-400">
              {state.guestChoice}
            </span>
          </div>
        </motion.div>
      ) : (
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-semibold flex items-center gap-2 shadow-sm">
            <span>You:</span>
            {hasMyChoice ? (
              <span className="text-emerald-500 flex items-center gap-1 font-bold">✓ Ready</span>
            ) : (
              <span className="text-amber-500 animate-pulse font-bold">Picking...</span>
            )}
          </div>
          <div className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-semibold flex items-center gap-2 shadow-sm">
            <span>Opponent:</span>
            {hasOpponentChoice ? (
              <span className="text-emerald-500 flex items-center gap-1 font-bold">✓ Ready</span>
            ) : (
              <span className="text-muted-foreground animate-pulse font-bold">Thinking...</span>
            )}
          </div>
        </div>
      )}

      {/* Choice Buttons */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {CHOICES.map((choice) => {
          const isSelected = localChoice === choice.id || (isHost ? state.hostChoice === choice.id : state.guestChoice === choice.id);
          return (
            <motion.button
              key={choice.id}
              whileHover={{ scale: state.revealed ? 1 : 1.05 }}
              whileTap={{ scale: state.revealed ? 1 : 0.95 }}
              onClick={() => handleSelectChoice(choice.id)}
              disabled={hasMyChoice || state.revealed}
              className={`flex flex-col items-center justify-center gap-2 p-4 sm:p-5 rounded-2xl bg-gradient-to-b ${choice.color} border transition-all cursor-pointer ${
                isSelected ? "ring-2 ring-primary shadow-lg shadow-primary/20 scale-105" : "hover:border-primary/50"
              }`}
            >
              <span className="text-4xl sm:text-5xl">{choice.emoji}</span>
              <span className="text-sm font-bold text-foreground">{choice.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
