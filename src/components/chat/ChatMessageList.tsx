import { useRef, useEffect, useState, useCallback } from "react";
import { CheckCheck, Pin, Trash2, Reply as ReplyIcon, Timer, Forward, Copy, Globe, X, File as FileIcon } from "lucide-react";
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
  isReplying?: boolean;
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

const SUPPORTED_LANGUAGES = [
  { code: "te", name: "తెలుగు (Telugu)" },
  { code: "hi", name: "हिन्दी (Hindi)" },
  { code: "ta", name: "தமிழ் (Tamil)" },
  { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
  { code: "ml", name: "മലയാളം (Malayalam)" },
  { code: "bn", name: "বাংলা (Bengali)" },
  { code: "mr", name: "मराठी (Marathi)" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "ja", name: "日本語" },
];

const translateText = async (text: string, targetLang: string): Promise<string> => {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data[0]) {
      return data[0].map((x: any) => x[0]).join("");
    }
    return text;
  } catch (err) {
    console.error("Translation error:", err);
    throw err;
  }
};

const ChatMessageList = ({
  messages,
  strangerTyping,
  strangerTypingText,
  onReact,
  onReply,
  onDelete,
  onPin,
  onForward,
  disappearTimer,
  highlightMessageId,
  isReplying
}: ChatMessageListProps) => {
  const endRef = useRef<HTMLDivElement>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showTranslateFor, setShowTranslateFor] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, { text: string; langName: string; loading?: boolean; error?: boolean }>>({});
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTranslate = async (msgId: string, text: string, langCode: string, langName: string) => {
    setTranslations((prev) => ({
      ...prev,
      [msgId]: { text: "", langName, loading: true }
    }));

    try {
      const translated = await translateText(text, langCode);
      setTranslations((prev) => ({
        ...prev,
        [msgId]: { text: translated, langName, loading: false }
      }));
    } catch (e) {
      setTranslations((prev) => ({
        ...prev,
        [msgId]: { text: "Translation failed. Check connection.", langName, error: true, loading: false }
      }));
    }
  };

  const clearTranslation = (msgId: string) => {
    setTranslations((prev) => {
      const next = { ...prev };
      delete next[msgId];
      return next;
    });
  };

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
        setShowTranslateFor(null);
      }
    };
    document.addEventListener("touchstart", handler, { passive: true });
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("mousedown", handler);
    };
  }, [activeMenuId]);

  // Cleanup longPressTimer on unmount to prevent state update on unmounted component
  useEffect(() => {
    return () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };
  }, []);

  const handleTouchStart = useCallback((msgId: string) => {
    longPressTimer.current = setTimeout(() => {
      setActiveMenuId((prev) => (prev === msgId ? null : msgId));
    }, 450);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const closeMenu = useCallback(() => {
    setActiveMenuId(null);
    setShowTranslateFor(null);
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
    <div
      className={cn(
        "flex-1 overflow-y-auto px-2 sm:px-5 lg:px-8 py-4 space-y-3 mx-auto w-full max-w-3xl transition-all duration-300",
        isReplying ? "pb-12" : "pb-6"
      )}
    >
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
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            className={cn(
              "flex flex-col relative w-full",
              msg.sender === "you" && "items-end",
              msg.sender === "stranger" && "items-start",
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
                      "absolute bottom-full mb-2 z-35 flex flex-col items-center gap-1.5",
                      msg.sender === "you" ? "right-0" : "left-12"
                    )}
                  >
                    {/* Reactions Selector */}
                    <div className="flex items-center gap-1 bg-background/95 dark:bg-zinc-900/95 backdrop-blur-md border border-border/80 rounded-full px-2.5 py-1.5 shadow-xl">
                      {["❤️", "👍", "🔥", "😂", "😮", "😢"].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => { onReact(msg.id, emoji); closeMenu(); }}
                          className="hover:scale-125 active:scale-95 transition-all text-base px-0.5"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* Actions Menu */}
                    {msg.sender !== "system" && (
                      <div className="flex items-center gap-1 bg-background/95 dark:bg-zinc-900/95 backdrop-blur-md border border-border/80 rounded-xl p-1 shadow-xl shrink-0">
                        <button
                          onClick={() => { onReply?.(msg); closeMenu(); }}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] text-foreground hover:bg-secondary transition-colors"
                        >
                          <ReplyIcon className="h-3 w-3" /> Reply
                        </button>
                        <button
                          onClick={() => { navigator.clipboard.writeText(msg.text || ""); closeMenu(); }}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] text-foreground hover:bg-secondary transition-colors"
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                        <button
                          onClick={() => { setShowTranslateFor(msg.id); }}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] text-foreground hover:bg-secondary transition-colors"
                        >
                          <Globe className="h-3 w-3" /> Translate
                        </button>
                        <button
                          onClick={() => { onPin?.(msg.id); closeMenu(); }}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] text-foreground hover:bg-secondary transition-colors"
                        >
                          <Pin className="h-3 w-3" /> Pin
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
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message Structure */}
              {msg.sender === "stranger" ? (
                <div className="flex items-end gap-2.5 max-w-[85%] sm:max-w-[75%]">
                  {/* Stranger Avatar on the left */}
                  <div className="shrink-0 mb-1">
                    {msg.senderAvatar ? (
                      msg.senderAvatar.startsWith("data:image/") ? (
                        <img src={msg.senderAvatar} alt="Avatar" className="h-9 w-9 rounded-full object-cover border border-border/50 shadow-sm" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-lg border border-border/50 shadow-sm">
                          {msg.senderAvatar}
                        </div>
                      )
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-xs font-bold border border-border/50 shadow-sm">
                        S
                      </div>
                    )}
                  </div>

                  {/* Stranger Message Bubble */}
                  <div
                    onTouchStart={msg.sender !== "system" ? () => handleTouchStart(msg.id) : undefined}
                    onTouchEnd={msg.sender !== "system" ? handleTouchEnd : undefined}
                    onTouchCancel={msg.sender !== "system" ? handleTouchEnd : undefined}
                    onContextMenu={(e) => { if (msg.sender !== "system") { e.preventDefault(); setActiveMenuId(msg.id); } }}
                    style={{
                      backgroundColor: `hsl(var(--bubble-stranger))`,
                      color: `hsl(var(--bubble-stranger-foreground))`
                    }}
                    className={cn(
                      "relative break-words select-text transition-all duration-500",
                      "border border-border/80 rounded-[1.5rem] rounded-bl-sm shadow-sm min-w-[150px] w-fit max-w-full px-4 py-3 text-sm sm:text-base leading-relaxed hover:brightness-105",
                      msg.replyTo && !msg.deleted && "min-w-[220px] sm:min-w-[260px]",
                      msg.deleted && "opacity-60 italic",
                      msg.pinned && !msg.deleted && "ring-1 ring-primary/30",
                      activeMenuId === msg.id && "ring-2 ring-primary/40 shadow-xl scale-[1.02]"
                    )}
                  >
                    {/* Header: Name and Time */}
                    {msg.sender !== "system" && (
                      <div className="flex items-center justify-between gap-3 mb-1.5 border-b border-black/5 dark:border-white/5 pb-1">
                        <span className="text-xs font-bold flex items-center gap-1.5 truncate opacity-90">
                          {msg.senderNickname?.trim() || "Stranger"}
                          {msg.senderMood && (
                            <span className="text-[8px] font-bold px-1 py-0.25 rounded bg-primary/10 text-primary border border-primary/20 normal-case tracking-normal shrink-0">
                              {msg.senderMood}
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] opacity-75 font-semibold whitespace-nowrap">
                          {msg.pinned && !msg.deleted && (
                            <Pin className="h-2.5 w-2.5 text-primary rotate-45 shrink-0" />
                          )}
                          <span>{format(msg.timestamp, "h:mm a")}</span>
                        </div>
                      </div>
                    )}

                    {/* Replied block */}
                    {msg.replyTo && !msg.deleted && (
                      <button
                        onClick={() => scrollToMessage(msg.replyTo!.id)}
                        className="w-full text-left mb-2 rounded-xl px-3 py-2 border-l-2 border-primary/50 flex items-start gap-2 text-xs bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-inherit"
                      >
                        <ReplyIcon className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-50" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold opacity-75">
                            {msg.replyTo.sender === "you" ? "You" : "Stranger"}
                          </p>
                          <p className="text-[11px] opacity-75 truncate">{msg.replyTo.text || "📷 Attachment"}</p>
                        </div>
                      </button>
                    )}

                    {/* Media content */}
                    {!msg.deleted && msg.imageUrl && /\.(webm|m4a|ogg|mp3|wav)$/i.test(msg.imageUrl) ? (
                      <audio controls src={msg.imageUrl} className="max-w-[220px] my-1 h-10 rounded-lg" />
                    ) : !msg.deleted && msg.imageUrl && /\.(jpe?g|png|gif|webp|svg)$/i.test(msg.imageUrl) ? (
                      <ChatImage src={msg.imageUrl} isMine={false} />
                    ) : !msg.deleted && msg.imageUrl ? (
                      <a 
                        href={msg.imageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-2 p-3 rounded-xl border border-border/85 my-1 text-xs font-bold hover:underline transition-all bg-secondary/60 text-foreground shadow-sm max-w-[240px]"
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <FileIcon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-[11px]">
                            {msg.imageUrl.split("/").pop()?.split(".").shift() || "Attachment"}
                          </p>
                          <p className="text-[9px] opacity-50 uppercase font-black tracking-wider">
                            .{msg.imageUrl.split(".").pop()?.split("?").shift() || "file"}
                          </p>
                        </div>
                      </a>
                    ) : null}

                    {/* Message Text */}
                    {msg.text && <FormattedText text={msg.text} />}
                    {msg.text && !msg.deleted && <LinkPreview text={msg.text} />}

                    {/* Timer/Disappear Indicator */}
                    {msg.disappearAt && !msg.deleted && (
                      <div className="flex justify-start mt-1 opacity-45">
                        <Timer className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              ) : msg.sender === "you" ? (
                /* User (You) bubble: aligned right, no avatar */
                <div
                  onTouchStart={msg.sender !== "system" ? () => handleTouchStart(msg.id) : undefined}
                  onTouchEnd={msg.sender !== "system" ? handleTouchEnd : undefined}
                  onTouchCancel={msg.sender !== "system" ? handleTouchEnd : undefined}
                  onContextMenu={(e) => { if (msg.sender !== "system") { e.preventDefault(); setActiveMenuId(msg.id); } }}
                  style={{
                    backgroundColor: `hsl(var(--bubble-you))`,
                    color: `hsl(var(--bubble-you-foreground))`
                  }}
                  className={cn(
                    "relative break-words select-text transition-all duration-500",
                    "border border-white/5 rounded-[1.5rem] rounded-br-sm shadow-md min-w-[150px] w-fit max-w-[85%] sm:max-w-[75%] px-4 py-3 text-sm sm:text-base leading-relaxed hover:brightness-110",
                    msg.replyTo && !msg.deleted && "min-w-[220px] sm:min-w-[260px]",
                    msg.deleted && "opacity-60 italic",
                    msg.pinned && !msg.deleted && "ring-1 ring-primary/30",
                    activeMenuId === msg.id && "ring-2 ring-primary/40 shadow-xl scale-[1.02]"
                  )}
                >
                  {/* Header: You and Time/Ticks */}
                  {msg.sender !== "system" && (
                    <div className="flex items-center justify-between gap-3 mb-1.5 border-b border-white/10 pb-1">
                      <span className="text-xs font-bold flex items-center gap-1.5 truncate opacity-90">
                        {msg.senderNickname?.trim() || "You"}
                        {msg.senderMood && (
                          <span className="text-[8px] font-bold px-1 py-0.25 rounded bg-primary/10 text-primary border border-primary/20 normal-case tracking-normal shrink-0">
                            {msg.senderMood}
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] opacity-70 font-semibold whitespace-nowrap">
                        {msg.pinned && !msg.deleted && (
                          <Pin className="h-2.5 w-2.5 text-primary rotate-45 shrink-0" />
                        )}
                        {!msg.deleted && (
                          <CheckCheck className={cn(
                            "h-3.5 w-3.5 tick-appear",
                            msg.read ? "text-blue-400 opacity-100" : "text-inherit/40"
                          )} />
                        )}
                        <span>{format(msg.timestamp, "h:mm a")}</span>
                      </div>
                    </div>
                  )}

                  {/* Replied block */}
                  {msg.replyTo && !msg.deleted && (
                    <button
                      onClick={() => scrollToMessage(msg.replyTo!.id)}
                      className="w-full text-left mb-2 rounded-xl px-3 py-2 border-l-2 border-primary/50 flex items-start gap-2 text-xs bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-inherit"
                    >
                      <ReplyIcon className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-50" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold opacity-75">
                          {msg.replyTo.sender === "you" ? "You" : "Stranger"}
                        </p>
                        <p className="text-[11px] opacity-75 truncate">{msg.replyTo.text || "📷 Attachment"}</p>
                      </div>
                    </button>
                  )}

                  {/* Media content */}
                  {!msg.deleted && msg.imageUrl && /\.(webm|m4a|ogg|mp3|wav)$/i.test(msg.imageUrl) ? (
                    <audio controls src={msg.imageUrl} className="max-w-[220px] my-1 h-10 rounded-lg" />
                  ) : !msg.deleted && msg.imageUrl && /\.(jpe?g|png|gif|webp|svg)$/i.test(msg.imageUrl) ? (
                    <ChatImage src={msg.imageUrl} isMine={true} />
                  ) : !msg.deleted && msg.imageUrl ? (
                    <a 
                      href={msg.imageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 p-3 rounded-xl border border-white/10 my-1 text-xs font-bold hover:underline transition-all bg-white/5 text-white shadow-sm max-w-[240px]"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <FileIcon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[11px]">
                          {msg.imageUrl.split("/").pop()?.split(".").shift() || "Attachment"}
                        </p>
                        <p className="text-[9px] opacity-50 uppercase font-black tracking-wider">
                          .{msg.imageUrl.split(".").pop()?.split("?").shift() || "file"}
                        </p>
                      </div>
                    </a>
                  ) : null}

                  {/* Message Text */}
                  {msg.text && <FormattedText text={msg.text} />}
                  {msg.text && !msg.deleted && <LinkPreview text={msg.text} />}

                  {/* Timer/Disappear Indicator */}
                  {msg.disappearAt && !msg.deleted && (
                    <div className="flex justify-end mt-1 opacity-45">
                      <Timer className="h-3 w-3 text-zinc-400" />
                    </div>
                  )}
                </div>
              ) : (
                /* System messages */
                <div
                  className={cn(
                    "max-w-fit bg-white/5 backdrop-blur-sm text-muted-foreground text-[11px] text-center italic px-4 py-1.5 rounded-full border border-white/5",
                    msg.deleted && "opacity-60 italic"
                  )}
                >
                  {msg.text && <FormattedText text={msg.text} />}
                </div>
              )}
            </SwipeableMessage>

            {/* Translation Card */}
            {translations[msg.id] && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                className={cn(
                  "w-[85%] sm:w-[75%] mt-1 z-10 flex flex-col gap-1 overflow-hidden",
                  msg.sender === "you" ? "items-end" : "items-start"
                )}
              >
                <div className={cn(
                  "rounded-2xl px-4 py-2 border text-sm relative glass-heavy shadow-md flex flex-col gap-1 select-text max-w-full",
                  msg.sender === "you" 
                    ? "bg-primary/5 border-primary/20 text-foreground" 
                    : "bg-secondary/40 border-border text-foreground"
                )}>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-4 text-[9px] font-bold tracking-wider uppercase opacity-60">
                    <span className="flex items-center gap-1 text-primary">
                      <Globe className="h-3 w-3" /> Translated to {translations[msg.id].langName.split(" ")[0]}
                    </span>
                    <button
                      onClick={() => clearTranslation(msg.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-0.5 hover:bg-secondary rounded"
                      title="Clear Translation"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  
                  {/* Card Content */}
                  {translations[msg.id].loading ? (
                    <div className="flex flex-col gap-1 py-1.5 w-32 animate-pulse">
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-3/4 mt-1" />
                    </div>
                  ) : (
                    <p className={cn(
                      "text-xs leading-relaxed font-medium break-words pr-1 select-text",
                      translations[msg.id].error ? "text-destructive" : "text-foreground"
                    )}>
                      {translations[msg.id].text}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

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
