import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Users } from "lucide-react";

interface MatchCelebrationProps {
  show: boolean;
  matchedInterests: string[];
}

const EMOJIS = ["🎉", "✨", "🔥", "💜", "⚡", "🌟", "🎊", "💫"];

const MatchCelebration = ({ show, matchedInterests }: MatchCelebrationProps) => {
  const [particles, setParticles] = useState<Array<{ id: number; emoji: string; x: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      const newParticles = Array.from({ length: 16 }, (_, i) => ({
        id: i,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        x: Math.random() * 100,
        delay: Math.random() * 0.6,
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
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/40 backdrop-blur-sm"
          />

          {/* Particles */}
          {particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{
                opacity: 0,
                y: -150 - Math.random() * 100,
                scale: 0.3,
                x: (Math.random() - 0.5) * 300,
              }}
              transition={{ duration: 2, delay: p.delay, ease: "easeOut" }}
              className="absolute text-3xl"
              style={{ left: `${p.x}%`, bottom: "35%" }}
            >
              {p.emoji}
            </motion.span>
          ))}

          {/* Center card */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="relative"
          >
            {/* Pulse rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="match-ring absolute h-24 w-24 rounded-full border-2 border-primary/40" />
              <span className="match-ring absolute h-24 w-24 rounded-full border-2 border-primary/25" style={{ animationDelay: "0.3s" }} />
              <span className="match-ring absolute h-24 w-24 rounded-full border-2 border-primary/15" style={{ animationDelay: "0.6s" }} />
            </div>

            <div className="flex flex-col items-center gap-4 rounded-3xl bg-card/95 backdrop-blur-xl border border-primary/30 px-10 py-8 shadow-2xl shadow-primary/10">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.15 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 border border-primary/30"
              >
                <Users className="h-8 w-8 text-primary" />
              </motion.div>

              <div className="text-center space-y-1">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-xl font-display font-bold text-foreground"
                >
                  Connected! 🎉
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-muted-foreground"
                >
                  You're now chatting with a stranger
                </motion.p>
              </div>

              {matchedInterests.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap gap-1.5 justify-center"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {matchedInterests.map((i) => (
                    <span key={i} className="rounded-full bg-primary/15 border border-primary/25 px-2.5 py-0.5 text-[11px] text-primary font-medium">
                      {i}
                    </span>
                  ))}
                </motion.div>
              )}

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xs text-muted-foreground"
              >
                Say hello! 👋
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MatchCelebration;
