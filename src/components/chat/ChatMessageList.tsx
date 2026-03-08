import { useRef, useEffect, useState, useCallback } from "react";
import { CheckCheck, Pin, Trash2, Reply as ReplyIcon, Timer, Forward, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ArrowRight } from "lucide-react";
import TypingIndicator from "@/components/TypingIndicator";
import MessageReactions from "@/components/MessageReactions";
import ChatImage from "@/components/chat/ChatImage";
import FormattedText from "@/components/chat/FormattedText";
import SwipeableMessage from "@/components/chat/SwipeableMessage";
import LinkPreview from "@/components/chat/LinkPreview";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Message } from "@/hooks/use-chat";

interface ChatMessageListProps {
  messages: Message[];
  strangerTyping: boolean;
  strangerTypingText?: string;
  onReact: (messageId: string, emoji: string) => void;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onForward?: (message: Message) => void;
  disappearTimer?: number | null;
  highlightMessageId?: string | null;
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
  "👆 Swipe right to ❤️ react, left to reply",
  "📌 Long-press to react, copy & more",
  "🎮 Play games with your stranger!",
  "⏱️ Enable disappearing messages for privacy",
];

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👍"];

const ChatMessageList = ({ messages, strangerTyping, strangerTypingText, onReact, onReply, onDelete, onPin, onForward, disappearTimer, highlightMessageId }: ChatMessageListProps) => {
  const endRef = useRef<HTMLDivElement>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, strangerTyping]);

  useEffect(() => {
    if (highlightMessageId) {
      const el = document.getElementById(`msg-${highlightMessageId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-primary/60");
        setTimeout(() => el.classList.remove("ring-2", "ring-primary/60"), 2000);
      }
    }
  }, [highlightMessageId]);

  // Close menu on outside tap
  useEffect(() => {
    if (!activeMenuId) return;
    const handler = (e: TouchEvent | MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-msg-menu]")) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("touchstart", handler, { passive: true });
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("mousedown", handler);
    };
  }, [activeMenuId]);

  const handleTouchStart = useCallback((msgId: string) => {
    longPressTimer.current = setTimeout(() => {
      setActiveMenuId((prev) => (prev === msgId ? null : msgId));
    }, 400);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const closeMenu = useCallback(() => {
    setActiveMenuId(null);
  }, []);

  const scrollToMessage = useCallback((msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary/40");
      setTimeout(() => el.classList.remove("ring-2", "ring-primary/40"), 1500);
    }
  }, []);

  const pinnedMessages = messages.filter((m) => m.pinned && !m.deleted);

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
    <div className="flex-1 overflow-y-auto px-2 sm:px-5 lg:px-8 py-4 pb-40 lg:pb-24 space-y-1.5 mx-auto w-full max-w-3xl">
      {/* Pinned messages bar */}
      <AnimatePresence>
        {pinnedMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="sticky top-0 z-10 mb-2"
          >
            <div className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 space-y-1">
              <p className="text-[10px] font-semibold text-primary flex items-center gap-1">
                <Pin className="h-3 w-3" /> Pinned Messages ({pinnedMessages.length})
              </p>
              {pinnedMessages.slice(-3).map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => scrollToMessage(pm.id)}
                  className="w-full text-left text-[11px] text-muted-foreground truncate hover:text-foreground transition-colors"
                >
                  <span className="font-medium text-foreground">{pm.sender === "you" ? "You" : "Stranger"}:</span> {pm.text}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {disappearTimer && (
        <div className="flex items-center justify-center gap-1.5 py-1">
          <Timer className="h-3 w-3 text-primary" />
          <span className="text-[10px] text-primary font-medium">
            Disappearing messages: {disappearTimer}s
          </span>
        </div>
      )}

      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            id={`msg-${msg.id}`}
            custom={msg.sender}
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            layout
            className={cn(
              "flex flex-col transition-all duration-300 relative",
              msg.sender === "you" && "items-end",
              msg.sender === "system" && "items-center"
            )}
          >
            <SwipeableMessage
              isMine={msg.sender === "you"}
              disabled={msg.sender === "system" || msg.deleted}
              onSwipeRight={msg.sender === "stranger" ? () => onReact(msg.id, "❤️") : undefined}
              onSwipeLeft={msg.sender !== "system" && !msg.deleted ? () => onReply?.(msg) : undefined}
            >
              {/* Instagram-style popup menu above bubble */}
              <AnimatePresence>
                {activeMenuId === msg.id && msg.sender !== "system" && !msg.deleted && (
                  <motion.div
                    data-msg-menu
                    initial={{ opacity: 0, scale: 0.85, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: 8 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={cn(
                      "absolute bottom-full mb-2 z-30 flex flex-col items-center gap-1.5",
                      msg.sender === "you" ? "right-0" : "left-0"
                    )}
                  >
                    {/* Emoji reaction row */}
                    <div className="flex gap-0.5 rounded-full bg-card border border-border px-2 py-1.5 shadow-xl backdrop-blur-sm">
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => { onReact(msg.id, emoji); closeMenu(); }}
                          className="text-xl hover:scale-125 active:scale-90 transition-transform px-1 py-0.5"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    {/* Action buttons */}
                    <div className="flex gap-0.5 rounded-xl bg-card border border-border shadow-xl p-1 backdrop-blur-sm">
                      <button
                        onClick={() => { navigator.clipboard.writeText(msg.text || ""); closeMenu(); }}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] text-foreground hover:bg-secondary transition-colors"
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                      <button
                        onClick={() => { onReply?.(msg); closeMenu(); }}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] text-foreground hover:bg-secondary transition-colors"
                      >
                        <ReplyIcon className="h-3 w-3" /> Reply
                      </button>
                      <button
                        onClick={() => { onPin?.(msg.id); closeMenu(); }}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] text-foreground hover:bg-secondary transition-colors"
                      >
                        <Pin className="h-3 w-3" /> {msg.pinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        onClick={() => { onForward?.(msg); closeMenu(); }}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] text-foreground hover:bg-secondary transition-colors"
                      >
                        <Forward className="h-3 w-3" /> Forward
                      </button>
                      {msg.sender === "you" && (
                        <button
                          onClick={() => { onDelete?.(msg.id); closeMenu(); }}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bubble */}
              <div
                onTouchStart={msg.sender !== "system" ? () => handleTouchStart(msg.id) : undefined}
                onTouchEnd={msg.sender !== "system" ? handleTouchEnd : undefined}
                onTouchCancel={msg.sender !== "system" ? handleTouchEnd : undefined}
                onContextMenu={(e) => { if (msg.sender !== "system") { e.preventDefault(); setActiveMenuId(msg.id); } }}
                className={cn(
                  "relative max-w-[78%] sm:max-w-[70%] px-3 sm:px-3.5 py-2 text-sm leading-relaxed break-words select-none",
                  msg.sender === "you" &&
                    "bg-[hsl(var(--bubble-you))] text-[hsl(var(--bubble-you-foreground))] rounded-2xl rounded-br-md shadow-md min-w-[60px]",
                  msg.sender === "stranger" &&
                    "bg-[hsl(var(--bubble-stranger))] text-[hsl(var(--bubble-stranger-foreground))] rounded-2xl rounded-bl-md shadow-sm min-w-[60px]",
                  msg.sender === "system" &&
                    "max-w-fit bg-transparent text-muted-foreground text-[11px] text-center italic px-3 py-1",
                  msg.deleted && "opacity-60 italic",
                  msg.pinned && !msg.deleted && "ring-1 ring-primary/30",
                  activeMenuId === msg.id && "ring-2 ring-primary/40"
                )}
              >
                {msg.pinned && !msg.deleted && msg.sender !== "system" && (
                  <Pin className="absolute -top-1.5 -right-1.5 h-3 w-3 text-primary" />
                )}

                {msg.sender !== "system" && (
                  <p className="text-[10px] font-semibold opacity-60 mb-0.5 tracking-wide uppercase flex items-center gap-1">
                    {msg.senderAvatar && <span className="text-xs">{msg.senderAvatar}</span>}
                    {msg.sender === "you"
                      ? (msg.senderNickname?.trim() || "You")
                      : (msg.senderNickname?.trim() || "Stranger")}
                  </p>
                )}

                {msg.replyTo && !msg.deleted && (
                  <button
                    onClick={() => scrollToMessage(msg.replyTo!.id)}
                    className={cn(
                      "w-full text-left mb-1.5 rounded-lg px-2.5 py-1.5 border-l-2 border-primary/50 flex items-start gap-1.5",
                      msg.sender === "you" ? "bg-black/10" : "bg-white/10"
                    )}
                  >
                    <ReplyIcon className="h-3 w-3 mt-0.5 shrink-0 opacity-50" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold opacity-70">
                        {msg.replyTo.sender === "you" ? "You" : "Stranger"}
                      </p>
                      <p className="text-[11px] opacity-70 truncate">{msg.replyTo.text || "📷 Image"}</p>
                    </div>
                  </button>
                )}

                {!msg.deleted && msg.imageUrl && /\.(webm|m4a|ogg|mp3|wav)$/i.test(msg.imageUrl) ? (
                  <audio controls src={msg.imageUrl} className="max-w-[220px] my-1 h-10 rounded-lg" />
                ) : !msg.deleted && msg.imageUrl ? (
                  <ChatImage src={msg.imageUrl} isMine={msg.sender === "you"} />
                ) : null}
                {msg.text && <FormattedText text={msg.text} />}
                {msg.text && !msg.deleted && msg.sender !== "system" && <LinkPreview text={msg.text} />}

                {msg.sender !== "system" && (
                  <p className={cn(
                    "text-[9px] mt-1 opacity-40 tabular-nums flex items-center gap-1",
                    msg.sender === "you" ? "justify-end" : "justify-start"
                  )}>
                    {format(msg.timestamp, "h:mm a")}
                    {msg.sender === "you" && !msg.deleted && (
                      <CheckCheck className={cn(
                        "h-3 w-3 tick-appear transition-colors",
                        msg.read ? "text-blue-400 opacity-100" : "opacity-60"
                      )} />
                    )}
                    {msg.disappearAt && !msg.deleted && (
                      <Timer className="h-2.5 w-2.5 opacity-50" />
                    )}
                  </p>
                )}
              </div>
            </SwipeableMessage>

            {/* Reaction badges below bubble */}
            {msg.sender !== "system" && !msg.deleted && (
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
          <TypingIndicator previewText={strangerTypingText} />
        </motion.div>
      )}
      <div ref={endRef} />
    </div>
  );
};

export default ChatMessageList;
