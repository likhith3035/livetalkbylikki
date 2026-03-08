import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface MatchCelebrationProps {
  show: boolean;
  matchedInterests: string[];
}

const EMOJIS = ["🎉", "✨", "🔥", "💜", "⚡", "🌟", "🎊", "💫"];

const MatchCelebration = ({ show, matchedInterests }: MatchCelebrationProps) => {
  const [particles, setParticles] = useState<Array<{ id: number; emoji: string; x: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
        >
          {/* Particles */}
          {particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{
                opacity: 0,
                y: -120 - Math.random() * 80,
                scale: 0.4,
                x: (Math.random() - 0.5) * 200,
              }}
              transition={{ duration: 1.5, delay: p.delay, ease: "easeOut" }}
              className="absolute text-2xl"
              style={{ left: `${p.x}%`, bottom: "40%" }}
            >
              {p.emoji}
            </motion.span>
          ))}

          {/* Center card */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative"
          >
            {/* Pulse rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="match-ring absolute h-20 w-20 rounded-full border-2 border-primary/40" />
              <span className="match-ring absolute h-20 w-20 rounded-full border-2 border-primary/30" style={{ animationDelay: "0.3s" }} />
            </div>

            <div className="flex flex-col items-center gap-3 rounded-2xl bg-card/95 backdrop-blur-xl border border-primary/30 px-8 py-6 shadow-2xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 border border-primary/30">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <p className="text-lg font-display font-bold text-foreground">Connected!</p>
              {matchedInterests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {matchedInterests.map((i) => (
                    <span key={i} className="rounded-full bg-primary/15 border border-primary/25 px-2.5 py-0.5 text-[11px] text-primary font-medium">
                      {i}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Say hello! 👋</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MatchCelebration;
