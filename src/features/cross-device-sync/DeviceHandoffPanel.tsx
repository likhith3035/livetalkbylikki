import { useState, useEffect } from "react";
import QRCodeLib from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Check, Smartphone, QrCode, RefreshCw,
  ChevronDown, ChevronUp, Wifi, CheckCircle2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  { num: "1", text: "Open LiveTalk on your other device (phone, tablet, PC)" },
  { num: "2", text: "Scan the QR code below with your camera, or copy the handoff code" },
  { num: "3", text: "On the other device, go to /handoff and paste the code" },
  { num: "4", text: "The session transfers instantly — no login needed" },
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
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [qrSvg, setQrSvg] = useState("");
  const [tokenProgress, setTokenProgress] = useState(100);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showSteps, setShowSteps] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // QR generation — consistent 200px regardless of compact mode
  useEffect(() => {
    if (!handoffUrl) return;
    QRCodeLib.toString(handoffUrl, { type: "svg", margin: 1, width: 200, errorCorrectionLevel: "M" })
      .then(setQrSvg)
      .catch(() => setQrSvg(""));
  }, [handoffUrl]);

  // Live expiry countdown
  useEffect(() => {
    if (!sessionToken) return;
    const tick = () => {
      const total = sessionToken.expiresAt - sessionToken.createdAt;
      const remaining = sessionToken.expiresAt - Date.now();
      const progress = Math.max(0, Math.min(100, (remaining / total) * 100));
      setTokenProgress(progress);
      setSecondsLeft(Math.max(0, Math.floor(remaining / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessionToken]);

  const copyCode = async () => {
    if (!sessionToken) return;
    await navigator.clipboard.writeText(sessionToken.token);
    setCopied(true);
    toast({ title: "Handoff code copied!", description: "Paste it on your other device at /handoff." });
    setTimeout(() => setCopied(false), 2500);
  };

  const copyLink = async () => {
    if (!handoffUrl) return;
    await navigator.clipboard.writeText(handoffUrl);
    setCopiedUrl(true);
    toast({ title: "Handoff link copied!", description: "Open this link on your other device." });
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleRefresh = async () => {
    if (!onRefreshToken || refreshing) return;
    setRefreshing(true);
    setQrSvg("");
    await onRefreshToken();
    setTimeout(() => setRefreshing(false), 800);
  };

  if (!sessionToken) return null;

  const onlineDevices = participants.filter((p) => p.online).length;
  const isConnected = onlineDevices >= 2;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const isExpiringSoon = tokenProgress < 25;

  return (
    <div className={cn(
      "rounded-2xl border bg-card/60 backdrop-blur-md overflow-hidden",
      isConnected ? "border-green-500/40" : "border-border/40",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Cross-device sync</span>
        </div>

        {/* Connection status badge */}
        <AnimatePresence mode="wait">
          {isConnected ? (
            <motion.div
              key="connected"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 rounded-full bg-green-500/15 border border-green-500/30 px-2.5 py-1"
            >
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-[10px] font-bold text-green-500">Connected</span>
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold text-primary">Waiting</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 space-y-4">
        {/* Connection success banner */}
        <AnimatePresence>
          {isConnected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl bg-green-500/10 border border-green-500/25 px-3 py-2.5 flex items-center gap-2.5"
            >
              <Wifi className="h-4 w-4 text-green-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-green-500">Session active on {onlineDevices} devices</p>
                <p className="text-[10px] text-muted-foreground">Your chat is synced across devices</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* QR + code side by side */}
        <div className="flex gap-3 items-start">
          {/* QR code — fixed square, never truncated */}
          <div className="shrink-0">
            {qrSvg ? (
              <div
                className="rounded-xl bg-white p-1.5 shadow-sm border border-border/20"
                style={{ width: 88, height: 88 }}
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : (
              <div
                className="rounded-xl bg-white/10 border border-border/20 flex items-center justify-center"
                style={{ width: 88, height: 88 }}
              >
                <QrCode className="h-6 w-6 text-muted-foreground animate-pulse" />
              </div>
            )}
          </div>

          {/* Code + actions */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Full handoff code — never truncated */}
            <div className="rounded-xl bg-secondary/60 border border-border/30 px-3 py-2.5">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Handoff code</p>
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-base font-black tracking-[0.18em] text-foreground select-all leading-none">
                  {sessionToken.token}
                </p>
                <button
                  onClick={copyCode}
                  className="shrink-0 h-7 w-7 rounded-lg bg-card flex items-center justify-center border border-border/40 hover:bg-primary/10 transition-colors"
                  aria-label="Copy code"
                >
                  {copied
                    ? <Check className="h-3.5 w-3.5 text-green-500" />
                    : <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  }
                </button>
              </div>
            </div>

            {/* Copy link + refresh */}
            <div className="flex gap-1.5">
              <button
                onClick={copyLink}
                className="flex-1 h-8 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5"
              >
                {copiedUrl ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedUrl ? "Copied!" : "Copy link"}
              </button>
              {onRefreshToken && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="h-8 w-8 rounded-lg bg-secondary/60 border border-border/30 flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-50"
                  aria-label="New handoff code"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", refreshing && "animate-spin")} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expiry progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                Code expires in{" "}
                <span className={cn(
                  "font-bold tabular-nums",
                  isExpiringSoon ? "text-destructive" : "text-foreground"
                )}>
                  {formatTime(secondsLeft)}
                </span>
              </span>
            </div>
            {isExpiringSoon && onRefreshToken && (
              <button
                onClick={handleRefresh}
                className="text-[10px] font-bold text-destructive hover:underline"
              >
                Refresh now
              </button>
            )}
          </div>
          <div className="h-1 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full transition-colors",
                tokenProgress > 50 ? "bg-primary" :
                tokenProgress > 25 ? "bg-amber-500" : "bg-destructive"
              )}
              animate={{ width: `${tokenProgress}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>

        {/* How to use — collapsible */}
        <div className="rounded-xl border border-border/30 overflow-hidden">
          <button
            onClick={() => setShowSteps((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              How to use
            </span>
            {showSteps
              ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            }
          </button>
          <AnimatePresence>
            {showSteps && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 py-3 space-y-2.5 bg-secondary/10">
                  {STEPS.map((step) => (
                    <div key={step.num} className="flex items-start gap-2.5">
                      <span className="shrink-0 h-5 w-5 rounded-full bg-primary/20 text-primary text-[10px] font-black flex items-center justify-center mt-0.5">
                        {step.num}
                      </span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{step.text}</p>
                    </div>
                  ))}
                  <div className="pt-1 border-t border-border/20">
                    <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                      ✓ No login required · ✓ Expires automatically · ✓ Single-use code
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
