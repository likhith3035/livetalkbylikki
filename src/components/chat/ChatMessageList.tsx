import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { CheckCheck, Pin, Trash2, Reply as ReplyIcon, Timer, Forward, Copy, Globe, X, File as FileIcon, Play, Pause, Mic, Download, BarChart3, Check, ChevronDown } from "lucide-react";
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
import { useSettings } from "@/contexts/SettingsContext";

const AudioMessageBubble = ({ src, isMine }: { src: string; isMine?: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const toggleSpeed = () => {
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-2xl bg-black/10 dark:bg-white/10 my-1 max-w-[260px] sm:max-w-[300px]">
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); setProgress(0); }}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100);
          }
        }}
      />
      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          "h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md",
          isMine ? "bg-white text-primary" : "bg-primary text-primary-foreground"
        )}
      >
        {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <Mic className="h-3 w-3 text-rose-400 shrink-0 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Voice Note</span>
          </div>
          {duration > 0 && (
            <span className="text-[10px] font-mono opacity-70 shrink-0">
              {Math.floor(duration)}s
            </span>
          )}
        </div>
        <div className="h-1.5 w-full bg-black/20 dark:bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-rose-500 transition-all duration-150" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <button
        type="button"
        onClick={toggleSpeed}
        className="text-[10px] font-bold px-1.5 py-1 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-primary/20 transition-colors shrink-0"
        title="Playback Speed"
      >
        {speed}x
      </button>
      <a
        href={src}
        download="voicenote.webm"
        className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        title="Download Audio"
      >
        <Download className="h-3.5 w-3.5" />
      </a>
    </div>
  );
};



