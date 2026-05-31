import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Users } from "lucide-react";

interface MatchCelebrationProps {
  show: boolean;
  matchedInterests: string[];
  onDismiss?: () => void;
}

const EMOJIS = ["🎉", "✨", "🔥", "💜", "⚡", "🌟", "🎊", "💫"];

// Stable particle data — generated once at module level
const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  emoji: EMOJIS[i % EMOJIS.length],
  x: 10 + (i * 9) % 80,
  delay: (i * 0.07),
  dy: -120 - (i % 4) * 30,
  dx: ((i % 5) - 2) * 60,
}));

const MatchCelebration = ({ show, matchedInterests, onDismiss }: MatchCelebrationProps) => {
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss after 3.5s
  useEffect(() => {
    if (show) {
      dismissTimerRef.current = setTimeout(() => onDismiss?.(), 3500);
    }
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [show, onDismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          {/* Particles — CSS-driven for performance */}
          {PARTICLES.map((p) => (
            <motion.span
              key={p.id}
              initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              animate={{ opacity: 0, y: p.dy, x: p.dx, scale: 0.4 }}
              transition={{ duration: 1.8, delay: p.delay, ease: "easeOut" }}
              className="absolute text-2xl pointer-events-none select-none"
              style={{ left: `${p.x}%`, bottom: "38%" }}
            >
              {p.emoji}
            </motion.span>
          ))}

          {/* Center card */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="pointer-events-auto"
            onClick={onDismiss}
          >
            <div className="flex flex-col items-center gap-3 rounded-3xl bg-card/95 border border-primary/25 px-8 py-6 shadow-2xl shadow-primary/10 relative overflow-hidden">
              {/* Top accent */}
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-violet-500 via-primary to-blue-500" />

              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 250, damping: 18, delay: 0.1 }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 border border-primary/25"
              >
                <Users className="h-7 w-7 text-primary" />
              </motion.div>

              <div className="text-center space-y-0.5">
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg font-black font-display text-foreground"
                >
                  Connected! 🎉
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs text-muted-foreground"
                >
                  Say hello to your stranger
                </motion.p>
              </div>

              {matchedInterests.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex flex-wrap gap-1 justify-center"
                >
                  <Sparkles className="h-3 w-3 text-primary self-center" />
                  {matchedInterests.map((i) => (
                    <span key={i} className="rounded-full bg-primary/12 border border-primary/20 px-2 py-0.5 text-[10px] text-primary font-semibold">
                      {i}
                    </span>
                  ))}
                </motion.div>
              )}

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="text-[10px] text-muted-foreground/60"
              >
                Tap to dismiss
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MatchCelebration;
