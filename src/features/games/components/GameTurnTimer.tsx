import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Clock, AlertTriangle } from "lucide-react";
import { gameAudio } from "../services/gameSoundService";

interface GameTurnTimerProps {
  turnExpiresAt?: number | null;
  turnTimerSeconds?: number;
  isMyTurn: boolean;
  onTimeout?: () => void;
}

export const GameTurnTimer: React.FC<GameTurnTimerProps> = ({
  turnExpiresAt,
  turnTimerSeconds = 0,
  isMyTurn,
  onTimeout,
}) => {
  if (!turnExpiresAt || turnTimerSeconds <= 0) return null;

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    return Math.max(0, Math.ceil((turnExpiresAt - Date.now()) / 1000));
  });

  const lastTickedSecRef = useRef<number>(-1);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((turnExpiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);

      // Heartbeat audio tick on each of the final 5 seconds if it's player's turn
      if (remaining > 0 && remaining <= 5 && isMyTurn) {
        if (lastTickedSecRef.current !== remaining) {
          lastTickedSecRef.current = remaining;
          gameAudio.playHeartbeatTick();
        }
      }

      if (remaining === 0) {
        clearInterval(interval);
        onTimeout?.();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [turnExpiresAt, isMyTurn, onTimeout]);

  const percentage = Math.min(100, Math.max(0, (timeLeft / turnTimerSeconds) * 100));
  const isUrgent = timeLeft <= 5;

  return (
    <motion.div
      animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: Infinity, duration: 0.8 }}
      className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border shadow-sm text-[10px] sm:text-xs font-bold my-0.5 sm:my-1 select-none transition-colors ${
        isUrgent
          ? "bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-rose-500/20"
          : "bg-card/90 border-border text-foreground"
      }`}
    >
      {isUrgent ? (
        <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-400 animate-bounce shrink-0" />
      ) : (
        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" />
      )}

      <span className={isUrgent ? "text-rose-400 font-black tracking-wider shrink-0" : "text-foreground shrink-0"}>
        {timeLeft}s
      </span>

      <div className="w-10 xs:w-14 sm:w-16 h-1 sm:h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
        <motion.div
          className={`h-full ${isUrgent ? "bg-rose-500" : "bg-amber-500"}`}
          style={{ width: `${percentage}%` }}
          transition={{ ease: "linear", duration: 0.2 }}
        />
      </div>
    </motion.div>
  );
};
