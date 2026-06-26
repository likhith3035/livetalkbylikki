import { useState, useEffect, useRef, useCallback } from "react";
import QRCodeLib from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Check, Share2, X, Link2, Hash, Wifi, WifiOff, Clock,
  Loader2, QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { ref, onValue, off } from "firebase/database";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const APP_URL = typeof window !== "undefined" ? window.location.origin : "https://LiveTalkbylikki.netlify.app";
const ROOM_EXPIRY_SECONDS = 300; // 5 minutes

interface RoomWaitingScreenProps {
  roomCode: string;
  onCancel: () => void;
  onPartnerJoined?: () => void;
  isMatched: boolean;
  handoffPanel?: ReactNode;
}

type ConnectionStatus = "waiting" | "partner_joined" | "offline";

// Animated waiting dots
const WaitingDots = () => (
  <span className="inline-flex gap-1 items-end ml-1">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="inline-block w-1.5 h-1.5 rounded-full bg-primary"
        animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
      />
    ))}
  </span>
);

// Concentric ripple effects behind the QR Code card
const QRBackgroundRipples = () => (
  <div className="absolute inset-0 flex items-center justify-center -z-10 pointer-events-none">
    {[1, 2, 3].map((i) => (
      <motion.div
        key={i}
        className="absolute rounded-[2.5rem] border border-primary/20 bg-primary/[0.02]"
        style={{ width: 228, height: 228 }}
        animate={{
          scale: [1, 1.35, 1.7],
          opacity: [0.5, 0.2, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          delay: i * 1,
          ease: "easeOut",
        }}
      />
    ))}
  </div>
);

// SVG Checkmark animation for success connection
const Checkmark = () => (
  <svg className="w-16 h-16 text-green-400" viewBox="0 0 52 52">
    <motion.circle
      cx="26"
      cy="26"
      r="25"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
    <motion.path
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      d="M14.1 27.2l7.1 7.2 16.7-16.8"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
    />
  </svg>
);

// QR code rendered from raw SVG string with center logo
function QRDisplay({ value, isDark }: { value: string; isDark: boolean }) {
  const [svgString, setSvgString] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  const qrBg = isDark ? "#18181b" : "#ffffff";
  const qrFg = isDark ? "#e4e4e7" : "#09090b";

  useEffect(() => {
    if (!value) return;
    QRCodeLib.toString(value, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 1,
      color: { dark: qrFg, light: qrBg },
      width: 200,
    })
      .then((svg: string) => {
        // Adjust style and make it fill container
        const patched = svg
          .replace('<svg ', '<svg style="display:block;border-radius:12px;" ')
          .replace(/width="\d+"/, 'width="100%"')
          .replace(/height="\d+"/, 'height="100%"');
        setSvgString(patched);
      })
      .catch((err: Error) => console.error("[QR] generation failed:", err));
  }, [value, qrBg, qrFg]);

  if (!svgString) {
    return (
      <div className="flex items-center justify-center rounded-[2rem] border border-white/10 bg-black/20 w-full h-full">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded-[2rem] p-3 overflow-hidden bg-black/40 border border-white/15 backdrop-blur-xl shadow-xl flex items-center justify-center w-full h-full"
    >
      {/* QR SVG */}
      <div
        style={{ width: "100%", height: "100%" }}
        dangerouslySetInnerHTML={{ __html: svgString }}
      />

      {/* Logo centered on top */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="rounded-2xl flex items-center justify-center shadow-lg bg-black border border-white/20"
          style={{
            width: 48,
            height: 48,
            padding: 6,
          }}
        >
          <img
            src="/logo.png"
            alt="LiveTalk"
            style={{ width: 34, height: 34, objectFit: "contain", display: "block" }}
          />
        </div>
      </div>

      {/* Animated scan line */}
      <div className="absolute inset-[12px] rounded-2xl pointer-events-none overflow-hidden">
        <motion.div
          className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60 shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]"
          animate={{ top: ["4%", "96%", "4%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

export default function RoomWaitingScreen({ roomCode, onCancel, onPartnerJoined, isMatched, handoffPanel }: RoomWaitingScreenProps) {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("waiting");
  const [secondsLeft, setSecondsLeft] = useState(ROOM_EXPIRY_SECONDS);
  const [isDark, setIsDark] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const redirectedRef = useRef(false);

  const joinUrl = `${APP_URL}/room/${roomCode}`;

  // Detect theme class
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Expiry countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          onCancel();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [onCancel]);

  // Network connection status
  useEffect(() => {
    const handleOnline = () => setConnectionStatus((s) => s === "offline" ? "waiting" : s);
    const handleOffline = () => setConnectionStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (!navigator.onLine) setConnectionStatus("offline");
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync isMatched connection state
  useEffect(() => {
    if (isMatched && connectionStatus !== "partner_joined" && !redirectedRef.current) {
      redirectedRef.current = true;
      setConnectionStatus("partner_joined");
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => onPartnerJoined?.(), 1600);
    }
  }, [isMatched, connectionStatus, onPartnerJoined]);

  // Fallback Firebase check: watch lobby for a second user with this room code
  useEffect(() => {
    if (!roomCode || isMatched) return;
    const lobbyRef = ref(db, "lobby");

    const handleSnapshot = (snapshot: any) => {
      if (redirectedRef.current) return;
      if (!snapshot.exists()) return;
      const users = snapshot.val() as Record<string, { code?: string }>;
      const matching = Object.values(users).filter(
        (u) => u?.code?.toUpperCase() === roomCode.toUpperCase()
      );
      if (matching.length >= 2) {
        redirectedRef.current = true;
        setConnectionStatus("partner_joined");
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(() => onPartnerJoined?.(), 1600);
      }
    };

    onValue(lobbyRef, handleSnapshot);
    return () => off(lobbyRef, "value", handleSnapshot);
  }, [roomCode, onPartnerJoined, isMatched]);

  const handleCopyCode = useCallback(async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    toast({ title: "Room Code Copied!" });
    setTimeout(() => setCopiedCode(false), 2000);
  }, [roomCode, toast]);

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    toast({ title: "Invite Link Copied!", description: "Share it with your friend." });
    setTimeout(() => setCopiedLink(false), 2000);
  }, [joinUrl, toast]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "LiveTalk Private Room",
          text: `Join my private room on LiveTalk! Code: ${roomCode}`,
          url: joinUrl,
        });
        return;
      } catch { /* cancelled */ }
    }
    handleCopyLink();
  }, [roomCode, joinUrl, handleCopyLink]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const expiryPercent = (secondsLeft / ROOM_EXPIRY_SECONDS) * 100;

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center bg-black/60 backdrop-blur-md overflow-y-auto">
      {/* Scroll padding so content doesn't touch edges on very short screens */}
      <div className="w-full max-w-sm mx-auto px-3 py-4 sm:py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
        >
          <div className="relative rounded-[2rem] border border-white/10 bg-zinc-950/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Top glow bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 via-primary to-blue-500" />
            {/* Ambient glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 p-5 sm:p-6 flex flex-col items-center gap-4 sm:gap-5">

              {/* Header */}
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/20 shrink-0">
                    <QrCode className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-white leading-none">Invite Friend</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Scan QR or share the link</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCancel}
                  className="h-8 w-8 rounded-xl text-white/60 hover:text-white hover:bg-white/10 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* QR / Connected state */}
              <div className="relative w-full flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {connectionStatus === "partner_joined" ? (
                    <motion.div
                      key="joined"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex flex-col items-center justify-center gap-3 py-6"
                    >
                      <div className="relative flex items-center justify-center">
                        <motion.div
                          className="absolute w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20"
                          animate={{ scale: [1, 1.35, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <Checkmark />
                      </div>
                      <div className="text-center">
                        <p className="text-base font-black text-green-400 uppercase tracking-widest italic">Connected!</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">Redirecting to chat...</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="qr"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative"
                    >
                      <QRBackgroundRipples />
                      {/* Responsive QR: full width on tiny screens */}
                      <div className="w-[clamp(180px,60vw,220px)] aspect-square">
                        <QRDisplay value={joinUrl} isDark={true} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Room Code */}
              <div className="w-full flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Room Code</span>
                <div className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-2.5 flex items-center justify-between gap-2">
                  <Hash className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-mono text-lg sm:text-xl font-black tracking-[0.2em] text-white text-center select-all flex-1">
                    {roomCode}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyCode}
                    className="h-8 w-8 p-0 rounded-xl text-white/60 hover:text-white hover:bg-white/10 shrink-0"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="w-full flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyCode}
                    className="h-10 gap-1.5 text-[10px] font-bold uppercase tracking-wide rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy Code
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyLink}
                    className="h-10 gap-1.5 text-[10px] font-bold uppercase tracking-wide rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Link2 className="h-3.5 w-3.5" />}
                    Copy Link
                  </Button>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleShare}
                  className="h-10 gap-2 text-[10px] font-bold uppercase tracking-wide rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share Invite
                </Button>
              </div>

              {/* Waiting status / offline */}
              <AnimatePresence mode="wait">
                {connectionStatus === "waiting" && (
                  <motion.div
                    key="waiting"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="w-full rounded-2xl bg-white/5 border border-white/10 p-3 flex flex-col items-center gap-2"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                      </span>
                      Waiting for your friend to join
                      <WaitingDots />
                    </div>
                    <div className="w-full flex items-center gap-2.5">
                      <Clock className="h-3 w-3 text-white/40 shrink-0" />
                      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            expiryPercent > 50 ? "bg-primary" : expiryPercent > 20 ? "bg-yellow-500" : "bg-red-500"
                          )}
                          style={{ width: `${expiryPercent}%` }}
                        />
                      </div>
                      <span className={cn(
                        "text-[10px] font-mono font-bold tabular-nums shrink-0",
                        expiryPercent > 50 ? "text-white/60" : expiryPercent > 20 ? "text-yellow-500" : "text-red-500"
                      )}>
                        {formatTime(secondsLeft)}
                      </span>
                    </div>
                  </motion.div>
                )}
                {connectionStatus === "offline" && (
                  <motion.div
                    key="offline"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="w-full rounded-2xl bg-destructive/10 border border-destructive/20 p-3 flex items-center gap-2.5"
                  >
                    <WifiOff className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-xs font-bold text-destructive">You appear to be offline</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cross-device handoff panel — only shown if provided */}
              {handoffPanel && (
                <div className="w-full">{handoffPanel}</div>
              )}

              {/* Cancel */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="w-full text-xs text-white/40 hover:text-destructive hover:bg-destructive/10 rounded-2xl h-9"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancel Invitation
              </Button>
            </div>
          </div>

          <p className="text-center text-[10px] text-white/30 mt-2.5 font-medium">
            Room expires in {formatTime(secondsLeft)} · Keep this screen open
          </p>
        </motion.div>
      </div>
    </div>
  );
}
