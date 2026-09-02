import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameReaction } from "../types";
import { sendGameReaction, subscribeToGameReactions } from "../services/gameRoomService";
import { gameAudio } from "../services/gameSoundService";
import { MessageSquare, Sparkles, X, EyeOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameLiveReactionsProps {
  roomCode: string;
  myPlayerId: string;
  myPlayerName: string;
  isSpectator?: boolean;
}

const EMOJI_PRESETS = ["🔥", "👏", "🎉", "💀", "😱", "🎯", "⚡", "🚀"];

const TAUNT_PRESETS = [
  "Nice move! 🎯",
  "Calculated. 😎",
  "Good luck! 🍀",
  "Oops! 😅",
  "Rematch? ⚔️",
  "Too easy! 🚀",
  "Well played! 🤝",
  "Thinking... 🤔",
  "GG! 🏆",
];

export const GameLiveReactions: React.FC<GameLiveReactionsProps> = ({
  roomCode,
  myPlayerId,
  myPlayerName,
  isSpectator = false,
}) => {
  const [activeReactions, setActiveReactions] = useState<(GameReaction & { xOffset: number })[]>([]);
  const [isTauntsOpen, setIsTauntsOpen] = useState(false);
  const [isReactionsMuted, setIsReactionsMuted] = useState(false);

  useEffect(() => {
    if (isReactionsMuted) return;

    const unsub = subscribeToGameReactions(roomCode, (reaction) => {
      gameAudio.playClick();
      const xOffset = (Math.random() - 0.5) * 40;
      setActiveReactions((prev) => [...prev.slice(-3), { ...reaction, xOffset }]);

      setTimeout(() => {
        setActiveReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 1400);
    });

    return () => unsub();
  }, [roomCode, isReactionsMuted]);

  const handleSendEmoji = async (emoji: string) => {
    gameAudio.playClick();
    const localId = `local_${Date.now()}`;
    const xOffset = (Math.random() - 0.5) * 40;
    setActiveReactions((prev) => [
      ...prev.slice(-3),
      {
        id: localId,
        senderId: myPlayerId,
        senderName: myPlayerName,
        type: "emoji",
        content: emoji,
        timestamp: Date.now(),
        isSpectator,
        xOffset,
      },
    ]);

    setTimeout(() => {
      setActiveReactions((prev) => prev.filter((r) => r.id !== localId));
    }, 1400);

    await sendGameReaction(roomCode, {
      id: `rx_${Date.now()}`,
      senderId: myPlayerId,
      senderName: myPlayerName,
      type: "emoji",
      content: emoji,
      timestamp: Date.now(),
      isSpectator,
    });
  };

  const handleSendTaunt = async (taunt: string) => {
    gameAudio.playClick();
    setIsTauntsOpen(false);

    const localId = `local_${Date.now()}`;
    const xOffset = (Math.random() - 0.5) * 30;
    setActiveReactions((prev) => [
      ...prev.slice(-3),
      {
        id: localId,
        senderId: myPlayerId,
        senderName: myPlayerName,
        type: "taunt",
        content: taunt,
        timestamp: Date.now(),
        isSpectator,
        xOffset,
      },
    ]);

    setTimeout(() => {
      setActiveReactions((prev) => prev.filter((r) => r.id !== localId));
    }, 1800);

    await sendGameReaction(roomCode, {
      id: `rx_${Date.now()}`,
      senderId: myPlayerId,
      senderName: myPlayerName,
      type: "taunt",
      content: taunt,
      timestamp: Date.now(),
      isSpectator,
    });
  };

  return (
    <>
      {/* Floating Animated Reaction Sprites Overlay */}
      <div className="fixed inset-0 pointer-events-none z-30 flex items-center justify-center overflow-hidden">
        <AnimatePresence>
          {!isReactionsMuted &&
            activeReactions.map((reaction) => {
              const isMe = reaction.senderId === myPlayerId;
              return (
                <motion.div
                  key={reaction.id}
                  initial={{ opacity: 0, y: 40, scale: 0.5, x: reaction.xOffset }}
                  animate={{ opacity: [0, 1, 1, 0], y: -160, scale: [0.5, 1.25, 1.1, 0.9], x: reaction.xOffset * 1.5 }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                  className="absolute flex flex-col items-center select-none"
                >
                  {reaction.type === "emoji" ? (
                    <span className="text-3xl sm:text-4xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                      {reaction.content}
                    </span>
                  ) : (
                    <div
                      className={`px-3 py-1 rounded-xl text-xs font-bold shadow-lg border backdrop-blur-xl max-w-[200px] truncate ${
                        isMe
                          ? "bg-primary text-primary-foreground border-primary/50"
                          : "bg-card text-foreground border-border"
                      }`}
                    >
                      <span className="text-[9px] opacity-75 mr-1 font-normal">
                        {reaction.senderName}:
                      </span>
                      {reaction.content}
                    </div>
                  )}
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>

      {/* Sleek Reactions Bar at bottom of screen */}
      <div className="w-full max-w-xl flex flex-col items-center gap-1.5 mt-2 px-1.5 select-none touch-manipulation">
        <div className="flex items-center justify-between w-full px-2 py-1 rounded-2xl bg-card/95 border border-border shadow-sm gap-1">
          {/* Quick Emojis row */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 px-0.5 no-scrollbar touch-pan-x min-w-0 flex-1">
            {EMOJI_PRESETS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSendEmoji(emoji)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-muted flex items-center justify-center text-sm sm:text-base hover:scale-115 active:scale-95 transition-all cursor-pointer shrink-0"
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Quick Controls: Taunts & Mute Toggle */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTauntsOpen((prev) => !prev)}
              className="h-7 sm:h-8 rounded-lg text-[11px] sm:text-xs font-semibold gap-1 px-2 text-muted-foreground hover:text-foreground border border-border/40 hover:bg-muted cursor-pointer"
            >
              <MessageSquare className="w-3 h-3 text-primary" />
              <span>Taunts</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsReactionsMuted((prev) => !prev);
                setActiveReactions([]);
              }}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              title={isReactionsMuted ? "Show floating reactions" : "Hide floating reactions"}
            >
              {isReactionsMuted ? <EyeOff className="w-3.5 h-3.5 text-rose-400" /> : <Eye className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {/* Taunts Menu Popover */}
        <AnimatePresence>
          {isTauntsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              className="w-full p-2.5 rounded-2xl bg-card border border-border shadow-xl z-40 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  Quick Chat Taunts
                </span>
                <button
                  onClick={() => setIsTauntsOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-xs p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 xs:grid-cols-3 gap-1">
                {TAUNT_PRESETS.map((taunt) => (
                  <button
                    key={taunt}
                    onClick={() => handleSendTaunt(taunt)}
                    className="p-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-primary/20 hover:text-primary border border-border transition-all text-center truncate cursor-pointer active:scale-95"
                  >
                    {taunt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
