import { useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import EmojiBurst from "@/components/EmojiBurst";

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface MessageReactionsProps {
  messageId: string;
  reactions: Record<string, string[]>;
  onReact: (messageId: string, emoji: string) => void;
  isMine: boolean;
}

const MessageReactions = ({ messageId, reactions, onReact, isMine }: MessageReactionsProps) => {
  const [burstEmoji, setBurstEmoji] = useState<string | null>(null);
  const hasReactions = Object.values(reactions).some((arr) => arr.length > 0);

  const handleReact = (emoji: string) => {
    setBurstEmoji(emoji);
    onReact(messageId, emoji);
  };

  if (!hasReactions && !burstEmoji) return null;

  return (
    <div className={cn("flex gap-1 mt-1 relative", isMine ? "justify-end" : "justify-start")}>
      <AnimatePresence>
        {burstEmoji && (
          <EmojiBurst
            key={`${messageId}-${burstEmoji}`}
            emoji={burstEmoji}
            onComplete={() => setBurstEmoji(null)}
          />
        )}
      </AnimatePresence>

      {Object.entries(reactions).map(([emoji, senders]) =>
        senders.length > 0 ? (
          <motion.button
            key={emoji}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => handleReact(emoji)}
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
