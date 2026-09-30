import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GameRoomState, MemoryGameState } from "../../types";
import { gameAudio } from "../../services/gameSoundService";
import { sendGameMove } from "../../services/gameRoomService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface MemoryDuelGameProps {
  room: GameRoomState<MemoryGameState>;
  myPlayerId: string;
  isMyTurn: boolean;
  onLocalMove?: (updatedRoom: GameRoomState<MemoryGameState>) => void;
}

export const MemoryDuelGame: React.FC<MemoryDuelGameProps> = ({
  room,
  myPlayerId,
  isMyTurn,
  onLocalMove,
}) => {
  const isHost = room.players.host.id === myPlayerId;
  const hostPlayer = room.players.host;
  const guestPlayer = room.players.guest;

  // Secret Owner Cheat Mode (X-Ray Vision)
  const [isCheatActive, setIsCheatActive] = useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const firstCardClicksRef = useRef(0);
  const lastFirstCardClickTimeRef = useRef(0);

  const handleFirstBoxClick = (e: React.MouseEvent) => {
    if (!isHost) return;
    const now = Date.now();
    if (now - lastFirstCardClickTimeRef.current > 3000) {
      firstCardClicksRef.current = 0;
    }
    lastFirstCardClickTimeRef.current = now;
    firstCardClicksRef.current += 1;

    if (firstCardClicksRef.current >= 5) {
      firstCardClicksRef.current = 0;
      e.stopPropagation();
      if (isCheatActive) {
        setIsCheatActive(false);
        toast.info("👁️ Owner X-Ray Vision Deactivated");
        gameAudio.playClick?.();
      } else {
        setPasscodeInput("");
        setPasscodeError("");
        setShowPassword(false);
        setIsPasscodeModalOpen(true);
        gameAudio.playClick?.();
      }
    }
  };

  const handlePasscodeSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (passcodeInput.trim().toLowerCase() === "likki") {
      setIsCheatActive(true);
      setIsPasscodeModalOpen(false);
      setPasscodeInput("");
      setPasscodeError("");
      toast.success("👁️ Owner X-Ray Mode: ON", {
        description: "All unrevealed cards are now visible at 50% opacity.",
        duration: 3500,
        icon: "✨",
      });
      gameAudio.playWin?.();
    } else {
      setPasscodeError("Invalid passcode. Access denied.");
      gameAudio.playLose?.();
    }
  };

  // Normalize state so arrays are NEVER undefined or non-iterable
  const rawState = room.gameState;
  const state: MemoryGameState = {
    cards: Array.isArray(rawState?.cards) ? rawState.cards : [],
    flippedCardIds: Array.isArray(rawState?.flippedCardIds) ? rawState.flippedCardIds : [],
    hostPairs: rawState?.hostPairs ?? 0,
    guestPairs: rawState?.guestPairs ?? 0,
    totalPairs: rawState?.totalPairs ?? 8,
    gridSize: rawState?.gridSize ?? 4,
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const aiMemoryRef = useRef<Map<number, string>>(new Map());

  const stateRef = useRef<MemoryGameState>(state);
  stateRef.current = state;

  const roomRef = useRef<GameRoomState<MemoryGameState>>(room);
  roomRef.current = room;

  const isProcessingRef = useRef(isProcessing);
  isProcessingRef.current = isProcessing;

  const aiTimersRef = useRef<any[]>([]);
  const clearAiTimers = () => {
    aiTimersRef.current.forEach((t) => clearTimeout(t));
    aiTimersRef.current = [];
  };

  // Track cards revealed in AI memory
  useEffect(() => {
    state.cards.forEach((c) => {
      if (c.isFlipped || c.isMatched) {
        aiMemoryRef.current.set(c.id, c.emoji);
      }
    });
  }, [state.cards]);

  useEffect(() => {
    setIsProcessing(false);
    isProcessingRef.current = false;
    clearAiTimers();
  }, [room.round, room.status]);

  useEffect(() => {
    return () => clearAiTimers();
  }, []);

  const guestDisplayName =
    room.mode === "ai"
      ? "Cyber AI 🤖"
      : room.mode === "local"
      ? "Player 2"
      : !guestPlayer
      ? "Waiting for Player..."
      : guestPlayer?.name === hostPlayer?.name || (isHost && guestPlayer?.name?.toLowerCase() === "you")
      ? "Opponent"
      : guestPlayer?.name || "Opponent";

  const handleCardClick = async (cardId: number) => {
    const currentState = stateRef.current;
    const currentRoom = roomRef.current;

    if (isProcessingRef.current || currentRoom.status === "round_over" || currentRoom.status === "game_over") return;
    if (currentRoom.mode !== "local" && !isMyTurn && currentRoom.currentTurn !== "ai_opponent") return;

    const currentFlipped = Array.isArray(currentState.flippedCardIds) ? currentState.flippedCardIds : [];
    if (currentFlipped.length >= 2) return;

    const card = currentState.cards.find((c) => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    gameAudio.playFlip();

    const newFlipped = [...currentFlipped, cardId];
    const newCards = currentState.cards.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c));

    // Keep stateRef immediately synced for asynchronous AI second card click
    stateRef.current = {
      ...currentState,
      cards: newCards,
      flippedCardIds: newFlipped,
    };

    if (newFlipped.length === 1) {
      const updatedState: MemoryGameState = {
        ...currentState,
        cards: newCards,
        flippedCardIds: newFlipped,
      };
      if (currentRoom.mode === "local" || currentRoom.mode === "ai") {
        onLocalMove?.({ ...currentRoom, gameState: updatedState });
      } else {
        await sendGameMove(
          currentRoom.roomCode,
          updatedState,
          currentRoom.currentTurn,
          null,
          false,
          undefined,
          undefined,
          currentRoom.rules?.turnTimerSeconds || 0,
          currentRoom.rules?.maxSeriesWins || 2
        );
      }
      return;
    }

    if (newFlipped.length === 2) {
      setIsProcessing(true);
      isProcessingRef.current = true;
      const [firstId, secondId] = newFlipped;
      const firstCard = newCards.find((c) => c.id === firstId);
      const secondCard = newCards.find((c) => c.id === secondId);

      const isMatch = firstCard && secondCard && firstCard.emoji === secondCard.emoji;

      if (isMatch) {
        gameAudio.playMatch();
        const currentActivePlayerId = currentRoom.currentTurn;
        const matchedCards = newCards.map((c) =>
          c.id === firstId || c.id === secondId
            ? { ...c, isMatched: true, matchedBy: currentActivePlayerId }
            : c
        );

        const newHostPairs =
          currentActivePlayerId === currentRoom.players.host.id ? currentState.hostPairs + 1 : currentState.hostPairs;
        const newGuestPairs =
          currentActivePlayerId !== currentRoom.players.host.id ? currentState.guestPairs + 1 : currentState.guestPairs;
        const allMatched = matchedCards.every((c) => c.isMatched);

        let winnerId: string | null = null;
        let nextHostScore = currentRoom.players.host.score;
        let nextGuestScore = currentRoom.players.guest?.score || 0;

        if (allMatched) {
          if (newHostPairs > newGuestPairs) {
            winnerId = currentRoom.players.host.id;
            nextHostScore += 1;
          } else if (newGuestPairs > newHostPairs) {
            winnerId = currentRoom.players.guest?.id || (currentRoom.mode === "ai" ? "ai_opponent" : "guest");
            nextGuestScore += 1;
          } else {
            winnerId = "draw";
          }

          if (winnerId === myPlayerId || currentRoom.mode === "local") {
            gameAudio.playWin();
          } else if (winnerId === "draw") {
            gameAudio.playDraw();
          } else {
            gameAudio.playLose();
          }
        }

        const updatedState: MemoryGameState = {
          cards: matchedCards,
          flippedCardIds: [],
          hostPairs: newHostPairs,
          guestPairs: newGuestPairs,
          totalPairs: currentState.totalPairs,
          gridSize: currentState.gridSize,
        };
        stateRef.current = updatedState;

        const updatedRoom = {
          ...currentRoom,
          gameState: updatedState,
          winnerId,
          status: allMatched ? ("round_over" as const) : ("playing" as const),
          players: {
            host: { ...currentRoom.players.host, score: nextHostScore },
            guest: currentRoom.players.guest ? { ...currentRoom.players.guest, score: nextGuestScore } : null,
          },
        };
        roomRef.current = updatedRoom;

        if (currentRoom.mode === "local" || currentRoom.mode === "ai") {
          onLocalMove?.(updatedRoom);
          setIsProcessing(false);
          isProcessingRef.current = false;
        } else {
          await sendGameMove(
            currentRoom.roomCode,
            updatedState,
            currentRoom.currentTurn,
            winnerId,
            allMatched,
            nextHostScore,
            nextGuestScore,
            currentRoom.rules?.turnTimerSeconds || 0,
            currentRoom.rules?.maxSeriesWins || 2
          );
          setIsProcessing(false);
          isProcessingRef.current = false;
        }
      } else {
        // Mismatch: show both cards flipped, then flip back after 800ms and pass turn
        const mismatchedState: MemoryGameState = {
          ...currentState,
          cards: newCards,
          flippedCardIds: newFlipped,
        };
        stateRef.current = mismatchedState;

        if (currentRoom.mode === "local" || currentRoom.mode === "ai") {
          onLocalMove?.({ ...currentRoom, gameState: mismatchedState });
        } else {
          await sendGameMove(
            currentRoom.roomCode,
            mismatchedState,
            currentRoom.currentTurn,
            null,
            false,
            undefined,
            undefined,
            currentRoom.rules?.turnTimerSeconds || 0,
            currentRoom.rules?.maxSeriesWins || 2
          );
        }

        const mismatchTimer = setTimeout(async () => {
          const resetCards = newCards.map((c) =>
            c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
          );
          const nextTurnId =
            currentRoom.currentTurn === currentRoom.players.host.id
              ? currentRoom.players.guest?.id || (currentRoom.mode === "ai" ? "ai_opponent" : "local_player_2")
              : currentRoom.players.host.id;

          const updatedState: MemoryGameState = {
            ...currentState,
            cards: resetCards,
            flippedCardIds: [],
          };
          stateRef.current = updatedState;

          const updatedRoom = {
            ...currentRoom,
            gameState: updatedState,
            currentTurn: nextTurnId,
          };
          roomRef.current = updatedRoom;

          if (currentRoom.mode === "local" || currentRoom.mode === "ai") {
            onLocalMove?.(updatedRoom);
            setIsProcessing(false);
            isProcessingRef.current = false;
          } else {
            await sendGameMove(
              currentRoom.roomCode,
              updatedState,
              nextTurnId,
              null,
              false,
              undefined,
              undefined,
              currentRoom.rules?.turnTimerSeconds || 0,
              currentRoom.rules?.maxSeriesWins || 2
            );
            setIsProcessing(false);
            isProcessingRef.current = false;
          }
        }, 800);
        aiTimersRef.current.push(mismatchTimer);
      }
    }
  };

  // AI Turn Execution in AI Mode
  useEffect(() => {
    if (
      room.mode !== "ai" ||
      room.currentTurn !== "ai_opponent" ||
      isProcessing ||
      room.status !== "playing"
    ) {
      return;
    }

    const available = state.cards.filter((c) => !c.isMatched && !c.isFlipped);
    if (available.length === 0) return;

    clearAiTimers();

    const timer = setTimeout(() => {
      const difficulty = room.rules?.aiDifficulty || "medium";
      let firstPick: number | null = null;
      let secondPick: number | null = null;

      if (difficulty !== "easy") {
        const memoryEntries = Array.from(aiMemoryRef.current.entries()).filter(([id]) => {
          const c = stateRef.current.cards.find((card) => card.id === id);
          return c && !c.isMatched;
        });

        const emojiMap: Record<string, number[]> = {};
        for (const [id, emoji] of memoryEntries) {
          if (!emojiMap[emoji]) emojiMap[emoji] = [];
          emojiMap[emoji].push(id);
          if (emojiMap[emoji].length === 2) {
            [firstPick, secondPick] = emojiMap[emoji];
            break;
          }
        }
      }

      if (firstPick === null) {
        const currentAvail = stateRef.current.cards.filter((c) => !c.isMatched && !c.isFlipped);
        if (currentAvail.length === 0) return;
        const rand = Math.floor(Math.random() * currentAvail.length);
        firstPick = currentAvail[rand].id;
      }

      handleCardClick(firstPick);

      const secondTimer = setTimeout(() => {
        if (secondPick === null) {
          const firstCard = stateRef.current.cards.find((c) => c.id === firstPick);
          if (firstCard && difficulty === "hard") {
            const matchInMem = Array.from(aiMemoryRef.current.entries()).find(
              ([id, emoji]) =>
                emoji === firstCard.emoji &&
                id !== firstPick &&
                !stateRef.current.cards.find((c) => c.id === id)?.isMatched
            );
            if (matchInMem) {
              secondPick = matchInMem[0];
            }
          }
        }

        if (secondPick === null) {
          const remaining = stateRef.current.cards.filter(
            (c) => !c.isMatched && !c.isFlipped && c.id !== firstPick
          );
          if (remaining.length > 0) {
            secondPick = remaining[Math.floor(Math.random() * remaining.length)].id;
          }
        }

        if (secondPick !== null) {
          handleCardClick(secondPick);
        }
      }, 650);
      aiTimersRef.current.push(secondTimer);
    }, 700);

    aiTimersRef.current.push(timer);

    return () => clearAiTimers();
  }, [room.mode, room.currentTurn, isProcessing, room.status, state.cards]);

  // Grid responsive styling based on gridSize
  const gridSize = state.gridSize || 4;
  const getCardTextSize = () => {
    if (gridSize <= 4) return "text-2xl xs:text-3xl sm:text-4xl";
    if (gridSize <= 5) return "text-xl xs:text-2xl sm:text-3xl";
    if (gridSize <= 6) return "text-lg xs:text-xl sm:text-2xl";
    if (gridSize <= 7) return "text-base xs:text-lg sm:text-xl";
    if (gridSize <= 8) return "text-sm xs:text-base sm:text-lg";
    return "text-xs xs:text-sm sm:text-base";
  };
  const getGapSize = () => {
    if (gridSize <= 4) return "gap-1.5 xs:gap-2 sm:gap-3";
    if (gridSize <= 5) return "gap-1.5 xs:gap-2 sm:gap-2.5";
    if (gridSize <= 6) return "gap-1 xs:gap-1.5 sm:gap-2";
    if (gridSize <= 7) return "gap-1 xs:gap-1 sm:gap-1.5";
    return "gap-0.5 xs:gap-1 sm:gap-1";
  };
  const getMaxWidth = () => {
    if (gridSize <= 4) return "max-w-[340px] xs:max-w-sm sm:max-w-md";
    if (gridSize <= 5) return "max-w-[380px] xs:max-w-md sm:max-w-lg";
    if (gridSize <= 6) return "max-w-[420px] xs:max-w-lg sm:max-w-xl";
    if (gridSize <= 7) return "max-w-[460px] xs:max-w-xl sm:max-w-2xl";
    if (gridSize <= 8) return "max-w-[500px] xs:max-w-xl sm:max-w-2xl";
    return "max-w-[540px] xs:max-w-2xl sm:max-w-3xl";
  };
  const getQuestionMarkSize = () => {
    if (gridSize <= 5) return "text-base sm:text-lg";
    if (gridSize <= 7) return "text-sm sm:text-base";
    return "text-xs sm:text-sm";
  };
  const getCardRounding = () => {
    if (gridSize <= 5) return "rounded-xl sm:rounded-2xl";
    if (gridSize <= 7) return "rounded-lg sm:rounded-xl";
    return "rounded-md sm:rounded-lg";
  };

  return (
    <div className={`flex flex-col items-center justify-center p-2 sm:p-4 select-none w-full ${getMaxWidth()} mx-auto touch-manipulation`}>
      {/* Pairs Scored Tracker */}
      <div className="flex items-center justify-between w-full text-[11px] sm:text-xs font-bold mb-2.5 sm:mb-3 gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-card border border-border shadow-sm truncate min-w-0">
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-violet-500 shrink-0" />
          <span className="truncate">
            {hostPlayer.name} {isHost && room.mode !== "local" ? "(You)" : ""}: {state.hostPairs}
          </span>
        </div>

        {/* Center Badges: Grid Size + Secret Owner X-Ray Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-black text-primary">
            {gridSize}×{gridSize}
          </div>
          {isHost && isCheatActive && (
            <button
              type="button"
              onClick={() => {
                setIsCheatActive(false);
                toast.info("👁️ Owner X-Ray Deactivated");
              }}
              title="Owner X-Ray Vision Active (Click to disable)"
              className="px-2 py-0.5 rounded-lg bg-violet-500/20 border border-violet-500/40 text-[10px] font-mono font-bold text-violet-300 flex items-center gap-1 hover:bg-violet-500/30 transition-all cursor-pointer shadow-sm animate-pulse"
            >
              <Eye className="w-3 h-3 text-violet-400" />
              <span>X-RAY</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-card border border-border shadow-sm truncate min-w-0">
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-cyan-500 shrink-0" />
          <span className="truncate">
            {guestDisplayName}{" "}
            {!isHost && room.mode !== "local" && room.mode !== "ai" ? "(You)" : ""}:{" "}
            {state.guestPairs}
          </span>
        </div>
      </div>

      {/* Dynamic NxN Grid */}
      <div
        className={`${getGapSize()} p-2 sm:p-3 rounded-2xl sm:rounded-3xl bg-card border-2 border-border shadow-2xl w-full`}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          aspectRatio: "1 / 1",
        }}
      >
        {state.cards.map((card, index) => {
          const isRevealed = card.isFlipped || card.isMatched;
          const isWildcard = card.emoji === "⭐" && card.isMatched && !card.matchedBy;
          const isMatchedByMe = card.isMatched && card.matchedBy === myPlayerId;
          const canClick =
            !isRevealed &&
            !isProcessing &&
            (room.mode === "local" || isMyTurn || room.currentTurn === "ai_opponent");

          const isCheatVisible = isCheatActive && !isRevealed;

          return (
            <motion.button
              key={card.id}
              whileHover={{ scale: isRevealed || !canClick ? 1 : 1.05 }}
              whileTap={{ scale: isRevealed || !canClick ? 1 : 0.95 }}
              onClick={(e) => {
                if (index === 0) {
                  handleFirstBoxClick(e);
                }
                if (canClick) {
                  handleCardClick(card.id);
                }
              }}
              aria-disabled={!canClick}
              className={`aspect-square ${getCardRounding()} flex items-center justify-center ${getCardTextSize()} transition-all duration-300 border ${
                isWildcard
                  ? "bg-amber-500/15 border border-amber-500/40 opacity-60"
                  : card.isMatched
                  ? isMatchedByMe
                    ? "bg-violet-500/20 border-2 border-violet-500/60 shadow-md shadow-violet-500/20 opacity-80"
                    : "bg-cyan-500/20 border-2 border-cyan-500/60 shadow-md shadow-cyan-500/20 opacity-80"
                  : card.isFlipped
                  ? "bg-primary/20 border-2 border-primary shadow-lg shadow-primary/30"
                  : isCheatVisible
                  ? "bg-violet-950/25 border-violet-500/40 hover:bg-violet-900/35 cursor-pointer shadow-inner"
                  : canClick
                  ? "bg-muted/40 hover:bg-primary/10 border-border cursor-pointer"
                  : "bg-muted/40 border-border cursor-default opacity-85"
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
              ) : isCheatVisible ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center w-full h-full select-none"
                >
                  {/* Half Opacity Emoji for Owner */}
                  <span className="opacity-50 drop-shadow-sm filter contrast-125">
                    {card.emoji}
                  </span>
                </motion.div>
              ) : (
                <span className={`text-muted-foreground/40 font-bold ${getQuestionMarkSize()}`}>?</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Owner Passcode Secret Modal */}
      <Dialog open={isPasscodeModalOpen} onOpenChange={setIsPasscodeModalOpen}>
        <DialogContent
          hideCloseButton
          className="max-w-[90vw] sm:max-w-xs p-5 sm:p-6 rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/60 shadow-2xl text-center"
        >
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-3 shadow-inner">
              <KeyRound className="w-6 h-6 animate-pulse" />
            </div>

            <DialogTitle className="text-lg font-black tracking-tight text-foreground">
              Owner Authorization
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1 mb-4">
              Enter secret authorization passcode to enable card X-Ray vision.
            </DialogDescription>

            <form onSubmit={handlePasscodeSubmit} className="w-full space-y-3">
              <div className="relative">
                <Input
                  autoFocus
                  type={showPassword ? "text" : "password"}
                  value={passcodeInput}
                  onChange={(e) => {
                    setPasscodeInput(e.target.value);
                    if (passcodeError) setPasscodeError("");
                  }}
                  placeholder="Enter passcode..."
                  className="text-center font-mono text-sm tracking-wider h-11 rounded-xl bg-background/60 border-border focus:border-violet-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {passcodeError && (
                <p className="text-xs text-destructive font-semibold">
                  {passcodeError}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsPasscodeModalOpen(false);
                    setPasscodeInput("");
                    setPasscodeError("");
                  }}
                  className="flex-1 rounded-xl h-10 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-xl h-10 text-xs font-black bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25"
                >
                  Unlock
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
