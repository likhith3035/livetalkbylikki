import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X, AlertTriangle, Eye, ShieldAlert } from "lucide-react";
import { setNativeScreenSecure, startNativeScreenshotDetection, stopNativeScreenshotDetection } from "@/lib/privacy-protection";
import { haptics } from "@/lib/haptics";

interface SnapMediaModalProps {
  isOpen: boolean;
  imageUrl: string;
  senderName: string;
  duration?: number; // seconds, default 10
  onClose: () => void;
  onExpire: () => void;
  onScreenshotAttempt?: () => void;
}

export default function SnapMediaModal({
  isOpen,
  imageUrl,
  senderName,
  duration = 10,
  onClose,
  onExpire,
  onScreenshotAttempt,
}: SnapMediaModalProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [screenshotDetected, setScreenshotDetected] = useState(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const onScreenshotAttemptRef = useRef(onScreenshotAttempt);
  onScreenshotAttemptRef.current = onScreenshotAttempt;

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(duration);
      setScreenshotDetected(false);
      return;
    }

    // 1. Enable Android native hardware FLAG_SECURE
    setNativeScreenSecure(true);

    // 2. Listen for native hardware screenshots
    let unregisterScreenshot: (() => void) | null = null;
    startNativeScreenshotDetection(() => {
      setScreenshotDetected(true);
      haptics.warning();
      onScreenshotAttemptRef.current?.();
      // Burn snap immediately on screenshot attempt
      setTimeout(() => {
        onExpireRef.current?.();
      }, 1200);
    }).then((unsub) => {
      unregisterScreenshot = unsub;
    });

    // 3. Web printscreen / devtools listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || (e.ctrlKey && e.shiftKey && e.key === "S")) {
        e.preventDefault();
        setScreenshotDetected(true);
        haptics.warning();
        onScreenshotAttemptRef.current?.();
        setTimeout(() => {
          onExpireRef.current?.();
        }, 1200);
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);

    // 4. Timer countdown
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", handleKeyDown, true);
      if (unregisterScreenshot) {
        unregisterScreenshot();
      }
    };
  }, [isOpen, duration]);

  if (!isOpen) return null;

  const progressPct = (timeLeft / duration) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none overflow-hidden"
      >
        {/* Top Header & Countdown Bar */}
        <div className="relative z-10 pt-safe px-4 pt-4 flex flex-col gap-3">
          {/* Snapchat-style Top Progress Bar */}
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-full"
              style={{ width: `${progressPct}%` }}
              transition={{ ease: "linear", duration: 0.2 }}
            />
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Flame className="h-4 w-4 text-white animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-white">
                  Snap from {senderName}
                </p>
                <p className="text-[10px] font-bold text-white/60">
                  Self-destructs in <span className="text-amber-400 font-mono">{timeLeft}s</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onExpire();
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white/80 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Screenshot Caught Alert Overlay */}
        {screenshotDetected && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-x-4 top-24 z-50 p-4 rounded-2xl bg-destructive/90 border border-red-400/30 text-white flex items-center gap-3 shadow-2xl backdrop-blur-md"
          >
            <ShieldAlert className="h-6 w-6 text-yellow-300 animate-bounce" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Screenshot Detected!</p>
              <p className="text-[10px] opacity-90">Screenshot alert sent to {senderName}. Expiring snap...</p>
            </div>
          </motion.div>
        )}

        {/* Media Content */}
        <div className="flex-1 flex items-center justify-center p-4 min-h-0 relative">
          <motion.img
            src={imageUrl}
            alt="Snap"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl pointer-events-none select-none"
            draggable={false}
          />
        </div>

        {/* Bottom Hint */}
        <div className="pb-safe px-4 pb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold uppercase tracking-widest text-white/70">
            <Eye className="h-3 w-3 text-amber-400" />
            View-Once Protected • Will disappear
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
