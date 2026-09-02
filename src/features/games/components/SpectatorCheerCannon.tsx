import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Megaphone, ThumbsUp, Rocket } from "lucide-react";
import { SpectatorCheer, SpectatorCheerType } from "../types";
import { sendSpectatorCheer, subscribeToSpectatorCheers } from "../services/gameRoomService";
import { gameAudio } from "../services/gameSoundService";

interface SpectatorCheerCannonProps {
  roomCode: string;
  spectatorName: string;
  isSpectator: boolean;
}

interface ActiveCheerEffect {
  id: string;
  name: string;
  type: SpectatorCheerType;
  icon: string;
  title: string;
  color: string;
}

const CHEER_TYPES: {
  type: SpectatorCheerType;
  label: string;
  icon: string;
  color: string;
  bg: string;
}[] = [
  {
    type: "confetti",
    label: "Confetti",
    icon: "🎊",
    color: "text-amber-400",
    bg: "hover:bg-amber-500/20 border-amber-500/30",
  },
  {
    type: "horn",
    label: "Air Horn",
    icon: "📣",
    color: "text-rose-400",
    bg: "hover:bg-rose-500/20 border-rose-500/30",
  },
  {
    type: "applause",
    label: "Applause",
    icon: "👏",
    color: "text-emerald-400",
    bg: "hover:bg-emerald-500/20 border-emerald-500/30",
  },
  {
    type: "rocket",
    label: "Rocket",
    icon: "🚀",
    color: "text-sky-400",
    bg: "hover:bg-sky-500/20 border-sky-500/30",
  },
];

export const SpectatorCheerCannon: React.FC<SpectatorCheerCannonProps> = ({
  roomCode,
  spectatorName,
  isSpectator,
}) => {
  const [cooldown, setCooldown] = useState(false);
  const [activeEffects, setActiveEffects] = useState<ActiveCheerEffect[]>([]);

  // Listen to incoming spectator cheers in the room
  useEffect(() => {
    const unsub = subscribeToSpectatorCheers(roomCode, (cheer: SpectatorCheer) => {
      // Trigger matching sound
      if (cheer.type === "confetti") gameAudio.playCheer();
      else if (cheer.type === "horn") gameAudio.playHorn();
      else if (cheer.type === "applause") gameAudio.playApplause();
      else if (cheer.type === "rocket") gameAudio.playRocket();

      const matched = CHEER_TYPES.find((c) => c.type === cheer.type) || CHEER_TYPES[0];
      const effect: ActiveCheerEffect = {
        id: cheer.id + "_" + Math.random(),
        name: cheer.spectatorName,
        type: cheer.type,
        icon: matched.icon,
        title: matched.label,
        color: matched.color,
      };

      setActiveEffects((prev) => [...prev.slice(-4), effect]);

      setTimeout(() => {
        setActiveEffects((prev) => prev.filter((e) => e.id !== effect.id));
      }, 3500);
    });

    return () => unsub();
  }, [roomCode]);

  const handleFireCannon = async (type: SpectatorCheerType) => {
    if (cooldown) return;
    setCooldown(true);

    try {
      await sendSpectatorCheer(roomCode, spectatorName || "Spectator", type);
    } catch {}

    setTimeout(() => {
      setCooldown(false);
    }, 2000);
  };

  return (
    <>
      {/* Real-time Cheer Storm Banner Overlays (Visible to ALL: Players & Spectators) */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center gap-2 w-full max-w-sm px-4">
        <AnimatePresence>
          {activeEffects.map((eff) => (
            <motion.div
              key={eff.id}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="px-4 py-2 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl flex items-center gap-2.5 text-xs font-bold text-foreground"
            >
              <span className="text-xl animate-bounce">{eff.icon}</span>
              <div className="flex items-center gap-1.5 truncate">
                <span className={`${eff.color} font-black`}>{eff.name}</span>
                <span className="text-muted-foreground font-medium">fired</span>
                <span className="text-foreground">{eff.title}!</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating particles for cheer storm */}
      <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
        <AnimatePresence>
          {activeEffects.slice(-2).map((eff) => (
            <React.Fragment key={"particles_" + eff.id}>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 1,
                    x: `${50 + (Math.random() - 0.5) * 60}vw`,
                    y: "90vh",
                    scale: 0.5,
                  }}
                  animate={{
                    opacity: 0,
                    x: `${50 + (Math.random() - 0.5) * 80}vw`,
                    y: `${10 + Math.random() * 30}vh`,
                    scale: 1.2 + Math.random() * 0.8,
                    rotate: (Math.random() - 0.5) * 360,
                  }}
                  transition={{
                    duration: 2.2 + Math.random() * 0.8,
                    ease: "easeOut",
                  }}
                  className="absolute text-2xl"
                >
                  {eff.icon}
                </motion.div>
              ))}
            </React.Fragment>
          ))}
        </AnimatePresence>
      </div>

      {/* Spectator-Only Interactive Cannon Controls Tray */}
      {isSpectator && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-3"
        >
          <div className="p-2.5 rounded-2xl sm:rounded-3xl bg-card/95 backdrop-blur-2xl border border-primary/40 shadow-2xl flex flex-col gap-2">
            <div className="flex items-center justify-between px-2 text-[10px] font-bold text-muted-foreground">
              <span className="flex items-center gap-1 text-primary">
                <Sparkles className="w-3 h-3" />
                Spectator Cheer Cannon
              </span>
              <span>{cooldown ? "Reloading..." : "Ready to Fire!"}</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {CHEER_TYPES.map((cheer) => (
                <button
                  key={cheer.type}
                  onClick={() => handleFireCannon(cheer.type)}
                  disabled={cooldown}
                  className={`p-2 rounded-xl sm:rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${cheer.bg} ${
                    cooldown
                      ? "opacity-50 grayscale cursor-not-allowed scale-95"
                      : "hover:scale-105 active:scale-95 bg-muted/40 shadow-sm"
                  }`}
                  title={`Fire ${cheer.label}`}
                >
                  <span className="text-xl sm:text-2xl">{cheer.icon}</span>
                  <span className="text-[10px] font-bold truncate text-foreground">
                    {cheer.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};