interface ChatMessageListProps {
  messages: Message[];
  strangerTyping: boolean;
  strangerTypingText?: string;
  strangerName?: string;
  onReact: (messageId: string, emoji: string) => void;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onForward?: (message: Message) => void;
  disappearTimer?: number | null;
  highlightMessageId?: string | null;
  isReplying?: boolean;
  autoTranslations?: Record<string, string>;
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

const getFontSizeClasses = (size?: string) => {
  switch (size) {
    case "compact": return "text-[11px] sm:text-xs leading-tight py-1.5 px-3";
    case "small": return "text-xs sm:text-sm leading-snug py-2 px-3.5";
    case "large": return "text-base sm:text-lg leading-relaxed py-3.5 px-5";
    case "medium":
    default: return "text-sm sm:text-base leading-relaxed py-3 px-4";
  }
};

const getBubbleShapeClasses = (shape?: string, isStranger?: boolean) => {
  switch (shape) {
    case "pill": return "rounded-3xl";
    case "sharp": return "rounded-md";
    case "compact": return "rounded-xl";
    case "rounded":
    default: return isStranger ? "rounded-[1.5rem] rounded-bl-sm" : "rounded-[1.5rem] rounded-br-sm";
  }
};

const isAudioMedia = (url?: string) => {
  if (!url) return false;
  return url.startsWith("data:audio/") || /\.(webm|m4a|ogg|mp3|wav)(\?.*)?$/i.test(url);
};

const isGifUrl = (url?: string) => {
  if (!url) return false;
  if (/\.gif(\?.*)?$/i.test(url)) return true;
  if (url.includes("tenor.com") || url.includes("tenor.googleapis.com")) return true;
  if (url.includes("giphy.com") || url.includes("gph.is")) return true;
  return false;
};

const isImageMedia = (url?: string) => {
  if (!url) return false;
  if (url.startsWith("data:image/") || url.startsWith("blob:")) return true;
  if (/\.(jpe?g|png|gif|webp|svg|avif)(\?.*)?$/i.test(url)) return true;
  if (url.includes("tenor.com") || url.includes("tenor.googleapis.com")) return true;
  if (url.includes("giphy.com") || url.includes("gph.is")) return true;
  if (url.includes("supabase.co/storage/") && !/\.(pdf|zip|rar|doc|docx|mp4|webm|mp3)$/i.test(url)) return true;
  return false;
};

/** Returns true if the message text is only emoji characters (no letters/digits) */
const isEmojiOnly = (text?: string) => {
  if (!text || text.length === 0) return false;
  // Strip variation selectors, ZWJ, and emoji modifiers, then check if anything non-emoji remains
  const stripped = text.replace(/[\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, "");
  const emojiPattern = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+$/u;
  return emojiPattern.test(stripped) && stripped.trim().length <= 12;
};

const ChatMessageList = ({
  messages,
  strangerTyping,
  strangerTypingText,
  strangerName,
  onReact,
  onReply,
  onDelete,
  onPin,
  onForward,
  disappearTimer,
  highlightMessageId,
  isReplying,
  autoTranslations,
}: ChatMessageListProps) => {
  const { settings } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showTranslateFor, setShowTranslateFor] = useState<string | null>(null);
  const [translationsMap, setTranslationsMap] = useState<Record<string, { text: string; langName: string; loading?: boolean; error?: boolean }>>({});
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [newMessagesBelow, setNewMessagesBelow] = useState(0);
  const prevMsgLengthRef = useRef(messages.length);

  const toggleMenu = useCallback((msgId: string) => {
    setActiveMenuId((prev) => (prev === msgId ? null : msgId));
  }, []);

  const handleTranslate = async (msgId: string, text: string, langCode: string, langName: string) => {
    setTranslationsMap((prev) => ({
      ...prev,
      [msgId]: { text: "", langName, loading: true }
    }));

    try {
      const translated = await translateText(text, langCode);
      setTranslationsMap((prev) => ({
        ...prev,
        [msgId]: { text: translated, langName, loading: false }
      }));
    } catch (e) {
      setTranslationsMap((prev) => ({
        ...prev,
        [msgId]: { text: "Translation failed. Check connection.", langName, error: true, loading: false }
      }));
    }
  };

  const clearTranslation = (msgId: string) => {
    setTranslationsMap((prev) => {
      const next = { ...prev };
      delete next[msgId];
      return next;
    });
  };

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isUp = distanceFromBottom > 140;
    setIsScrolledUp(isUp);
    if (!isUp) {
      setNewMessagesBelow(0);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsScrolledUp(false);
    setNewMessagesBelow(0);
  }, []);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    const isMyMsg = lastMsg?.sender === "you";
    const addedCount = messages.length - prevMsgLengthRef.current;
    prevMsgLengthRef.current = messages.length;

