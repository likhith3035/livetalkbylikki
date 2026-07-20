import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Minimize2, LogOut, Heart, Phone, Video, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DisconnectGuardModalProps {
  isOpen: boolean;
  onStay: () => void;
  onMinimize?: () => void;
  onDisconnect: () => void;
  strangerName?: string;
  strangerAvatar?: string;
  strangerMood?: string;
  matchedInterests?: string[];
  isCallActive?: boolean;
  isAudioOnly?: boolean;
}

export const DisconnectGuardModal: React.FC<DisconnectGuardModalProps> = ({
  isOpen,
  onStay,
  onMinimize,
  onDisconnect,
  strangerName = "Stranger",
  strangerAvatar,
  strangerMood,
  matchedInterests = [],
  isCallActive = false,
  isAudioOnly = false,
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          {/* Backdrop Blur Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onStay}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={cn(
              "relative z-10 w-full sm:max-w-md bg-card/95 border border-border/80 rounded-t-[2.5rem] sm:rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col items-center text-center",
              "before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-primary/40 before:via-emerald-500/60 before:to-primary/40"
            )}
          >
            {/* Mobile Drag Indicator Bar */}
            <div className="w-12 h-1.5 rounded-full bg-border/80 mb-5 sm:hidden" />

            {/* Header Stranger Avatar with Animated Pulsing Glow */}
            <div className="relative mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-75 blur-md" />
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-secondary border-2 border-primary/40 flex items-center justify-center text-2xl font-bold shadow-lg overflow-hidden shrink-0">
                {strangerAvatar ? (
                  strangerAvatar.startsWith("data:image/") ? (
                    <img src={strangerAvatar} alt={strangerName} className="h-full w-full object-cover" />
                  ) : (
                    <span>{strangerAvatar}</span>
                  )
                ) : (
                  <MessageSquare className="h-8 w-8 text-primary" />
                )}
              </div>
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-card animate-pulse" />
            </div>

            {/* Connection Status & Name */}
            <div className="space-y-1 mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-extrabold uppercase tracking-widest">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Connection
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {strangerName}
              </h2>
              {strangerMood && (
                <p className="text-xs text-muted-foreground font-medium">"{strangerMood}"</p>
              )}
            </div>

            {/* Active Call Badge / Matched Interests */}
            <div className="w-full flex flex-wrap items-center justify-center gap-2 mb-5">
              {isCallActive && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold">
                  {isAudioOnly ? <Phone className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                  <span>Live Call Active</span>
                </div>
              )}
              {matchedInterests.length > 0 && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                  <Heart className="h-3 w-3 fill-emerald-500/30" />
                  <span>Matched: {matchedInterests.slice(0, 2).join(", ")}</span>
                </div>
              )}
            </div>

            {/* Caution Text */}
            <div className="bg-secondary/40 border border-border/60 rounded-2xl p-3.5 mb-6 text-left w-full flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-foreground">Are you sure you want to exit?</p>
                <p className="text-muted-foreground leading-relaxed">
                  Leaving now will end your live match with {strangerName}. You can stay in chat or minimize to float while browsing.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2.5">
              {/* Option 1: Stay in Chat (Primary) */}
              <Button
                variant="glow"
                size="lg"
                onClick={onStay}
                className="w-full h-12 rounded-2xl font-black uppercase text-xs tracking-wider gap-2 shadow-lg shadow-primary/20"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Keep Chatting (Stay Connected)</span>
              </Button>

              {/* Option 2: Minimize & Float (Unique Feature) */}
              {onMinimize && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onMinimize}
                  className="w-full h-12 rounded-2xl font-bold text-xs uppercase tracking-wider gap-2 border-border/80 bg-card/60 hover:bg-secondary text-foreground"
                >
                  <Minimize2 className="h-4 w-4 text-emerald-400" />
                  <span>Minimize & Browse App</span>
                </Button>
              )}

              {/* Option 3: Disconnect & End (Destructive) */}
              <Button
                variant="ghost"
                size="lg"
                onClick={onDisconnect}
                className="w-full h-11 rounded-2xl font-bold text-xs uppercase tracking-wider text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Disconnect & End Chat</span>
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DisconnectGuardModal;
