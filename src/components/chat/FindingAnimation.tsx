import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";
import { X, Search, Globe, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

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

export const FindingAnimation = ({ searchElapsed, onStop, interests }: FindingAnimationProps) => {
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-10 relative overflow-hidden bg-background/50 backdrop-blur-sm">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Deep Background Glow */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.08, 0.03],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/30 rounded-full blur-[140px]"
        />
        
        {/* Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 400 - 200, 
              y: Math.random() * 400 - 200,
              opacity: 0 
            }}
            animate={{ 
              y: [null, Math.random() * -100 - 50],
              opacity: [0, 0.4, 0],
              scale: [0, 1, 0]
            }}
            transition={{ 
              duration: 3 + Math.random() * 4, 
              repeat: Infinity, 
              delay: Math.random() * 5 
            }}
            className="absolute left-1/2 top-1/2 h-1 w-1 bg-primary rounded-full blur-[1px]"
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-12 relative z-10 w-full max-w-lg"
      >
        {/* Modern Searching Animation */}
        <div className="relative flex items-center justify-center h-64">
          {/* Main Visual Group */}
          <div className="relative w-full h-full flex items-center justify-center">
            
            {/* 1. Radar Ray Effects (Outer) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute w-64 h-64 rounded-full border border-primary/5 opacity-40"
            />
            
            {/* 2. Conic Radar Sweep */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute w-56 h-56 rounded-full opacity-[0.1] blur-sm"
              style={{
                background: "conic-gradient(from 0deg, var(--primary) 0deg, transparent 90deg)",
              }}
            />

            {/* 3. Orbital Ring with Node */}
            <motion.div 
               animate={{ rotate: -360 }}
               transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
               className="absolute w-48 h-48 rounded-full border-[0.5px] border-primary/20"
            >
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]" 
              />
            </motion.div>

            {/* 4. Center Logo with Pulse */}
            <div className="relative z-20">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  filter: ["drop-shadow(0 0 10px rgba(var(--primary-rgb), 0.2))", "drop-shadow(0 0 25px rgba(var(--primary-rgb), 0.5))", "drop-shadow(0 0 10px rgba(var(--primary-rgb), 0.2))"]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="bg-background/20 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10 shadow-2xl"
              >
                <BrandLogo className="h-16 w-16 sm:h-20 sm:w-20" />
              </motion.div>
              
              {/* Spinning Mini-Loader around Logo */}
              <svg className="absolute inset-0 -m-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] -rotate-90">
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary/20"
                  strokeDasharray="10 20"
                  animate={{ strokeDashoffset: [0, 100] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
              </svg>
            </div>
            
            {/* Visual Symbols around the center */}
            <AnimatePresence mode="wait">
              <motion.div
                key={statusIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute -bottom-4 flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border backdrop-blur-xl shadow-sm"
              >
                {statusIdx % 3 === 0 ? <Globe className="h-3 w-3 text-primary animate-pulse" /> : 
                 statusIdx % 3 === 1 ? <Users className="h-3 w-3 text-primary animate-pulse" /> : 
                 <Zap className="h-3 w-3 text-primary animate-pulse" />}
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/70 italic">
                  {STATUS_MESSAGES[statusIdx]}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black font-display text-foreground tracking-tighter uppercase italic leading-none">
              Searching<span className="text-primary">...</span>
            </h2>
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/5 border border-primary/10">
                <div className="h-1.5 w-1.5 rounded-full bg-online animate-ping" />
                <span className="text-xs font-bold text-muted-foreground tabular-nums">
                  {searchElapsed}s elapsed
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 items-center">
            {interests.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/50 backdrop-blur-sm border border-border p-4 rounded-3xl flex flex-col items-center gap-3 w-full shadow-sm"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Targeting Preferences</p>
                <div className="flex flex-wrap justify-center gap-2 cursor-default">
                  {interests.map((i) => (
                    <span key={i} className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black rounded-xl uppercase tracking-wider hover:bg-primary/20 transition-colors">
                      #{i}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            <Button
              variant="danger"
              size="lg"
              onClick={onStop}
              className="h-14 sm:h-16 px-10 sm:px-12 text-sm sm:text-base font-black uppercase tracking-[0.2em] italic rounded-2xl gap-3 shadow-[0_10px_30px_rgba(var(--destructive-rgb),0.15)] hover:shadow-[0_15px_40px_rgba(var(--destructive-rgb),0.25)] active:scale-95 transition-all group"
            >
              <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              Cancel Search
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Decorative Lines */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
    </div>
  );
};
