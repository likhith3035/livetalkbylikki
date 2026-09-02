import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GameRoomState, MemoryGameState } from "../../types";
import { gameAudio } from "../../services/gameSoundService";
import { sendGameMove } from "../../services/gameRoomService";

interface MemoryDuelGameProps {
  room: GameRoomState<MemoryGameState>;
  myPlayerId: string;
  isMyTurn: boolean;
  onLocalMove?: (updatedRoom: GameRoomState<MemoryGameState>) => void;
}

export const MemoryDuelGame: React.FC<MemoryDuelGameProps> = ({ room, myPlayerId, isMyTurn, onLocalMove }) => {
  const state = room.gameState || { cards: [], flippedCardIds: [], hostPairs: 0, guestPairs: 0, totalPairs: 8 };
  const isHost = room.players.host.id === myPlayerId;
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setIsProcessing(false);
  }, [room.round, room.status]);

  const handleCardClick = async (cardId: number) => {
    if (isProcessing || room.status === "round_over" || room.status === "game_over") return;
    if (room.mode !== "local" && !isMyTurn) return;

    const card = state.cards.find((c) => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    gameAudio.playFlip();

    const newFlipped = [...state.flippedCardIds, cardId];
    const newCards = state.cards.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c));

    if (newFlipped.length === 1) {
      const updatedState: MemoryGameState = {
        ...state,
        cards: newCards,
        flippedCardIds: newFlipped,
      };
      if (room.mode === "local" || room.mode === "ai") {
        onLocalMove?.({ ...room, gameState: updatedState });
      } else {
        await sendGameMove(
          room.roomCode,
          updatedState,
          room.currentTurn,
          null,
          false,
          undefined,
          undefined,
          room.rules?.turnTimerSeconds || 0,
          room.rules?.maxSeriesWins || 2
        );
      }
      return;
    }

    if (newFlipped.length === 2) {
      setIsProcessing(true);
      const [firstId, secondId] = newFlipped;
      const firstCard = newCards.find((c) => c.id === firstId);
      const secondCard = newCards.find((c) => c.id === secondId);

      const isMatch = firstCard && secondCard && firstCard.emoji === secondCard.emoji;

      if (isMatch) {
        gameAudio.playMatch();
        const currentActivePlayerId = room.currentTurn;
        const matchedCards = newCards.map((c) =>
          c.id === firstId || c.id === secondId ? { ...c, isMatched: true, matchedBy: currentActivePlayerId } : c
        );

        const newHostPairs = currentActivePlayerId === room.players.host.id ? state.hostPairs + 1 : state.hostPairs;
        const newGuestPairs = currentActivePlayerId !== room.players.host.id ? state.guestPairs + 1 : state.guestPairs;
        const allMatched = matchedCards.every((c) => c.isMatched);

        let winnerId: string | null = null;
        let nextHostScore = room.players.host.score;
        let nextGuestScore = room.players.guest?.score || 0;

        if (allMatched) {
          if (newHostPairs > newGuestPairs) {
            winnerId = room.players.host.id;
            nextHostScore += 1;
          } else if (newGuestPairs > newHostPairs) {
            winnerId = room.players.guest?.id || "guest";
            nextGuestScore += 1;
          } else {
            winnerId = "draw";
          }
          gameAudio.playWin();
        }

        const updatedState: MemoryGameState = {
          cards: matchedCards,
          flippedCardIds: [],
          hostPairs: newHostPairs,
          guestPairs: newGuestPairs,
          totalPairs: state.totalPairs,
        };

        const updatedRoom = {
          ...room,
          gameState: updatedState,
          winnerId,
          status: allMatched ? ("round_over" as const) : ("playing" as const),
          players: {
            host: { ...room.players.host, score: nextHostScore },
            guest: room.players.guest ? { ...room.players.guest, score: nextGuestScore } : null,
          },
        };

        if (room.mode === "local" || room.mode === "ai") {
          onLocalMove?.(updatedRoom);
          setIsProcessing(false);
        } else {
          await sendGameMove(
            room.roomCode,
            updatedState,
            room.currentTurn,
            winnerId,
            allMatched,
            nextHostScore,
            nextGuestScore,
            room.rules?.turnTimerSeconds || 0,
            room.rules?.maxSeriesWins || 2
          );
          setIsProcessing(false);
        }
      } else {
        // Mismatch: flip back after 800ms and pass turn
        setTimeout(async () => {
          const resetCards = newCards.map((c) =>
            c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
          );
          const nextTurnId = room.currentTurn === room.players.host.id
            ? (room.players.guest?.id || (room.mode === "ai" ? "ai_opponent" : "local_player_2"))
            : room.players.host.id;

          const updatedState: MemoryGameState = {
            ...state,
            cards: resetCards,
            flippedCardIds: [],
          };

          const updatedRoom = {
            ...room,
            gameState: updatedState,
            currentTurn: nextTurnId,
          };

          if (room.mode === "local" || room.mode === "ai") {
            onLocalMove?.(updatedRoom);
            setIsProcessing(false);
          } else {
            await sendGameMove(
              room.roomCode,
              updatedState,
              nextTurnId,
              null,
              false,
              undefined,
              undefined,
              room.rules?.turnTimerSeconds || 0,
              room.rules?.maxSeriesWins || 2
            );
            setIsProcessing(false);
          }
        }, 800);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 select-none w-full max-w-[340px] xs:max-w-sm sm:max-w-md mx-auto touch-manipulation">
      {/* Pairs Scored Tracker */}
      <div className="flex items-center justify-between w-full text-[11px] sm:text-xs font-bold mb-2.5 sm:mb-3 gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-card border border-border shadow-sm truncate min-w-0">
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-violet-500 shrink-0" />
          <span className="truncate">{room.players.host.name}: {state.hostPairs}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-card border border-border shadow-sm truncate min-w-0">
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-cyan-500 shrink-0" />
          <span className="truncate">{room.players.guest?.name || "Player 2"}: {state.guestPairs}</span>
        </div>
      </div>

      {/* 4x4 Grid */}
      <div className="grid grid-cols-4 gap-1.5 xs:gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-card border-2 border-border shadow-2xl w-full aspect-square">
        {state.cards.map((card) => {
          const isRevealed = card.isFlipped || card.isMatched;
          const isMatchedByMe = card.isMatched && card.matchedBy === myPlayerId;
          return (
            <motion.button
              key={card.id}
              whileHover={{ scale: isRevealed || (!isMyTurn && room.mode !== "local") ? 1 : 1.05 }}
              whileTap={{ scale: isRevealed || (!isMyTurn && room.mode !== "local") ? 1 : 0.95 }}
              onClick={() => handleCardClick(card.id)}
              disabled={isRevealed || isProcessing || (room.mode !== "local" && !isMyTurn)}
              className={`aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl xs:text-3xl sm:text-4xl transition-all duration-300 border ${
                card.isMatched
                  ? isMatchedByMe
                    ? "bg-violet-500/20 border-2 border-violet-500/60 shadow-md shadow-violet-500/20 opacity-80"
                    : "bg-cyan-500/20 border-2 border-cyan-500/60 shadow-md shadow-cyan-500/20 opacity-80"
                  : card.isFlipped
                  ? "bg-primary/20 border-2 border-primary shadow-lg shadow-primary/30"
                  : "bg-muted/40 hover:bg-primary/10 border-border cursor-pointer"
              }`}
            >
              {isRevealed ? (
                <motion.span
                  initial={{ scale: 0, rotateY: 180 }}
                  animate={{ scale: 1, rotateY: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {card.emoji}
                </motion.span>
              ) : (
                <span className="text-muted-foreground/40 font-bold text-base sm:text-lg">?</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
