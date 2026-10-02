import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkShareCodeRateLimit } from "../services/fileSharingService";
import { KeyRound, ArrowRight, ShieldAlert, Sparkles, QrCode, Camera } from "lucide-react";
import { toast } from "sonner";
import QrScanner from "@/components/chat/QrScanner";

interface EnterShareCodeCardProps {
  onAccessCode: (code: string) => void;
  onBeamCode?: (code: string) => void;
  isSubmitting?: boolean;
}

export const EnterShareCodeCard: React.FC<EnterShareCodeCardProps> = ({
  onAccessCode,
  onBeamCode,
  isSubmitting = false,
}) => {
  const [code, setCode] = useState("");
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) {
      toast.error("Please enter a share code or Beam PIN.");
      return;
    }

    // Check if it's a Beam code (4 chars or BEAM-...)
    if (clean.startsWith("BEAM-") || clean.length === 4) {
      if (onBeamCode) {
        onBeamCode(clean.replace(/^BEAM-/, ""));
        return;
      }
    }

    // Check rate limit
    const rateLimit = checkShareCodeRateLimit();
    if (rateLimit.isBlocked) {
      const msg = `Too many failed attempts. Please wait ${rateLimit.remainingSeconds} seconds before trying again.`;
      setRateLimitMessage(msg);
      toast.error(msg);
      return;
    }

    setRateLimitMessage(null);
    onAccessCode(clean);
  };

  const handleQrScanSuccess = (decodedText: string) => {
    let scannedCode = decodedText.trim().toUpperCase();

    // 1. Check if decoded text is a Live Beam Drop QR (e.g. ?beam=7K9M or /file-sharing?beam=...)
    const beamMatch = decodedText.match(/[?&]beam=([A-Za-z0-9-]+)/i) || decodedText.match(/BEAM-([A-Za-z0-9]+)/i);
    if (beamMatch) {
      const beamPin = beamMatch[1].toUpperCase().replace(/^BEAM-/, "");
      toast.success(`⚡ Live Beam QR Scanned: ${beamPin}`);
      setShowScanner(false);
      if (onBeamCode) {
        onBeamCode(beamPin);
      } else {
        onAccessCode(beamPin);
      }
      return;
    }

    // 2. Check if decoded text is a standard share URL with ?code= or /share/
    const urlMatch = decodedText.match(/[?&]code=([A-Za-z0-9]{6})/i) || decodedText.match(/\/share\/([A-Za-z0-9]{6})/i);
    if (urlMatch) {
      scannedCode = urlMatch[1].toUpperCase();
    } else if (scannedCode.length > 6) {
      // Extract first 6 alphanumeric characters
      const cleanMatch = scannedCode.match(/[A-Z0-9]{6}/);
      if (cleanMatch) scannedCode = cleanMatch[0];
    }

    if (scannedCode.length === 6) {
      toast.success(`✅ QR Code Scanned: ${scannedCode}`);
      setShowScanner(false);
      onAccessCode(scannedCode);
    } else {
      toast.error("Invalid QR Code. Please scan a valid File Share QR Code.");
    }
  };

  return (
    <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center text-xl shadow-inner shrink-0">
            <KeyRound className="h-6 w-6" />
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-display font-bold text-foreground">
              Enter Share Code
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter code or scan QR code with camera to access files.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowScanner((prev) => !prev)}
          className="rounded-xl border-primary/30 text-primary hover:bg-primary/10 gap-1.5 text-xs font-semibold shrink-0"
        >
          <QrCode className="h-4 w-4" />
          <span className="hidden sm:inline">{showScanner ? "Close Camera" : "Scan QR"}</span>
        </Button>
      </div>

      {showScanner && (
        <div className="p-4 rounded-2xl bg-secondary/50 border border-primary/20 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Camera className="h-4 w-4 text-primary" /> Camera QR Scanner
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowScanner(false)}
              className="h-6 text-[10px] text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
          <QrScanner
            onScanSuccess={handleQrScanSuccess}
            onClose={() => setShowScanner(false)}
          />
        </div>
      )}

      {rateLimitMessage && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{rateLimitMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 pt-1">
        <div className="relative">
          <Input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. K7X4P9"
            className="h-12 text-lg font-mono tracking-widest text-center uppercase font-bold rounded-2xl border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={isSubmitting || !code.trim()}
            className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-primary to-purple-600 font-extrabold text-white text-xs shadow-md shadow-primary/20 gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all"
          >
            {isSubmitting ? "Validating Code..." : "Access File"}
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowScanner(true)}
            className="h-11 px-4 rounded-2xl border border-border/60 text-xs font-bold gap-1.5"
            title="Scan QR Code with Camera"
          >
            <QrCode className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Scan QR</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
