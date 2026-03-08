import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatTimerProps {
  isConnected: boolean;
  onAutoDisconnect: () => void;
}

const TIMER_OPTIONS = [
  { label: "2 min", seconds: 120 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
];

const ChatTimer = ({ isConnected, onAutoDisconnect }: ChatTimerProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) {
      setRemaining(null);
      setTotalDuration(null);
      onAutoDisconnect();
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [remaining, onAutoDisconnect]);

  // Reset when disconnected
  useEffect(() => {
    if (!isConnected) {
      setRemaining(null);
      setTotalDuration(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isConnected]);

  const startTimer = (seconds: number) => {
    setRemaining(seconds);
    setTotalDuration(seconds);
    setShowPicker(false);
  };

  const cancelTimer = () => {
    setRemaining(null);
    setTotalDuration(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  if (!isConnected) return null;

  const progress = remaining !== null && totalDuration ? ((totalDuration - remaining) / totalDuration) * 100 : 0;
  const isUrgent = remaining !== null && remaining <= 30;

  return (
    <div className="relative">
      {remaining !== null ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors",
            isUrgent
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-primary/10 border-primary/30 text-primary"
          )}
        >
          <div className="relative h-4 w-4">
            <svg className="h-4 w-4 -rotate-90" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.2" />
              <circle
                cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2"
                strokeDasharray={`${(1 - progress / 100) * 50.27} 50.27`}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className={cn("text-[11px] font-medium tabular-nums", isUrgent && "animate-pulse")}>
            {formatTime(remaining)}
          </span>
          <button onClick={cancelTimer} className="opacity-60 hover:opacity-100">
            <X className="h-3 w-3" />
          </button>
        </motion.div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPicker(!showPicker)}
          className="gap-1 h-8 px-2 text-xs"
          title="Set chat timer"
        >
          <Clock className="h-3.5 w-3.5" />
        </Button>
      )}

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            className="absolute top-full right-0 mt-1 z-50 rounded-xl border border-border bg-card shadow-xl p-2 min-w-[140px]"
          >
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-1">
              Auto-disconnect in
            </p>
            {TIMER_OPTIONS.map((opt) => (
              <button
                key={opt.seconds}
                onClick={() => startTimer(opt.seconds)}
                className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatTimer;
