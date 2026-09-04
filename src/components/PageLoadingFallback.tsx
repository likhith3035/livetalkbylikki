import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

interface PageLoadingFallbackProps {
  message?: string;
  subMessage?: string;
}

export const PageLoadingFallback: React.FC<PageLoadingFallbackProps> = ({
  message = "Loading IncogTalk...",
  subMessage = "Speak Freely. Stay Incognito.",
}) => {
  return (
    <div className="flex-1 min-h-[75vh] w-full flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Ambient Neon Atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/20 rounded-full blur-[90px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-cyan-500/15 rounded-full blur-[70px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center max-w-xs"
      >
        {/* Floating Official Brand Logo with Orbiting Halo Ring */}
        <div className="relative mb-6">
          {/* Outer Rotating Halo Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
            className="absolute -inset-3 rounded-3xl border border-dashed border-primary/40"
          />

          {/* Glowing Center Badge with Authentic Brand Logo */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-card/90 backdrop-blur-xl flex items-center justify-center shadow-[0_0_35px_rgba(124,58,237,0.4)] border border-primary/40 relative overflow-hidden p-3"
          >
            {/* Shimmer Wave Across Logo */}
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
            />
            <BrandLogo className="w-full h-full object-contain drop-shadow-lg" />
          </motion.div>

          {/* Sparkle Badge */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/60 backdrop-blur-md flex items-center justify-center shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          </motion.div>
        </div>

        {/* Text Header & Status */}
        <motion.div
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="space-y-1.5 mb-5"
        >
          <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground">
            {message}
          </h3>
          <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{subMessage}</span>
          </p>
        </motion.div>

        {/* Fluid Neon Loading Track */}
        <div className="w-48 h-1.5 rounded-full bg-muted/60 border border-border/50 overflow-hidden relative shadow-inner">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
            className="w-1/2 h-full rounded-full bg-gradient-to-r from-primary via-cyan-400 to-indigo-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
          />
        </div>
      </motion.div>
    </div>
  );
};
