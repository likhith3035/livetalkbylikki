import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GameRoomState, ReactionGameState } from "../../types";
import { gameAudio } from "../../services/gameSoundService";
import { sendGameMove } from "../../services/gameRoomService";
import { Zap, AlertTriangle, Trophy } from "lucide-react";

interface ReactionDashGameProps {
  room: GameRoomState<ReactionGameState>;
  myPlayerId: string;
  isMyTurn: boolean;
  onLocalMove?: (updatedRoom: GameRoomState<ReactionGameState>) => void;
}

export const ReactionDashGame: React.FC<ReactionDashGameProps> = ({ room, myPlayerId, onLocalMove }) => {
  const state: ReactionGameState = room.gameState || {
    gameState: "waiting",
    greenAt: null,
    hostTimeMs: null,
    guestTimeMs: null,
    winner: null,
  };
  const isHost = room.players.host.id === myPlayerId;
  const timerRef = useRef<any>(null);
  const [localClicked, setLocalClicked] = useState(false);

  // Reset local clicked state when waiting for green or on new round
  useEffect(() => {
    if (state.gameState === "waiting") {
      setLocalClicked(false);
    }
  }, [state.gameState, room.round]);

  useEffect(() => {
    if ((isHost || room.mode === "local" || room.mode === "ai") && state.gameState === "waiting") {
      const delay = Math.floor(Math.random() * 2500) + 1800;
      timerRef.current = setTimeout(() => {
        const greenTime = Date.now();
        gameAudio.playGo();

        const updatedState: ReactionGameState = {
          gameState: "go",
          greenAt: greenTime,
          hostTimeMs: null,
          guestTimeMs: null,
          winner: null,
        };

        if (room.mode === "local" || room.mode === "ai") {
          onLocalMove?.({ ...room, gameState: updatedState });
        } else {
          sendGameMove(room.roomCode, updatedState, room.currentTurn);
        }
      }, delay);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.gameState, isHost, room.mode]);

  const handlePadTap = async (playerKey?: "host" | "guest") => {
    if (localClicked || room.status === "round_over" || room.status === "game_over") return;

    if (state.gameState === "waiting") {
      gameAudio.playLose();
      const winnerId = isHost ? room.players.guest?.id || "guest" : room.players.host.id;
      let nextHostScore = room.players.host.score;
      let nextGuestScore = room.players.guest?.score || 0;

      if (winnerId === room.players.host.id) nextHostScore += 1;
      else nextGuestScore += 1;

      const updatedState: ReactionGameState = {
        gameState: "false_start",
        greenAt: state.greenAt ?? null,
        hostTimeMs: state.hostTimeMs ?? null,
        guestTimeMs: state.guestTimeMs ?? null,
        winner: winnerId,
      };

      const updatedRoom = {
        ...room,
        gameState: updatedState,
        winnerId,
        status: "round_over" as const,
        players: {
          host: { ...room.players.host, score: nextHostScore },
          guest: room.players.guest ? { ...room.players.guest, score: nextGuestScore } : null,
        },
      };

      if (room.mode === "local" || room.mode === "ai") {
        onLocalMove?.(updatedRoom);
      } else {
        await sendGameMove(
          room.roomCode,
          updatedState,
          room.currentTurn,
          winnerId,
          true,
          nextHostScore,
          nextGuestScore,
          room.rules?.turnTimerSeconds || 0,
          room.rules?.maxSeriesWins || 2
        );
      }
      return;
    }

    if (state.gameState === "go" && state.greenAt) {
      const reactionTime = Date.now() - state.greenAt;
      setLocalClicked(true);
      gameAudio.playClick();

      if (room.mode === "local") {
        const isHostTap = playerKey === "host";
        const winnerId = isHostTap ? room.players.host.id : room.players.guest?.id || "player_2";
        let nextHostScore = room.players.host.score;
        let nextGuestScore = room.players.guest?.score || 0;

        if (winnerId === room.players.host.id) nextHostScore += 1;
        else nextGuestScore += 1;

        const updatedState: ReactionGameState = {
          gameState: "clicked",
          greenAt: state.greenAt,
          hostTimeMs: isHostTap ? reactionTime : null,
          guestTimeMs: !isHostTap ? reactionTime : null,
          winner: winnerId,
        };

        const updatedRoom = {
          ...room,
          gameState: updatedState,
          winnerId,
          status: "round_over" as const,
          players: {
            host: { ...room.players.host, score: nextHostScore },
            guest: room.players.guest ? { ...room.players.guest, score: nextGuestScore } : null,
          },
        };

        gameAudio.playWin();
        onLocalMove?.(updatedRoom);
        return;
      }

      if (room.mode === "ai") {
        const aiTime = Math.floor(Math.random() * 120) + 210;
        const userWon = reactionTime < aiTime;
        const winnerId = userWon ? room.players.host.id : "ai_opponent";
        let nextHostScore = room.players.host.score;
        let nextGuestScore = room.players.guest?.score || 0;

        if (userWon) {
          nextHostScore += 1;
          gameAudio.playWin();
        } else {
          nextGuestScore += 1;
          gameAudio.playLose();
        }

        const updatedState: ReactionGameState = {
          gameState: "clicked",
          greenAt: state.greenAt,
          hostTimeMs: reactionTime,
          guestTimeMs: aiTime,
          winner: winnerId,
        };

        const updatedRoom = {
          ...room,
          gameState: updatedState,
          winnerId,
          status: "round_over" as const,
          players: {
            host: { ...room.players.host, score: nextHostScore },
            guest: room.players.guest ? { ...room.players.guest, score: nextGuestScore } : null,
          },
        };

        onLocalMove?.(updatedRoom);
        return;
      }

      // Multiplayer
      const newHostTime = isHost ? reactionTime : (state.hostTimeMs ?? null);
      const newGuestTime = !isHost ? reactionTime : (state.guestTimeMs ?? null);

      let winnerId: string | null = null;
      let isOver = false;
      let nextHostScore = room.players.host.score;
      let nextGuestScore = room.players.guest?.score || 0;

      if (newHostTime && !newGuestTime) {
        winnerId = room.players.host.id;
        nextHostScore += 1;
        isOver = true;
      } else if (newGuestTime && !newHostTime) {
        winnerId = room.players.guest?.id || "guest";
        nextGuestScore += 1;
        isOver = true;
      }

      const updatedState: ReactionGameState = {
        gameState: "clicked",
        greenAt: state.greenAt,
        hostTimeMs: newHostTime,
        guestTimeMs: newGuestTime,
        winner: winnerId,
      };

      if (isOver) {
        if (winnerId === myPlayerId) gameAudio.playWin();
        else gameAudio.playLose();
      }

      await sendGameMove(
        room.roomCode,
        updatedState,
        room.currentTurn,
        winnerId,
        isOver,
        nextHostScore,
        nextGuestScore,
        room.rules?.turnTimerSeconds || 0,
        room.rules?.maxSeriesWins || 2
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 w-full max-w-md select-none mx-auto">
      {room.mode === "local" ? (
        <div className="grid grid-cols-2 gap-4 w-full h-80">
          <button
            onClick={() => handlePadTap("host")}
            className={`rounded-3xl flex flex-col items-center justify-center p-4 transition-all font-black text-lg ${
              state.gameState === "go"
                ? "bg-emerald-500 text-white animate-pulse"
                : state.gameState === "false_start"
                ? "bg-rose-500/30 text-rose-300 border border-rose-500/40"
                : "bg-rose-950/40 border border-rose-500/30 text-rose-300"
            }`}
          >
            <span>{room.players.host.name}</span>
            <span className="text-xs font-normal opacity-80 mt-1">
              {state.gameState === "go" ? "TAP NOW!" : "WAIT..."}
            </span>
          </button>

          <button
            onClick={() => handlePadTap("guest")}
            className={`rounded-3xl flex flex-col items-center justify-center p-4 transition-all font-black text-lg ${
              state.gameState === "go"
                ? "bg-emerald-500 text-white animate-pulse"
                : state.gameState === "false_start"
                ? "bg-rose-500/30 text-rose-300 border border-rose-500/40"
                : "bg-rose-950/40 border border-rose-500/30 text-rose-300"
            }`}
          >
            <span>{room.players.guest?.name || "Player 2"}</span>
            <span className="text-xs font-normal opacity-80 mt-1">
              {state.gameState === "go" ? "TAP NOW!" : "WAIT..."}
            </span>
          </button>
        </div>
      ) : (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => handlePadTap()}
          className={`w-full h-72 sm:h-80 rounded-3xl flex flex-col items-center justify-center gap-3 p-6 transition-all duration-200 shadow-2xl cursor-pointer ${
            state.gameState === "go"
              ? "bg-emerald-500 text-emerald-950 shadow-emerald-500/40"
              : state.gameState === "false_start"
              ? "bg-rose-500/20 border-2 border-rose-500 text-rose-300"
              : state.gameState === "clicked"
              ? "bg-card border border-border text-foreground"
              : "bg-rose-950/40 border-2 border-rose-500/30 hover:border-rose-500/50 text-rose-200"
          }`}
        >
          {state.gameState === "go" && (
            <>
              <Zap className="w-16 h-16 animate-bounce" />
              <span className="text-4xl font-black uppercase tracking-tight">TAP NOW!</span>
            </>
          )}

          {state.gameState === "waiting" && (
            <>
              <div className="w-12 h-12 rounded-full border-4 border-rose-500/40 border-t-rose-400 animate-spin" />
              <span className="text-2xl font-black text-rose-300">Wait for GREEN...</span>
              <span className="text-xs text-rose-300/60 font-medium">Don't tap too early!</span>
            </>
          )}

          {state.gameState === "false_start" && (
            <>
              <AlertTriangle className="w-14 h-14 text-rose-400" />
              <span className="text-2xl font-black text-rose-400">False Start!</span>
              <span className="text-xs text-muted-foreground">Tapped before green signal</span>
            </>
          )}

          {state.gameState === "clicked" && (
            <>
              <Trophy className="w-14 h-14 text-primary" />
              <span className="text-3xl font-black text-foreground">
                {state.hostTimeMs ? `${state.hostTimeMs} ms` : "Finished!"}
              </span>
              {state.guestTimeMs && (
                <span className="text-xs text-muted-foreground font-semibold">
                  Opponent: {state.guestTimeMs} ms
                </span>
              )}
            </>
          )}
        </motion.button>
      )}
    </div>
  );
};
