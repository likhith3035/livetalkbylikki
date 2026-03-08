import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface OnlineBadgeProps {
  count: number;
}

const AnimatedDigit = ({ digit }: { digit: string }) => (
  <div className="relative inline-flex h-[1.1em] overflow-hidden" style={{ width: digit === "," ? "0.35em" : "0.6em" }}>
    <AnimatePresence mode="popLayout">
      <motion.span
        key={digit}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "-100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {digit}
      </motion.span>
    </AnimatePresence>
  </div>
);

const OnlineBadge = ({ count }: OnlineBadgeProps) => {
  const formatted = count.toLocaleString();

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-2.5 sm:px-3 py-1 sm:py-1.5 w-fit">
      <span className="h-2 w-2 rounded-full bg-online animate-pulse-glow" />
      <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap flex items-center">
        {formatted.split("").map((char, i) => (
          <AnimatedDigit key={`${i}-${char}`} digit={char} />
        ))}
        <span className="ml-1">online</span>
      </span>
    </div>
  );
};

export default OnlineBadge;
