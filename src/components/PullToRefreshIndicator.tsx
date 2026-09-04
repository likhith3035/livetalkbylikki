import React from "react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { RefreshCw, Sparkles, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PullToRefreshIndicatorProps {
  onRefresh?: () => Promise<void> | void;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({ onRefresh }) => {
  const { pullDistance, isRefreshing, threshold } = usePullToRefresh({ onRefresh });

  if (pullDistance === 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const isReady = pullDistance >= threshold;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.85 }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-[250] pointer-events-none flex flex-col items-center select-none"
      >
        <div
          className={`flex items-center gap-2.5 px-4 py-2 rounded-full bg-card/95 backdrop-blur-2xl border shadow-xl transition-all duration-200 ${
            isReady
              ? "border-primary bg-primary/15 text-primary shadow-[0_0_20px_rgba(124,58,237,0.35)] scale-105"
              : "border-border/60 text-muted-foreground shadow-black/20"
          }`}
          style={{
            transform: `translateY(${Math.min(pullDistance * 0.35, 32)}px)`,
          }}
        >
          {isRefreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin text-primary shrink-0" />
          ) : isReady ? (
            <Sparkles className="h-4 w-4 text-primary animate-pulse shrink-0" />
          ) : (
            <motion.div style={{ rotate: progress * 180 }}>
              <ArrowDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </motion.div>
          )}

          <span className="text-xs font-black tracking-wide">
            {isRefreshing
              ? "Syncing IncogTalk..."
              : isReady
              ? "Release to Sync"
              : "Pull down to sync"}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
