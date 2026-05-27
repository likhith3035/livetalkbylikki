import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

interface PrivacyWatermarkProps {
  userName: string;
  strangerName: string;
  sessionId: string;
}

export default function PrivacyWatermark({ userName, strangerName, sessionId }: PrivacyWatermarkProps) {
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

  // Generate randomized positions, rotations, and opacities for the watermark grid elements
  // We'll create a grid of 6 repeating watermarks that move independently
  const watermarks = [
    { id: 1, baseTop: "15%", baseLeft: "15%" },
    { id: 2, baseTop: "20%", baseLeft: "65%" },
    { id: 3, baseTop: "45%", baseLeft: "40%" },
    { id: 4, baseTop: "70%", baseLeft: "15%" },
    { id: 5, baseTop: "75%", baseLeft: "70%" },
    { id: 6, baseTop: "35%", baseLeft: "20%" },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40 select-none">
      {watermarks.map((wm) => (
        <motion.div
          key={wm.id}
          className="absolute flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-black/10 backdrop-blur-[2px] shadow-sm select-none"
          style={{ top: wm.baseTop, left: wm.baseLeft }}
          animate={{
            x: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
            y: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
            rotate: [wm.id % 2 === 0 ? -12 : 12, wm.id % 2 === 0 ? -6 : 6, wm.id % 2 === 0 ? -15 : 15, wm.id % 2 === 0 ? -12 : 12],
            opacity: [0.15, 0.25, 0.1, 0.2, 0.15],
            scale: [0.95, 1.05, 0.9, 1, 0.95]
          }}
          transition={{
            duration: 12 + wm.id * 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="flex items-center gap-1.5 text-foreground/45">
            <Shield className="h-3 w-3 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] italic font-display">
              LiveTalk Secure
            </span>
          </div>
          <div className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-wider text-center mt-1 space-y-0.5">
            <div>User: {userName || "You"}</div>
            <div>Peer: {strangerName || "Stranger"}</div>
            <div className="tabular-nums">{time}</div>
            <div className="font-mono opacity-50 text-[7px]">{sessionId.substring(0, 8)}...</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
