import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface MessageReactionsProps {
  messageId: string;
  reactions: Record<string, string[]>;
  onReact: (messageId: string, emoji: string) => void;
  isMine: boolean;
}

const MessageReactions = ({ messageId, reactions, onReact, isMine }: MessageReactionsProps) => {
  const hasReactions = Object.values(reactions).some((arr) => arr.length > 0);

  if (!hasReactions) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 -mt-1.5 relative z-[2] px-1",
        isMine ? "justify-end pr-2" : "justify-start pl-12"
      )}
    >
      {Object.entries(reactions).map(([emoji, senders]) =>
        senders.length > 0 ? (
          <motion.button
            key={emoji}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            onClick={() => onReact(messageId, emoji)}
            className={cn(
              "flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs",
              "hover:bg-secondary active:scale-95 transition-all shadow-sm",
              "bg-background/90 backdrop-blur-sm border-border/60",
              "min-w-[2rem] justify-center"
            )}
          >
            <span className="text-sm leading-none">{emoji}</span>
            <span className="text-[10px] text-muted-foreground font-medium leading-none">
              {senders.length}
            </span>
          </motion.button>
        ) : null
      )}
    </div>
  );
};

/** Hook for long-press detection (mobile reaction trigger) */
export function useLongPress(callback: () => void, ms = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const start = useCallback(() => {
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      callback();
    }, ms);
  }, [callback, ms]);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: stop,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
  };
}

export default MessageReactions;
