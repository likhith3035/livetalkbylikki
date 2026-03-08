import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TypingIndicator from "@/components/TypingIndicator";
import MessageReactions from "@/components/MessageReactions";
import ChatImage from "@/components/chat/ChatImage";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Message } from "@/hooks/use-chat";

interface ChatMessageListProps {
  messages: Message[];
  strangerTyping: boolean;
  onReact: (messageId: string, emoji: string) => void;
}

const messageVariants = {
  hidden: (sender: string) => ({
    opacity: 0,
    x: sender === "you" ? 20 : sender === "stranger" ? -20 : 0,
    y: sender === "system" ? -8 : 0,
    scale: 0.95,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 400, damping: 30 },
  },
};

const ChatMessageList = ({ messages, strangerTyping, onReact }: ChatMessageListProps) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, strangerTyping]);

  if (messages.length === 0 && !strangerTyping) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="text-center space-y-3"
        >
          <div className="text-5xl">💬</div>
          <p className="text-sm text-muted-foreground">Start a chat to begin talking with strangers</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 pb-36 sm:pb-40 space-y-1.5">
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            custom={msg.sender}
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            layout
            className={cn(
              "flex flex-col",
              msg.sender === "you" && "items-end",
              msg.sender === "system" && "items-center"
            )}
          >
            {/* Bubble */}
            <div
              className={cn(
                "relative max-w-[82%] sm:max-w-[70%] px-3.5 py-2.5 text-sm",
                msg.sender === "you" &&
                  "bg-[hsl(var(--bubble-you))] text-[hsl(var(--bubble-you-foreground))] rounded-2xl rounded-br-sm bubble-tail-right shadow-md",
                msg.sender === "stranger" &&
                  "bg-[hsl(var(--bubble-stranger))] text-[hsl(var(--bubble-stranger-foreground))] rounded-2xl rounded-bl-sm bubble-tail-left shadow-sm",
                msg.sender === "system" &&
                  "max-w-fit bg-transparent text-muted-foreground text-[11px] text-center italic px-3 py-1"
              )}
            >
              {msg.sender !== "system" && (
                <p className="text-[10px] font-semibold opacity-60 mb-0.5 tracking-wide uppercase">
                  {msg.sender === "you" ? "You" : "Stranger"}
                </p>
              )}
              {msg.imageUrl && (
                <ChatImage src={msg.imageUrl} isMine={msg.sender === "you"} />
              )}
              {msg.text && <span className="break-words leading-relaxed">{msg.text}</span>}

              {/* Timestamp */}
              {msg.sender !== "system" && (
                <p className={cn(
                  "text-[9px] mt-1 opacity-40 tabular-nums",
                  msg.sender === "you" ? "text-right" : "text-left"
                )}>
                  {format(msg.timestamp, "h:mm a")}
                </p>
              )}
            </div>

            {msg.sender !== "system" && (
              <MessageReactions
                messageId={msg.id}
                reactions={msg.reactions}
                onReact={onReact}
                isMine={msg.sender === "you"}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {strangerTyping && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <TypingIndicator />
        </motion.div>
      )}
      <div ref={endRef} />
    </div>
  );
};

export default ChatMessageList;
