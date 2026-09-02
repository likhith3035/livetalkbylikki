import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Bot, Trophy, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfflineAIFallbackBannerProps {
  isOpponentOffline: boolean;
  isSelfOffline: boolean;
  opponentName: string;
  onSwitchToAI: () => void;
  onForfeitClaim?: () => void;
}

export const OfflineAIFallbackBanner: React.FC<OfflineAIFallbackBannerProps> = ({
  isOpponentOffline,
  isSelfOffline,
  opponentName,
  onSwitchToAI,
  onForfeitClaim,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(45);

  useEffect(() => {
    let interval: any;
    if (isOpponentOffline) {
      setSecondsRemaining(45);
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setSecondsRemaining(45);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpponentOffline]);

  const shouldShow = isSelfOffline || isOpponentOffline;
  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-2"
      >
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-violet-500/20 backdrop-blur-2xl border border-amber-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-foreground">
          {/* Status & Explanation */}
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
              <WifiOff className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5 truncate">
                {isSelfOffline ? "You are Offline" : `${opponentName} is Reconnecting (${secondsRemaining}s)`}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                Don't lose your match score or round progress!
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {secondsRemaining === 0 && !isSelfOffline && onForfeitClaim && (
              <Button
                onClick={onForfeitClaim}
                size="sm"
                className="h-9 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs gap-1.5 shadow-md"
              >
                <Trophy className="w-3.5 h-3.5" />
                Claim Win
              </Button>
            )}

            <Button
              onClick={onSwitchToAI}
              size="sm"
              className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 text-primary-foreground font-black text-xs gap-1.5 shadow-md shadow-primary/25 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>Continue vs Smart AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
