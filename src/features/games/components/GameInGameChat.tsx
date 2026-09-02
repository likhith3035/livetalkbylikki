import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameChatMessage } from "../types";
import { sendGameChatMessage, subscribeToGameChat } from "../services/gameRoomService";
import { gameAudio } from "../services/gameSoundService";
import { GameAvatar } from "./GameAvatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, X, Send, Eye, Sparkles } from "lucide-react";

interface GameInGameChatProps {
  roomCode: string;
  myPlayerId: string;
  myPlayerName: string;
  myPlayerAvatar: string;
  isSpectator?: boolean;
}

const QUICK_CHATS = [
  "Good Game! 🤝",
  "Rematch! 🔥",
  "Nice move! 🧠",
  "So close! 😱",
  "My turn! ⚡",
  "Haha 😂",
  "Let's go! 🚀",
];

export const GameInGameChat: React.FC<GameInGameChatProps> = ({
  roomCode,
  myPlayerId,
  myPlayerName,
  myPlayerAvatar,
  isSpectator = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<GameChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!roomCode) return;

    const unsub = subscribeToGameChat(roomCode, (newMsgs) => {
      setMessages(newMsgs);
      if (!isOpenRef.current && newMsgs.length > 0) {
        const lastMsg = newMsgs[newMsgs.length - 1];
        if (lastMsg && lastMsg.senderId !== myPlayerId) {
          setUnreadCount((prev) => prev + 1);
          gameAudio.playClick();
        }
      }
    });

    return () => unsub();
  }, [roomCode, myPlayerId]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    gameAudio.playClick();
    setInputText("");

    await sendGameChatMessage(roomCode, {
      senderId: myPlayerId,
      senderName: myPlayerName,
      senderAvatar: myPlayerAvatar,
      text,
      isSpectator,
    });
  };

  return (
    <div className="fixed bottom-20 left-4 z-40 select-none">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-card/90 backdrop-blur-xl border border-border shadow-xl hover:bg-muted text-foreground text-xs font-bold transition-all relative cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-primary" />
          <span>Match Chat</span>
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center animate-bounce shadow-md shadow-primary/30">
              {unreadCount}
            </span>
          )}
        </motion.button>
      )}

      {/* Floating Chat Drawer Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="w-80 sm:w-96 rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/70 shadow-2xl overflow-hidden flex flex-col h-96 sm:h-[420px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-foreground">In-Game Chat</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Room #{roomCode}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2.5 text-xs">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                  <Sparkles className="w-6 h-6 text-primary/40 mb-2" />
                  <span className="text-xs font-semibold">No messages yet</span>
                  <span className="text-[10px]">Send a quick taunt or chat with your opponent!</span>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderId === myPlayerId;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1 mb-0.5 px-1">
                        <div className="w-3.5 h-3.5 rounded-full overflow-hidden flex items-center justify-center text-[10px]">
                          <GameAvatar avatar={m.senderAvatar} fallback="👤" className="text-[10px]" />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[120px]">
                          {m.senderName} {isMe && "(You)"}
                        </span>
                        {m.isSpectator && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 font-bold flex items-center gap-0.5">
                            <Eye className="w-2.5 h-2.5" /> Spec
                          </span>
                        )}
                      </div>

                      <div
                        className={`px-3 py-2 rounded-2xl max-w-[85%] break-words leading-relaxed shadow-sm ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-xs"
                            : "bg-muted/80 text-foreground border border-border/50 rounded-bl-xs"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Chat Chips */}
            <div className="px-3 py-1.5 border-t border-border/40 bg-muted/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_CHATS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  className="px-2.5 py-1 rounded-full bg-muted hover:bg-primary/20 hover:text-primary text-[11px] font-medium shrink-0 border border-border/50 transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputText);
              }}
              className="p-2.5 border-t border-border/50 flex items-center gap-2 bg-card/60"
            >
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                maxLength={100}
                className="h-9 rounded-xl bg-muted/60 border-border text-xs focus-visible:ring-primary/40"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputText.trim()}
                className="h-9 w-9 rounded-xl bg-primary text-primary-foreground shrink-0 shadow-md shadow-primary/20"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
