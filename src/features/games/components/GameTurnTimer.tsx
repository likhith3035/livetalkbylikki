import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, AlertCircle } from "lucide-react";
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

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((turnExpiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining === 3 && isMyTurn) {
        gameAudio.playLose();
      }

      if (remaining === 0) {
        clearInterval(interval);
        onTimeout?.();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [turnExpiresAt, isMyTurn, onTimeout]);

  const percentage = Math.min(100, Math.max(0, (timeLeft / turnTimerSeconds) * 100));
  const isUrgent = timeLeft <= 4;

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-card/80 border border-border shadow-sm text-xs font-bold my-1 select-none">
      <Clock className={`w-3.5 h-3.5 ${isUrgent ? "text-rose-500 animate-spin" : "text-amber-500"}`} />
      <span className={isUrgent ? "text-rose-500 font-black animate-pulse" : "text-foreground"}>
        {timeLeft}s
      </span>
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full ${isUrgent ? "bg-rose-500" : "bg-amber-500"}`}
          style={{ width: `${percentage}%` }}
          transition={{ ease: "linear", duration: 0.25 }}
        />
      </div>
    </div>
  );
};
