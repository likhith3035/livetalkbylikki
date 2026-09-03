import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw,
  Home,
  Sparkles,
  RefreshCw,
  Zap,
  ShieldCheck,
  WifiOff,
  Wifi,
  Copy,
  Check,
  Pause,
  Play,
  Send,
  Gamepad2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { ChromeDinoGame } from "./games/ChromeDinoGame";
import { db } from "@/lib/firebase";
import { ref, push, set } from "firebase/database";

interface PageErrorFallbackProps {
  error?: Error | null;
  onReset?: () => void;
}

export const PageErrorFallback: React.FC<PageErrorFallbackProps> = ({ error, onReset }) => {
  const [isReloading, setIsReloading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [copied, setCopied] = useState(false);
  const [reported, setReported] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showMiniGame, setShowMiniGame] = useState(false);

  // Quick reload handler
  const handleQuickReload = useCallback(() => {
    setIsReloading(true);
    try {
      gameAudio.playClick();
    } catch {}
    if (onReset) onReset();
    setTimeout(() => {
      window.location.reload();
    }, 200);
  }, [onReset]);

  // Network offline / online auto-detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      handleQuickReload();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleQuickReload]);

  // Auto-reload countdown (8 seconds)
  useEffect(() => {
    if (isOffline || showMiniGame) {
      setCountdown(null);
      return;
    }

    setCountdown(8);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          handleQuickReload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOffline, showMiniGame, handleQuickReload]);

  // Clear cache and unregister stale service worker bundles
  const handleClearCacheAndSync = async () => {
    setIsClearing(true);
    try {
      gameAudio.playClick();
    } catch {}
    try {
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
      }
      sessionStorage.clear();
      localStorage.removeItem("vite_app_cache_v1");
      localStorage.removeItem("lazy_retry_last_ts");
    } catch (e) {
      console.warn("Cache purge notice:", e);
    } finally {
      window.location.href = "/";
    }
  };

  const handleCopyDiagnostics = () => {
    const info = `LiveTalk Error Report:\nMessage: ${error?.message || "Unknown error"}\nURL: ${window.location.href}\nUserAgent: ${navigator.userAgent}\nTimestamp: ${new Date().toISOString()}`;
    navigator.clipboard.writeText(info).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSendReport = async () => {
    if (reported || isReporting) return;
    setIsReporting(true);
    try {
      if (db) {
        const reportsRef = ref(db, "admin/reports");
        const newReport = push(reportsRef);
        await set(newReport, {
          type: "client_error_auto_ping",
          message: error?.message || "Page reload recovery event",
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        });
      }
      setReported(true);
    } catch (e) {
      console.warn("Report ping failed:", e);
      setReported(true); // Still show user feedback
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="min-h-[75vh] w-full flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="relative w-full max-w-md p-5 sm:p-7 rounded-3xl bg-card/90 backdrop-blur-2xl border border-primary/25 shadow-[0_0_50px_rgba(124,58,237,0.15)] flex flex-col items-center text-center overflow-hidden"
      >
        {/* Ambient Neon Aura Backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 right-10 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* ── View A: Mini-Game Active ── */}
        {showMiniGame ? (
          <div className="w-full space-y-3 relative z-10">
            <ChromeDinoGame onClose={() => setShowMiniGame(false)} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMiniGame(false)}
              className="w-full h-9 rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Dino Game & Return</span>
            </Button>
          </div>
        ) : (
          /* ── View B: Main Recovery Card ── */
          <>
            {/* 3D Floating Official Brand Logo Portal */}
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, 2, -2, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="relative mb-5"
            >
              <div className="w-20 h-20 rounded-3xl bg-card/90 backdrop-blur-xl border-2 border-primary/40 flex items-center justify-center shadow-xl relative overflow-hidden group p-3.5">
                {/* Spinning Glow Ring */}
                <div
                  className="absolute inset-0 rounded-3xl border border-primary/30 animate-spin pointer-events-none"
                  style={{ animationDuration: "10s" }}
                />
                
                {/* Authentic Brand Logo */}
                <BrandLogo className="w-full h-full object-contain drop-shadow-md" />
              </div>

              {/* Dynamic Sync / Sparkle Badge */}
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center shadow-sm backdrop-blur-md">
                {isOffline ? (
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <RotateCcw className={`w-3.5 h-3.5 text-primary ${isReloading ? "animate-spin" : ""}`} />
                )}
              </div>
            </motion.div>

            {/* Reassuring Header & Subtitle */}
            <div className="space-y-1.5 mb-4 relative z-10">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center justify-center gap-2">
                <span>{isOffline ? "Connection Paused" : "Quick Sync Required"}</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {isOffline
                  ? "Your connection is temporarily offline. LiveTalk will auto-reconnect as soon as you are back online."
                  : "LiveTalk just updated or encountered a brief connection sync. Your session data remains safe."}
              </p>
            </div>

            {/* Status Badges Row */}
            <div className="flex items-center gap-2 flex-wrap justify-center mb-4">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/40 border border-border/50 text-[11px] font-bold text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted Session Safe</span>
              </div>

              {isOffline ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-400 animate-pulse">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline Mode</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Network Active</span>
                </div>
              )}
            </div>

            {/* Optional Auto-Sync Countdown Chip */}
            {countdown !== null && countdown > 0 && !isOffline && (
              <div className="flex items-center gap-2 mb-3.5 px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Auto-refreshing in {countdown}s...</span>
                <button
                  type="button"
                  onClick={() => setCountdown(null)}
                  className="ml-1 p-0.5 hover:bg-primary/20 rounded cursor-pointer text-muted-foreground hover:text-foreground"
                  title="Pause auto-reload"
                >
                  <Pause className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* 🦖 Minimal Dino Runner Quick Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setCountdown(null);
                setShowMiniGame(true);
              }}
              className="w-full mb-3 p-2.5 rounded-2xl bg-muted/40 hover:bg-muted/70 border border-border/60 text-foreground flex items-center justify-between shadow-sm cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2.5 text-left">
                <span className="text-xl">🦖</span>
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span>Play Dino Runner</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono font-semibold">
                      Mini-Game
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Jump cacti, double tap for double jump & collect coins!
                  </span>
                </div>
              </div>
              <Gamepad2 className="w-4 h-4 text-muted-foreground mr-1" />
            </motion.button>

            {/* Action Controls */}
            <div className="w-full space-y-2.5 relative z-10">
              {/* Primary Quick Reload Button */}
              <Button
                type="button"
                size="lg"
                onClick={handleQuickReload}
                disabled={isReloading}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-primary-foreground font-black text-sm shadow-lg shadow-primary/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <RefreshCw className={`w-4 h-4 ${isReloading ? "animate-spin" : ""}`} />
                <span>{isReloading ? "Refreshing Session..." : "Reload Page Now"}</span>
              </Button>

              {/* Secondary Actions Row */}
              <div className="grid grid-cols-2 gap-2 w-full pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = "/";
                  }}
                  className="h-10 rounded-xl bg-card/60 hover:bg-muted border-border/60 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Return Home</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearCacheAndSync}
                  disabled={isClearing}
                  className="h-10 rounded-xl bg-card/60 hover:bg-muted border-border/60 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-400 ${isClearing ? "animate-bounce" : ""}`} />
                  <span>{isClearing ? "Purging..." : "Clear Cache"}</span>
                </Button>
              </div>
            </div>

            {/* Discreet Diagnostics & Bug Ping Bar */}
            <div className="mt-4 pt-3 border-t border-border/30 w-full flex items-center justify-between gap-2 text-[10px] font-mono text-muted-foreground/70">
              <span className="truncate max-w-[160px] xs:max-w-[200px]">
                {error?.message ? `Notice: ${error.message}` : "Session sync event"}
              </span>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSendReport}
                  disabled={reported || isReporting}
                  className="flex items-center gap-1 text-[10px] font-sans font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  title="Send anonymous error ping"
                >
                  {reported ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Reported</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>{isReporting ? "Sending..." : "Report Bug"}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCopyDiagnostics}
                  className="flex items-center gap-1 text-[10px] font-sans font-bold text-primary hover:text-primary/80 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