    if (isMyMsg || !isScrolledUp) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      setNewMessagesBelow(0);
    } else if (addedCount > 0 && isScrolledUp) {
      setNewMessagesBelow((prev) => prev + addedCount);
    }
  }, [messages, strangerTyping, isScrolledUp]);

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
      toggleMenu(msgId);
    }, 450);
  }, [toggleMenu]);

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
      ref={containerRef}
      onScroll={handleScroll}
      className={cn(
        "flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-2 sm:px-5 lg:px-8 py-4 space-y-3 mx-auto w-full max-w-3xl transition-all duration-300 relative",
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
        {messages.map((msg, idx) => {
          const isRecent = idx >= messages.length - 20;
          
          return (
            <motion.div
              key={msg.id}
              id={`msg-${msg.id}`}
              custom={msg.sender}
              variants={isRecent ? messageVariants : undefined}
              initial={isRecent ? "hidden" : false}
              animate={isRecent ? "visible" : false}
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
              onSwipeLeft={msg.sender !== "system" && !msg.deleted ? () => onReply?.(msg) : undefined}
            >


              {/* Backdrop overlay for mobile menu */}
              <AnimatePresence>
                {activeMenuId === msg.id && msg.sender !== "system" && !msg.deleted && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm sm:hidden"
                    onClick={closeMenu}
                  />
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
                  <div className="flex flex-col min-w-0 max-w-full">
                    <div
                      onTouchStart={msg.sender !== "system" ? () => handleTouchStart(msg.id) : undefined}
                      onTouchEnd={msg.sender !== "system" ? handleTouchEnd : undefined}
                      onTouchCancel={msg.sender !== "system" ? handleTouchEnd : undefined}
                      onContextMenu={(e) => { if (msg.sender !== "system") { e.preventDefault(); toggleMenu(msg.id); } }}
                      style={!isEmojiOnly(msg.text) || msg.imageUrl ? {
                        backgroundColor: `hsl(var(--bubble-stranger))`,
                        color: `hsl(var(--bubble-stranger-foreground))`
                      } : undefined}
                      className={cn(
                        "relative break-words select-text transition-all duration-500 w-fit max-w-full overflow-hidden",
                        isEmojiOnly(msg.text) && !msg.imageUrl
                          ? "text-4xl sm:text-5xl leading-tight py-1 px-1"
                          : cn(
                              "border border-border/80 shadow-sm min-w-[150px] hover:brightness-105",
                              getFontSizeClasses(settings.messageFontSize),
                              getBubbleShapeClasses(settings.messageBubbleShape, true)
                            ),
                        msg.replyTo && !msg.deleted && "min-w-[220px] sm:min-w-[260px]",
                        msg.deleted && "opacity-60 italic",
                        msg.pinned && !msg.deleted && "ring-1 ring-primary/30",
                        activeMenuId === msg.id && "ring-2 ring-primary/40 shadow-xl scale-[1.02]"
                      )}
                    >
                      {/* Header: Name and Time — hide for emoji-only */}
                      {msg.sender !== "system" && (!isEmojiOnly(msg.text) || msg.imageUrl) && (
                        <div className="flex items-center justify-between gap-3 mb-1.5 border-b border-black/5 dark:border-white/5 pb-1">
                          <span className="text-xs font-bold flex items-center gap-1.5 truncate opacity-90">
                            {msg.senderNickname?.trim() || strangerName || "Stranger"}
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

                      {/* Media content — GIFs get special rendering */}
                      {!msg.deleted && isAudioMedia(msg.imageUrl) ? (
                        <AudioMessageBubble src={msg.imageUrl!} isMine={false} />
                      ) : !msg.deleted && (isImageMedia(msg.imageUrl) || isGifUrl(msg.imageUrl)) ? (
                        <ChatImage src={msg.imageUrl!} isMine={false} />
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

                      {/* Auto-Translation Subtitle */}
                      {autoTranslations && autoTranslations[msg.id] && !msg.deleted && (
                        <div className="mt-2 pt-1.5 border-t border-black/10 dark:border-white/10 text-xs text-emerald-400 font-medium flex items-start gap-1">
                          <Globe className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{autoTranslations[msg.id]}</span>
                        </div>
                      )}

                      {/* Emoji-only timestamp — compact inline */}
                      {isEmojiOnly(msg.text) && !msg.imageUrl && !msg.deleted && (
                        <p className="text-[9px] text-muted-foreground/60 font-medium mt-0.5">
                          {format(msg.timestamp, "h:mm a")}
                        </p>
                      )}

                      {/* Timer/Disappear Indicator */}
                      {msg.disappearAt && !msg.deleted && (
                        <div className="flex justify-start mt-1 opacity-45">
                          <Timer className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Reaction badges — attached to bubble */}
                    {msg.sender !== "system" && !msg.deleted && (
                      <MessageReactions
                        messageId={msg.id}
                        reactions={msg.reactions}
                        onReact={onReact}
                        isMine={false}
                      />
                    )}
                  </div>
                </div>
              ) : msg.sender === "you" ? (
                /* User (You) bubble: aligned right, no avatar */
                <div className="flex flex-col items-end w-fit max-w-[85%] sm:max-w-[75%]">
                  <div
                    onTouchStart={msg.sender !== "system" ? () => handleTouchStart(msg.id) : undefined}
                    onTouchEnd={msg.sender !== "system" ? handleTouchEnd : undefined}
                    onTouchCancel={msg.sender !== "system" ? handleTouchEnd : undefined}
                    onContextMenu={(e) => { if (msg.sender !== "system") { e.preventDefault(); toggleMenu(msg.id); } }}
                    style={!isEmojiOnly(msg.text) || msg.imageUrl ? {
                      backgroundColor: `hsl(var(--bubble-you))`,
                      color: `hsl(var(--bubble-you-foreground))`
                    } : undefined}
                    className={cn(
                      "relative break-words select-text transition-all duration-500 w-fit max-w-full overflow-hidden",
                      isEmojiOnly(msg.text) && !msg.imageUrl
                        ? "text-4xl sm:text-5xl leading-tight py-1 px-1"
                        : cn(
                            "border border-white/5 shadow-md min-w-[150px] hover:brightness-110",
                            getFontSizeClasses(settings.messageFontSize),
                            getBubbleShapeClasses(settings.messageBubbleShape, false)
                          ),
                      msg.replyTo && !msg.deleted && "min-w-[220px] sm:min-w-[260px]",
                      msg.deleted && "opacity-60 italic",
                      msg.pinned && !msg.deleted && "ring-1 ring-primary/30",
                      activeMenuId === msg.id && "ring-2 ring-primary/40 shadow-xl scale-[1.02]"
                    )}
                  >
                    {/* Header: You and Time/Ticks — hide for emoji-only */}
                    {msg.sender !== "system" && (!isEmojiOnly(msg.text) || msg.imageUrl) && (
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

                    {/* Media content — GIFs get special rendering */}
                    {!msg.deleted && isAudioMedia(msg.imageUrl) ? (
                      <AudioMessageBubble src={msg.imageUrl!} isMine={true} />
                    ) : !msg.deleted && (isImageMedia(msg.imageUrl) || isGifUrl(msg.imageUrl)) ? (
                      <ChatImage src={msg.imageUrl!} isMine={true} />
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

                    {/* Emoji-only timestamp — compact inline */}
                    {isEmojiOnly(msg.text) && !msg.imageUrl && !msg.deleted && (
                      <p className="text-[9px] text-muted-foreground/60 font-medium mt-0.5 text-right">
                        {format(msg.timestamp, "h:mm a")}
                      </p>
                    )}

                    {/* Timer/Disappear Indicator */}
                    {msg.disappearAt && !msg.deleted && (
                      <div className="flex justify-end mt-1 opacity-45">
                        <Timer className="h-3 w-3 text-zinc-400" />
                      </div>
                    )}
                  </div>

                  {/* Reaction badges — attached to bubble */}
                  {msg.sender !== "system" && !msg.deleted && (
                    <MessageReactions
                      messageId={msg.id}
                      reactions={msg.reactions}
                      onReact={onReact}
                      isMine={true}
                    />
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
            {translationsMap[msg.id] && (
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
                      <Globe className="h-3 w-3" /> Translated to {translationsMap[msg.id].langName.split(" ")[0]}
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
                  {translationsMap[msg.id].loading ? (
                    <div className="flex flex-col gap-1 py-1.5 w-32 animate-pulse">
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-3/4 mt-1" />
                    </div>
                  ) : (
                    <p className={cn(
                      "text-xs leading-relaxed font-medium break-words pr-1 select-text",
                      translationsMap[msg.id].error ? "text-destructive" : "text-foreground"
                    )}>
                      {translationsMap[msg.id].text}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Reactions are now rendered inside each bubble's wrapper — see stranger/you blocks above */}
          </motion.div>
        })}
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
      {/* Telegram / Instagram Style Full Viewport Overlay Context Menu (Zero Clipping Guaranteed!) */}
      <AnimatePresence>
        {activeMenuId && (() => {
          const activeMsg = messages.find((m) => m.id === activeMenuId);
          if (!activeMsg || activeMsg.sender === "system" || activeMsg.deleted) return null;

          return (
            <motion.div
              data-msg-menu
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/65 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none"
              onClick={closeMenu}
            >
              <motion.div
                initial={{ scale: 0.88, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: 12 }}
                transition={{ type: "spring", stiffness: 450, damping: 28 }}
                className="flex flex-col items-center gap-3 max-w-xs w-full pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Reactions Selector (Top Pill) */}
                <div className="flex items-center justify-around gap-1.5 bg-background/95 dark:bg-zinc-900/95 border border-border/80 rounded-full px-4 py-2.5 shadow-2xl backdrop-blur-xl w-full">
                  {["❤️", "👍", "🔥", "😂", "😮", "😢"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => { onReact(activeMsg.id, emoji); closeMenu(); }}
                      className="hover:scale-135 active:scale-90 transition-transform text-2xl p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Message Text Preview */}
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-xs font-semibold max-w-full w-full shadow-xl border border-white/10 break-words line-clamp-3 text-center",
                  activeMsg.sender === "you"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}>
                  {activeMsg.text || (activeMsg.imageUrl ? "📷 Attachment" : "Message")}
                </div>

                {/* Actions Stack List */}
                <div className="flex flex-col w-full bg-background/95 dark:bg-zinc-900/95 border border-border/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={() => { onReply?.(activeMsg); closeMenu(); }}
                    className="flex items-center justify-between gap-3 w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    <span>Reply</span>
                    <ReplyIcon className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(activeMsg.text || ""); closeMenu(); }}
                    className="flex items-center justify-between gap-3 w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    <span>Copy</span>
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowTranslateFor(activeMsg.id); closeMenu(); }}
                    className="flex items-center justify-between gap-3 w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    <span>Translate</span>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { onPin?.(activeMsg.id); closeMenu(); }}
                    className="flex items-center justify-between gap-3 w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    <span>Pin</span>
                    <Pin className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { onForward?.(activeMsg); closeMenu(); }}
                    className={cn(
                      "flex items-center justify-between gap-3 w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors",
                      activeMsg.sender === "you" && "border-b border-border/40 pb-2.5 mb-1"
                    )}
                  >
                    <span>Forward</span>
                    <Forward className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {activeMsg.sender === "you" && (
                    <button
                      type="button"
                      onClick={() => { onDelete?.(activeMsg.id); closeMenu(); }}
                      className="flex items-center justify-between gap-3 w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/15 transition-colors"
                    >
                      <span>Delete Message</span>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Translation Language Picker Modal */}
      <AnimatePresence>
        {showTranslateFor && (() => {
          const targetMsg = messages.find((m) => m.id === showTranslateFor);
          if (!targetMsg) return null;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[220] bg-black/65 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none"
              onClick={() => setShowTranslateFor(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 15 }}
                transition={{ type: "spring", stiffness: 450, damping: 28 }}
                className="bg-background border border-border/80 rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Globe className="h-4 w-4" />
                    <span>Translate Message</span>
                  </div>
                  <button
                    onClick={() => setShowTranslateFor(null)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-secondary"
                  >
                    <X className="h-4 w-4 text-xs" />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 italic border-l-2 border-primary/40 pl-2 py-0.5">
                  "{targetMsg.text}"
                </p>

                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        handleTranslate(targetMsg.id, targetMsg.text || "", lang.code, lang.name);
                        setShowTranslateFor(null);
                      }}
                      className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left"
                    >
                      <span>{lang.name}</span>
                      <Globe className="h-3.5 w-3.5 opacity-50" />
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Floating Scroll to Bottom button when scrolled up */}
      <AnimatePresence>
        {isScrolledUp && (
          <motion.button
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            onClick={scrollToBottom}
            className="sticky bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-2xl hover:bg-primary/90 transition-all active:scale-95 border border-white/20 cursor-pointer"
            aria-label="Scroll to latest messages"
          >
            <ChevronDown className="h-4 w-4 animate-bounce" />
            <span>
              {newMessagesBelow > 0 
                ? `${newMessagesBelow} New Message${newMessagesBelow > 1 ? "s" : ""} Below` 
                : "Scroll to Bottom"}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <div ref={endRef} />
    </div>
  );
};

export default ChatMessageList;
