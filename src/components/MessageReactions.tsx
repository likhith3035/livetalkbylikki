import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface MessageReactionsProps {
  messageId: string;
  reactions: Record<string, string[]>;
  onReact: (messageId: string, emoji: string) => void;
  isMine: boolean;
  forceOpen?: boolean;
  onClose?: () => void;
}

const MessageReactions = ({ messageId, reactions, onReact, isMine, forceOpen, onClose }: MessageReactionsProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const isOpen = showPicker || forceOpen;

  const hasReactions = Object.values(reactions).some((arr) => arr.length > 0);

  return (
    <div className={cn("relative", isMine ? "flex flex-col items-end" : "flex flex-col items-start")}>
      {/* Existing reactions */}
      {hasReactions && (
        <div className="flex gap-1 mt-1">
          {Object.entries(reactions).map(([emoji, senders]) =>
            senders.length > 0 ? (
              <motion.button
                key={emoji}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => onReact(messageId, emoji)}
                className="flex items-center gap-0.5 rounded-full bg-secondary/80 border border-border px-1.5 py-0.5 text-xs hover:bg-secondary active:scale-95 transition-all"
              >
                <span>{emoji}</span>
                {senders.length > 1 && (
                  <span className="text-[10px] text-muted-foreground">{senders.length}</span>
                )}
              </motion.button>
            ) : null
          )}
        </div>
      )}

      {/* Reaction trigger */}
      <button
        onClick={() => {
          if (forceOpen) { onClose?.(); } 
          else { setShowPicker(!showPicker); }
        }}
        className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full text-[10px] text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary/60 transition-all"
      >
        {isOpen ? "✕" : "＋"}
      </button>

      {/* Picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 5 }}
            className={cn(
              "absolute bottom-7 z-20 flex gap-1 rounded-2xl bg-card border border-border px-2.5 py-2 shadow-xl",
              isMine ? "right-0" : "left-0"
            )}
          >
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onReact(messageId, emoji);
                  setShowPicker(false);
                }}
                className="text-lg hover:scale-130 active:scale-95 transition-transform px-0.5"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
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
  };
}

export default MessageReactions;
