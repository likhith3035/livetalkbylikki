import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Video, Gamepad2, Lock, Share2, Sparkles, Activity } from "lucide-react";

interface ActivityItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  badge: string;
  color: string;
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    icon: Gamepad2,
    text: "Two players in Tokyo just started a Connect 4 Duel",
    badge: "Arcade 1v1",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "2",
    icon: Video,
    text: "HD Video Call connected via WebRTC (Latency: 22ms)",
    badge: "Encrypted P2P",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "3",
    icon: Lock,
    text: "Private Room created with instant QR Code",
    badge: "Private Room",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "4",
    icon: Share2,
    text: "P2P 48MB File transfer completed with zero server storage",
    badge: "File Drop",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "5",
    icon: MessageSquare,
    text: "Stranger matched with shared interest: #gaming",
    badge: "Instant Match",
    color: "text-primary bg-primary/10 border-primary/20",
  },
  {
    id: "6",
    icon: Sparkles,
    text: "Player leveled up to Grandmaster in Memory Duel",
    badge: "Level Up",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
];

export const HomeLiveTicker: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ACTIVITIES.length);
    }, 4200);

    return () => clearInterval(timer);
  }, []);

  const current = ACTIVITIES[currentIndex];
  const Icon = current.icon;

  return (
    <div className="w-full max-w-xl mx-auto px-4 my-3">
      <div className="flex items-center justify-center">
        <div className="h-10 px-3.5 sm:px-4 rounded-full bg-card/70 backdrop-blur-xl border border-border/70 shadow-lg shadow-black/20 flex items-center gap-2.5 overflow-hidden text-xs max-w-full">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80 hidden xs:inline">
              LIVE
            </span>
          </div>

          <div className="h-3 w-[1px] bg-border/60 shrink-0" />

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 truncate flex-1 min-w-0"
            >
              <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-foreground/90 font-medium truncate text-[11px] sm:text-xs">
                {current.text}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 hidden sm:inline-block ${current.color}`}
              >
                {current.badge}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
