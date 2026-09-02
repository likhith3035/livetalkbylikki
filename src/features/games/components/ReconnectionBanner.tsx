import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw } from "lucide-react";

interface ReconnectionBannerProps {
  isOpponentOffline: boolean;
  opponentName: string;
  onForfeitClaim?: () => void;
}

export const ReconnectionBanner: React.FC<ReconnectionBannerProps> = ({
  isOpponentOffline,
  opponentName,
  onForfeitClaim,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  useEffect(() => {
    let interval: any;
    if (isOpponentOffline) {
      setSecondsRemaining(60);
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
      setSecondsRemaining(60);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpponentOffline]);

  if (!isOpponentOffline) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-xl mx-auto px-4 py-2"
      >
        <div className="p-3 rounded-2xl bg-amber-500/15 backdrop-blur-xl border border-amber-500/30 flex items-center justify-between gap-3 text-amber-200 text-xs shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <div className="flex flex-col min-w-0">
              <span className="font-bold truncate">
                {opponentName} is reconnecting...
              </span>
              <span className="text-[11px] text-amber-200/70">
                Session kept alive for {secondsRemaining}s before timeout
              </span>
            </div>
          </div>

          {secondsRemaining === 0 && onForfeitClaim && (
            <button
              onClick={onForfeitClaim}
              className="px-3 py-1 rounded-xl bg-amber-500 text-amber-950 font-bold text-xs hover:bg-amber-400 transition-colors shrink-0"
            >
              Claim Victory
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
