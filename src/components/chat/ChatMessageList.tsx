import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ArrowRight } from "lucide-react";
import TypingIndicator from "@/components/TypingIndicator";
import MessageReactions from "@/components/MessageReactions";
import ChatImage from "@/components/chat/ChatImage";
import FormattedText from "@/components/chat/FormattedText";
import SwipeableMessage from "@/components/chat/SwipeableMessage";
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

const TIPS = [
  "💡 Use **bold** and *italic* in messages",
  "👆 Swipe a message right to ❤️ react",
  "😀 Tap the smiley to open the emoji picker",
  "🎤 Hold the mic button to send voice messages",
];

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
          className="text-center space-y-4 max-w-xs"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <MessageSquare className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">No messages yet</h3>
            <p className="text-sm text-muted-foreground">
              Hit <strong>Start</strong> above to get matched with a random stranger
            </p>
          </div>
          <div className="space-y-1.5 pt-2">
            {TIPS.map((tip, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="text-[11px] text-muted-foreground/70 flex items-center gap-1.5"
              >
                <ArrowRight className="h-2.5 w-2.5 shrink-0 text-primary/50" />
                <FormattedText text={tip} />
              </motion.p>
            ))}
          </div>
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
            <SwipeableMessage
              isMine={msg.sender === "you"}
              disabled={msg.sender === "system"}
              onSwipeRight={msg.sender === "stranger" ? () => onReact(msg.id, "❤️") : undefined}
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
                {msg.text && <FormattedText text={msg.text} />}

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
            </SwipeableMessage>

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
