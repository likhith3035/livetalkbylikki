import { useState, useEffect } from "react";
import QRCodeLib from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Check, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, Clock, Smartphone, Link2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { SessionToken, ParticipantRecord } from "./types";

interface DeviceHandoffPanelProps {
  sessionToken: SessionToken | null;
  handoffUrl: string;
  participants: ParticipantRecord[];
  onRefreshToken?: () => void;
  compact?: boolean;
  className?: string;
}

const STEPS = [
  "This is FOR YOU — lets you continue this chat on another device you own",
  "Scan this QR on your other device (phone/laptop) to join the same room",
  "Or go to /handoff on your other device and enter the code + Room ID",
  "New messages from that point forward will appear on both devices",
];

export function DeviceHandoffPanel({
  sessionToken,
  handoffUrl,
  participants,
  onRefreshToken,
  compact = false,
  className,
}: DeviceHandoffPanelProps) {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [tokenProgress, setTokenProgress] = useState(100);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showSteps, setShowSteps] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Generate QR as a data URL (PNG) — avoids SVG sizing issues entirely
  useEffect(() => {
    if (!handoffUrl) return;
    setQrDataUrl("");
    QRCodeLib.toDataURL(handoffUrl, {
      type: "image/png",
      margin: 2,
      width: 180,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [handoffUrl]);

  // Live countdown
  useEffect(() => {
    if (!sessionToken) return;
    const tick = () => {
      const total = sessionToken.expiresAt - sessionToken.createdAt;
      const remaining = Math.max(0, sessionToken.expiresAt - Date.now());
      setTokenProgress((remaining / total) * 100);
      setSecondsLeft(Math.floor(remaining / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessionToken]);

  const copyCode = async () => {
    if (!sessionToken) return;
    await navigator.clipboard.writeText(sessionToken.token);
    setCopiedCode(true);
    toast({ title: "Code copied!", description: "Paste it on your other device." });
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const copyLink = async () => {
    if (!handoffUrl) return;
    await navigator.clipboard.writeText(handoffUrl);
    setCopiedLink(true);
    toast({ title: "Link copied!", description: "Open this link on your other device." });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRefresh = async () => {
    if (!onRefreshToken || refreshing) return;
    setRefreshing(true);
    setQrDataUrl("");
    await onRefreshToken();
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (!sessionToken) return null;

  const onlineDevices = participants.filter((p) => p.online).length;
  const isConnected = onlineDevices >= 2;
  const isExpiringSoon = tokenProgress < 20;
  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card text-card-foreground overflow-hidden shadow-sm",
        isConnected ? "border-green-500/40" : "border-border/60",
        className
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/30">
        <div className="flex items-center gap-2">
          <Smartphone className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
            Open on YOUR other device
          </span>
        </div>

        {/* Status pill */}
        {isConnected ? (
          <div className="flex items-center gap-1.5 rounded-full bg-green-500/15 border border-green-500/30 px-2.5 py-0.5">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span className="text-[10px] font-bold text-green-500">Synced</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full bg-muted border border-border px-2.5 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-medium text-muted-foreground">Waiting</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">

        {/* ── Connected banner ── */}
        <AnimatePresence>
          {isConnected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl bg-green-500/10 border border-green-500/20 px-3 py-2 flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                {onlineDevices} devices connected — session is synced
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Handoff code row ── */}
        <div className="rounded-xl bg-muted/60 border border-border/50 px-3 py-2.5 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
              Handoff code
            </p>
            {/* Full code on one line — monospaced, wide letter-spacing */}
            <p className="font-mono font-black text-base leading-none tracking-[0.15em] text-foreground select-all">
              {sessionToken.token}
            </p>
          </div>
          <button
            onClick={copyCode}
            className="shrink-0 h-8 w-8 rounded-lg bg-background border border-border/60 flex items-center justify-center hover:bg-accent transition-colors"
            aria-label="Copy code"
          >
            {copiedCode
              ? <Check className="h-3.5 w-3.5 text-green-500" />
              : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
        </div>

        {/* Room ID hint — shown so users can copy it for manual entry */}
        <div className="rounded-xl bg-muted/40 border border-border/30 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Room ID (needed for manual entry)</p>
          <p className="font-mono text-[11px] text-foreground/70 break-all select-all leading-relaxed">
            {sessionToken.roomId}
          </p>
        </div>

        {/* ── QR code ── centered, constrained, never overflows */}
        <div className="flex justify-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Handoff QR code"
              className="rounded-xl border border-border/40 shadow-sm"
              style={{ width: 140, height: 140, imageRendering: "pixelated" }}
            />
          ) : (
            <div
              className="rounded-xl bg-muted border border-border/40 flex items-center justify-center"
              style={{ width: 140, height: 140 }}
            >
              <RefreshCw className="h-6 w-6 text-muted-foreground animate-spin" />
            </div>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="flex-1 h-9 rounded-xl bg-primary/10 border border-primary/25 text-[11px] font-bold text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5"
          >
            {copiedLink
              ? <><Check className="h-3.5 w-3.5" /> Copied!</>
              : <><Link2 className="h-3.5 w-3.5" /> Copy link</>}
          </button>
          {onRefreshToken && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-9 w-9 rounded-xl bg-muted border border-border/50 flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-40"
              aria-label="Generate new code"
              title="New code"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5 text-muted-foreground", refreshing && "animate-spin")}
              />
            </button>
          )}
        </div>

        {/* ── Expiry bar ── */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              Expires in{" "}
              <span
                className={cn(
                  "font-bold tabular-nums ml-0.5",
                  isExpiringSoon ? "text-destructive" : "text-foreground"
                )}
              >
                {formatTime(secondsLeft)}
              </span>
            </div>
            {isExpiringSoon && onRefreshToken && (
              <button
                onClick={handleRefresh}
                className="text-[10px] font-bold text-destructive hover:underline"
              >
                Refresh
              </button>
            )}
          </div>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                tokenProgress > 50
                  ? "bg-primary"
                  : tokenProgress > 20
                  ? "bg-amber-500"
                  : "bg-destructive"
              )}
              animate={{ width: `${tokenProgress}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>

        {/* ── How to use (collapsible) ── */}
        <div className="rounded-xl border border-border/40 overflow-hidden">
          <button
            onClick={() => setShowSteps((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 bg-muted/40 hover:bg-muted/70 transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              How to use
            </span>
            {showSteps
              ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>

          <AnimatePresence initial={false}>
            {showSteps && (
              <motion.div
                key="steps"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="px-3 py-3 space-y-2 bg-background/40">
                  {STEPS.map((text, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="shrink-0 h-4 w-4 rounded-full bg-primary/15 text-primary text-[9px] font-black flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{text}</p>
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground/50 pt-1 border-t border-border/20">
                    ✓ No login · ✓ Auto-expires · ✓ One-time use
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
