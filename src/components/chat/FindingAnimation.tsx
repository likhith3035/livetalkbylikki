import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";
import { X, Globe, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef, useMemo } from "react";

interface FindingAnimationProps {
  searchElapsed: number;
  onStop: () => void;
  interests: string[];
}

const STATUS_MESSAGES = [
  "Scanning for online users...",
  "Filtering by interests...",
  "Optimizing connection path...",
  "Matching with someone compatible...",
  "Entering the digital lobby...",
  "Almost there...",
];

// Stable particle data — generated once, never on re-render
const PARTICLES = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  x: (i * 80) - 160,
  y: (i * 60) - 120,
  duration: 3.5 + i * 0.7,
  delay: i * 0.9,
  dy: -60 - i * 15,
}));

export const FindingAnimation = ({ searchElapsed, onStop, interests }: FindingAnimationProps) => {
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 relative overflow-hidden">
      {/* Subtle static background glow — no animation to save GPU */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px]" />

        {/* Stable particles — positions fixed, only opacity/y animates */}
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute left-1/2 top-1/2 h-1 w-1 bg-primary rounded-full"
            style={{ x: p.x, y: p.y }}
            animate={{ y: [p.y, p.y + p.dy, p.y], opacity: [0, 0.5, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-10 relative z-10 w-full max-w-lg"
      >
        {/* Searching animation — simplified to 2 rings + logo */}
        <div className="relative flex items-center justify-center h-56">
          {/* Outer slow ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute w-52 h-52 rounded-full border border-primary/10"
          />

          {/* Inner ring with dot */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute w-36 h-36 rounded-full border border-primary/20"
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary)/0.8)]" />
          </motion.div>

          {/* Center logo — gentle pulse only */}
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-20 bg-card/80 backdrop-blur-sm p-5 rounded-[2rem] border border-border shadow-xl"
          >
            <BrandLogo className="h-14 w-14" />
          </motion.div>

          {/* Status label */}
          <AnimatePresence mode="wait">
            <motion.div
              key={statusIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="absolute -bottom-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border shadow-sm"
            >
              {statusIdx % 3 === 0
                ? <Globe className="h-3 w-3 text-primary" />
                : statusIdx % 3 === 1
                ? <Users className="h-3 w-3 text-primary" />
                : <Zap className="h-3 w-3 text-primary" />}
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                {STATUS_MESSAGES[statusIdx]}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-3xl font-black font-display text-foreground tracking-tighter uppercase italic leading-none">
              Searching<span className="text-primary">...</span>
            </h2>
            <div className="flex items-center justify-center gap-2 px-3 py-1 rounded-lg bg-primary/5 border border-primary/10 w-fit mx-auto">
              <div className="h-1.5 w-1.5 rounded-full bg-online animate-pulse" />
              <span className="text-xs font-bold text-muted-foreground tabular-nums">
                {searchElapsed}s elapsed
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4 items-center">
            {interests.length > 0 && (
              <div className="bg-card/60 border border-border p-3 rounded-2xl flex flex-col items-center gap-2 w-full shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Targeting</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {interests.map((i) => (
                    <span key={i} className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-lg uppercase tracking-wide">
                      #{i}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="danger"
              size="lg"
              onClick={onStop}
              className="h-12 px-8 text-sm font-black uppercase tracking-widest italic rounded-2xl gap-2 active:scale-95 transition-transform"
            >
              <X className="h-4 w-4" />
              Cancel Search
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
