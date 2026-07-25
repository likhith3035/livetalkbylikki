import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VoiceMemoPlayerProps {
  audioSrc: string;
  durationSeconds?: number;
  isSelf?: boolean;
}

export const VoiceMemoPlayer: React.FC<VoiceMemoPlayerProps> = ({
  audioSrc,
  durationSeconds = 5,
  isSelf = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const progressPercent = durationSeconds > 0 ? (currentTime / durationSeconds) * 100 : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-2xl border min-w-[200px] max-w-[280px] shadow-sm select-none",
        isSelf
          ? "bg-primary text-primary-foreground border-primary/40"
          : "bg-card text-card-foreground border-border/70"
      )}
    >
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          "h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md",
          isSelf
            ? "bg-white/20 text-white hover:bg-white/30"
            : "bg-primary/15 text-primary hover:bg-primary/25"
        )}
      >
        {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
      </button>

      {/* Waveform Equalizer + Progress */}
      <div className="flex flex-col flex-1 min-w-0 gap-1">
        <div className="flex items-center gap-0.5 h-6">
          {[40, 75, 55, 90, 30, 85, 60, 100, 45, 80, 50, 70, 35].map((heightPct, idx) => {
            const isActive = (idx / 13) * 100 <= progressPercent;
            return (
              <motion.span
                key={idx}
                className={cn(
                  "w-1 rounded-full transition-colors",
                  isSelf
                    ? isActive ? "bg-white" : "bg-white/40"
                    : isActive ? "bg-primary" : "bg-muted-foreground/30"
                )}
                style={{ height: `${heightPct}%` }}
                animate={isPlaying ? { height: [`${heightPct}%`, `${Math.max(20, (heightPct * 1.3) % 100)}%`, `${heightPct}%`] } : {}}
                transition={{ duration: 0.5, repeat: isPlaying ? Infinity : 0, delay: idx * 0.05 }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] opacity-80 font-mono">
          <span>{isPlaying ? `${Math.round(currentTime)}s` : "Voice Note"}</span>
          <span>{durationSeconds}s</span>
        </div>
      </div>
    </div>
  );
};
