import { useState, useEffect } from "react";
import QRCodeLib from "qrcode";
import { motion } from "framer-motion";
import { Copy, Check, Smartphone, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { SessionToken } from "./types";
import type { ParticipantRecord } from "./types";

interface DeviceHandoffPanelProps {
  sessionToken: SessionToken | null;
  handoffUrl: string;
  participants: ParticipantRecord[];
  onRefreshToken?: () => void;
  compact?: boolean;
  className?: string;
}

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
  const [qrSvg, setQrSvg] = useState("");
  const [tokenProgress, setTokenProgress] = useState(100);

  useEffect(() => {
    if (!handoffUrl) return;
    QRCodeLib.toString(handoffUrl, { type: "svg", margin: 1, width: compact ? 120 : 160 })
      .then(setQrSvg)
      .catch(() => setQrSvg(""));
  }, [handoffUrl, compact]);

  // Continuously update the expiry progress bar
  useEffect(() => {
    if (!sessionToken) return;
    const tick = () => {
      const total = sessionToken.expiresAt - sessionToken.createdAt;
      const elapsed = Date.now() - sessionToken.createdAt;
      setTokenProgress(Math.max(0, Math.min(100, 100 - (elapsed / total) * 100)));
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [sessionToken]);

  const copyCode = async () => {
    if (!sessionToken) return;
    await navigator.clipboard.writeText(sessionToken.token);
    setCopied(true);
    toast({ title: "Handoff code copied", description: "Open LiveTalk on your other device and enter this code." });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!sessionToken) return null;

  return (
    <div className={cn("rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-4 space-y-3", className)}>
      <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
        <Smartphone className="h-3.5 w-3.5" />
        Cross-device sync
      </div>

      {!compact && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Scan or enter the handoff code on another device. Session tokens expire automatically — no account needed.
        </p>
      )}

      <div className={cn("flex gap-4", compact ? "flex-row items-center" : "flex-col sm:flex-row")}>
        {qrSvg && (
          <div
            className="shrink-0 rounded-xl bg-white p-2 shadow-inner mx-auto sm:mx-0"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        )}

        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-secondary/50 px-3 py-2.5 border border-border/30">
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Handoff code</p>
              <p className="font-mono text-lg font-bold tracking-[0.2em] text-foreground truncate">
                {sessionToken.token}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={copyCode}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {participants.length > 0 && (
            <div className="text-[10px] text-muted-foreground">
              {participants.filter((p) => p.online).length} device(s) connected
            </div>
          )}

          {onRefreshToken && (
            <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={onRefreshToken}>
              <QrCode className="h-3 w-3 mr-1.5" />
              New handoff code
            </Button>
          )}
        </div>
      </div>

      <motion.div
        className="h-0.5 rounded-full bg-primary/20 overflow-hidden"
        initial={false}
      >
        <motion.div
          className="h-full bg-primary/60"
          animate={{ width: `${tokenProgress}%` }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>
    </div>
  );
}
