import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, Lock } from "lucide-react";

interface PrivacyWatermarkProps {
  userName?: string;
  strangerName?: string;
  sessionId?: string;
}

export default function PrivacyWatermark({ userName = "You", strangerName = "Stranger", sessionId = "" }: PrivacyWatermarkProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const watermarks = [
    { id: 1, baseTop: "12%", baseLeft: "12%" },
    { id: 2, baseTop: "18%", baseLeft: "68%" },
    { id: 3, baseTop: "48%", baseLeft: "42%" },
    { id: 4, baseTop: "72%", baseLeft: "15%" },
    { id: 5, baseTop: "78%", baseLeft: "72%" },
    { id: 6, baseTop: "32%", baseLeft: "22%" },
  ];

  const shortSession = useMemo(() => {
    return sessionId ? sessionId.substring(0, 10) : "LT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  }, [sessionId]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40 select-none">
      {watermarks.map((wm) => (
        <motion.div
          key={wm.id}
          className="absolute flex flex-col items-center justify-center p-3 rounded-xl border border-white/10 bg-black/20 backdrop-blur-[2px] shadow-sm select-none"
          style={{ top: wm.baseTop, left: wm.baseLeft }}
          animate={{
            x: [0, (wm.id % 2 === 0 ? 25 : -25), 0],
            y: [0, (wm.id % 3 === 0 ? -20 : 20), 0],
            rotate: [wm.id % 2 === 0 ? -12 : 12, wm.id % 2 === 0 ? -6 : 6, wm.id % 2 === 0 ? -14 : 14],
            opacity: [0.18, 0.32, 0.15, 0.28, 0.18],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            duration: 10 + wm.id * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="flex items-center gap-1.5 text-white/60">
            <Shield className="h-3 w-3 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] italic font-display">
              IncogTalk Anti-Record Shield
            </span>
            <Lock className="h-2.5 w-2.5 text-amber-400/80" />
          </div>
          <div className="text-[8px] font-bold text-white/50 uppercase tracking-wider text-center mt-1 space-y-0.5 font-mono">
            <div>USER: {userName} • PEER: {strangerName}</div>
            <div className="tabular-nums text-primary/80">{time}</div>
            <div className="opacity-60 text-[7px] tracking-widest">ID: {shortSession}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
