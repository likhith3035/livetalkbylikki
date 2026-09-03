import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameRoomState, ReactionGameState } from "../../types";
import { gameAudio } from "../../services/gameSoundService";
import { sendGameMove } from "../../services/gameRoomService";
import { Zap, AlertTriangle, Trophy, Clock, Timer, Sparkles } from "lucide-react";

interface ReactionDashGameProps {
  room: GameRoomState<ReactionGameState>;
  myPlayerId: string;
  isMyTurn: boolean;
  onLocalMove?: (updatedRoom: GameRoomState<ReactionGameState>) => void;
}

export const ReactionDashGame: React.FC<ReactionDashGameProps> = ({
  room,
  myPlayerId,
  onLocalMove,
}) => {
  const state: ReactionGameState = room.gameState || {
    gameState: "waiting",
    greenAt: null,
    hostTimeMs: null,
    guestTimeMs: null,
    winner: null,
  };

  const isHost = room.players.host.id === myPlayerId;
  const isAIMode = room.mode === "ai";
  const isLocalMode = room.mode === "local";

  const timerRef = useRef<any>(null);
  const localGreenRenderedAt = useRef<number | null>(null);
  const [localClicked, setLocalClicked] = useState(false);
  const [myReactionTime, setMyReactionTime] = useState<number | null>(null);

  // Track when screen turns green locally for latency-free reaction measurement
  useEffect(() => {
    if (state.gameState === "go") {
      localGreenRenderedAt.current = performance.now();
    } else if (state.gameState === "waiting") {
      localGreenRenderedAt.current = null;
      setLocalClicked(false);
      setMyReactionTime(null);
    }
  }, [state.gameState, room.round]);

  // Host or Local engine triggers green light after random 1.8s - 4.2s delay
  useEffect(() => {
    if ((isHost || isLocalMode || isAIMode) && state.gameState === "waiting" && room.status === "playing") {
      const delay = Math.floor(Math.random() * 2400) + 1800;
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

        if (isLocalMode || isAIMode) {
          onLocalMove?.({ ...room, gameState: updatedState });
        } else {
          sendGameMove(room.roomCode, updatedState, room.currentTurn);
        }
      }, delay);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.gameState, isHost, isLocalMode, isAIMode, room.status, room.round]);

  // Check if both players have tapped in online multiplayer to finalize winner
  useEffect(() => {
    if (
      !isLocalMode &&
      !isAIMode &&
      state.gameState === "clicked" &&
      state.hostTimeMs !== null &&
      state.guestTimeMs !== null &&
      !state.winner &&
      room.status === "playing"
    ) {
      const hostTime = state.hostTimeMs;
      const guestTime = state.guestTimeMs;
      const isHostFaster = hostTime < guestTime;
      const isDraw = hostTime === guestTime;

      const winnerId = isDraw ? "draw" : isHostFaster ? room.players.host.id : room.players.guest?.id || "guest";
      let nextHostScore = room.players.host.score;
      let nextGuestScore = room.players.guest?.score || 0;

      if (!isDraw) {
        if (isHostFaster) nextHostScore += 1;
        else nextGuestScore += 1;
      }

      const finalState: ReactionGameState = {
        ...state,
        winner: winnerId,
      };

      const finalRoom = {
        ...room,
        gameState: finalState,
        winnerId,
        status: "round_over" as const,
        players: {
          host: { ...room.players.host, score: nextHostScore },
          guest: room.players.guest ? { ...room.players.guest, score: nextGuestScore } : null,
        },
      };

      if (winnerId === myPlayerId) {
        gameAudio.playWin();
      } else if (winnerId === "draw") {
        gameAudio.playDraw();
      } else {
        gameAudio.playLose();
      }

      if (isHost) {
        sendGameMove(
          room.roomCode,
          finalState,
          room.currentTurn,
          winnerId,
          true,
          nextHostScore,
          nextGuestScore,
          room.rules?.turnTimerSeconds || 0,
          room.rules?.maxSeriesWins || 2
        );
      }
    }
  }, [state.hostTimeMs, state.guestTimeMs, state.gameState, state.winner, isLocalMode, isAIMode, isHost, room, myPlayerId]);

  // Tap handler
  const handlePadTap = async (playerKey?: "host" | "guest") => {
    if (localClicked || room.status === "round_over" || room.status === "game_over") return;

    // ── 1. False Start (Tapped while waiting) ──
    if (state.gameState === "waiting") {
      gameAudio.playLose();
      setLocalClicked(true);

      const falseStartPlayer = isLocalMode
        ? playerKey === "host"
          ? room.players.host.id
          : room.players.guest?.id || "player_2"
        : myPlayerId;

      const winnerId = falseStartPlayer === room.players.host.id
        ? room.players.guest?.id || (isAIMode ? "ai_opponent" : "guest")
        : room.players.host.id;

      let nextHostScore = room.players.host.score;
      let nextGuestScore = room.players.guest?.score || 0;

      if (winnerId === room.players.host.id) nextHostScore += 1;
      else nextGuestScore += 1;

      const updatedState: ReactionGameState = {
        gameState: "false_start",
        greenAt: state.greenAt ?? null,
        hostTimeMs: falseStartPlayer === room.players.host.id ? -1 : null,
        guestTimeMs: falseStartPlayer !== room.players.host.id ? -1 : null,
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

      if (isLocalMode || isAIMode) {
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

    // ── 2. Green Light Tap (Valid Reaction) ──
    if (state.gameState === "go") {
      const reactionTime = localGreenRenderedAt.current
        ? Math.max(1, Math.round(performance.now() - localGreenRenderedAt.current))
        : state.greenAt
        ? Math.max(1, Date.now() - state.greenAt)
        : 250;

      setLocalClicked(true);
      setMyReactionTime(reactionTime);
      gameAudio.playClick();

      // Mode A: Pass & Play Local (2 players on 1 screen)
      if (isLocalMode) {
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

      // Mode B: Play vs AI Bot
      if (isAIMode) {
        const diff = room.rules?.aiDifficulty || "medium";
        const aiBase = diff === "hard" ? 180 : diff === "easy" ? 360 : 260;
        const aiVariance = diff === "hard" ? 50 : diff === "easy" ? 110 : 70;
        const aiTime = Math.floor(Math.random() * aiVariance) + aiBase;

        const userWon = reactionTime < aiTime;
        const isDraw = reactionTime === aiTime;
        const winnerId = isDraw ? "draw" : userWon ? room.players.host.id : "ai_opponent";

        let nextHostScore = room.players.host.score;
        let nextGuestScore = room.players.guest?.score || 0;

        if (userWon) {
          nextHostScore += 1;
          gameAudio.playWin();
        } else if (isDraw) {
          gameAudio.playDraw();
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

      // Mode C: Online Multiplayer (Friend / Quick Match)
      const newHostTime = isHost ? reactionTime : (state.hostTimeMs ?? null);
      const newGuestTime = !isHost ? reactionTime : (state.guestTimeMs ?? null);

      const bothTapped = newHostTime !== null && newGuestTime !== null;
      let winnerId: string | null = null;
      let nextHostScore = room.players.host.score;
      let nextGuestScore = room.players.guest?.score || 0;

      if (bothTapped) {
        const hostFaster = (newHostTime as number) < (newGuestTime as number);
        winnerId = hostFaster ? room.players.host.id : room.players.guest?.id || "guest";
        if (hostFaster) nextHostScore += 1;
        else nextGuestScore += 1;
      }

      const updatedState: ReactionGameState = {
        gameState: "clicked",
        greenAt: state.greenAt,
        hostTimeMs: newHostTime,
        guestTimeMs: newGuestTime,
        winner: winnerId,
      };

      await sendGameMove(
        room.roomCode,
        updatedState,
        room.currentTurn,
        winnerId,
        bothTapped,
        nextHostScore,
        nextGuestScore,
        room.rules?.turnTimerSeconds || 0,
        room.rules?.maxSeriesWins || 2
      );
    }
  };

  // Correct player perspective values
  const myRecordedTime = isHost ? state.hostTimeMs : state.guestTimeMs;
  const opponentRecordedTime = isHost ? state.guestTimeMs : state.hostTimeMs;
  const displayTime = myReactionTime || (myRecordedTime && myRecordedTime > 0 ? myRecordedTime : null);

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 w-full max-w-sm sm:max-w-md select-none touch-manipulation">
      {isLocalMode ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full h-60 xs:h-64 sm:h-80">
          <button
            type="button"
            onClick={() => handlePadTap("host")}
            className={`rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center p-3 sm:p-4 transition-all font-black text-base sm:text-lg cursor-pointer active:scale-95 touch-manipulation ${
              state.gameState === "go"
                ? "bg-emerald-500 text-white animate-pulse shadow-[0_0_25px_rgba(16,185,129,0.7)]"
                : state.gameState === "false_start"
                ? "bg-rose-500/30 text-rose-300 border border-rose-500/40"
                : "bg-rose-950/40 border border-rose-500/30 text-rose-300"
            }`}
          >
            <span className="truncate max-w-[90px] xs:max-w-[120px]">{room.players.host.name}</span>
            <span className="text-[11px] sm:text-xs font-normal opacity-80 mt-1">
              {state.gameState === "go" ? "⚡ TAP NOW!" : "WAIT..."}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handlePadTap("guest")}
            className={`rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center p-3 sm:p-4 transition-all font-black text-base sm:text-lg cursor-pointer active:scale-95 touch-manipulation ${
              state.gameState === "go"
                ? "bg-emerald-500 text-white animate-pulse shadow-[0_0_25px_rgba(16,185,129,0.7)]"
                : state.gameState === "false_start"
                ? "bg-rose-500/30 text-rose-300 border border-rose-500/40"
                : "bg-rose-950/40 border border-rose-500/30 text-rose-300"
            }`}
          >
            <span className="truncate max-w-[90px] xs:max-w-[120px]">{room.players.guest?.name || "Player 2"}</span>
            <span className="text-[11px] sm:text-xs font-normal opacity-80 mt-1">
              {state.gameState === "go" ? "⚡ TAP NOW!" : "WAIT..."}
            </span>
          </button>
        </div>
      ) : (
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => handlePadTap()}
          className={`w-full h-60 xs:h-64 sm:h-80 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center gap-2.5 sm:gap-3 p-4 sm:p-6 transition-all duration-200 shadow-2xl cursor-pointer touch-manipulation ${
            state.gameState === "go"
              ? "bg-emerald-500 text-emerald-950 shadow-[0_0_35px_rgba(16,185,129,0.8)] scale-[1.02]"
              : state.gameState === "false_start"
              ? "bg-rose-500/20 border-2 border-rose-500 text-rose-300"
              : state.gameState === "clicked"
              ? "bg-card border-2 border-primary/40 text-foreground"
              : "bg-rose-950/40 border-2 border-rose-500/30 hover:border-rose-500/50 text-rose-200"
          }`}
        >
          {state.gameState === "go" && (
            <>
              <Zap className="w-16 h-16 animate-bounce text-emerald-950" />
              <span className="text-4xl font-black uppercase tracking-tight text-emerald-950">
                ⚡ TAP NOW!
              </span>
              <span className="text-xs font-extrabold text-emerald-950/80">LIGHT IS GREEN!</span>
            </>
          )}

          {state.gameState === "waiting" && (
            <>
              <div className="w-12 h-12 rounded-full border-4 border-rose-500/40 border-t-rose-400 animate-spin" />
              <span className="text-2xl font-black text-rose-300">Wait for GREEN...</span>
              <span className="text-xs text-rose-300/70 font-medium">Don't tap too early!</span>
            </>
          )}

          {state.gameState === "false_start" && (
            <>
              <AlertTriangle className="w-14 h-14 text-rose-400 animate-pulse" />
              <span className="text-2xl font-black text-rose-400">False Start!</span>
              <span className="text-xs text-muted-foreground">Tapped before the green signal</span>
            </>
          )}

          {state.gameState === "clicked" && (
            <>
              <Trophy className="w-14 h-14 text-amber-400 animate-pulse" />
              <span className="text-3xl font-black text-foreground">
                {displayTime ? `${displayTime} ms` : "Time Locked!"}
              </span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                {opponentRecordedTime && opponentRecordedTime > 0 ? (
                  <span>Opponent: <strong className="text-primary">{opponentRecordedTime} ms</strong></span>
                ) : (
                  <span>Awaiting opponent tap...</span>
                )}
              </div>
            </>
          )}
        </motion.button>
      )}
    </div>
  );
};
