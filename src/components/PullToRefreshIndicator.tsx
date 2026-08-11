import React from "react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { RefreshCw, ArrowDown } from "lucide-react";
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
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        className="fixed top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center"
      >
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-md border shadow-lg transition-all duration-150 ${
            isReady
              ? "border-primary/80 bg-primary/10 text-primary shadow-primary/20 scale-105"
              : "border-border/60 text-muted-foreground"
          }`}
          style={{
            transform: `translateY(${Math.min(pullDistance * 0.4, 40)}px)`,
          }}
        >
          <RefreshCw
            className={`h-4 w-4 transition-transform ${
              isRefreshing ? "animate-spin text-primary" : ""
            }`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
            }}
          />

          <span className="text-[11px] font-bold tracking-tight">
            {isRefreshing
              ? "Refreshing..."
              : isReady
              ? "Release to Refresh"
              : "Pull to Refresh"}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
