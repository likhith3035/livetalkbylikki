import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkShareCodeRateLimit } from "../services/fileSharingService";
import { KeyRound, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface EnterShareCodeCardProps {
  onAccessCode: (code: string) => void;
  isSubmitting?: boolean;
}

export const EnterShareCodeCard: React.FC<EnterShareCodeCardProps> = ({
  onAccessCode,
  isSubmitting = false,
}) => {
  const [code, setCode] = useState("");
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) {
      toast.error("Please enter a 6-character share code.");
      return;
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

  return (
    <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center text-xl shadow-inner shrink-0">
          <KeyRound className="h-6 w-6" />
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-display font-bold text-foreground">
            Enter Share Code
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Have a 6-character share code? Enter it below to access shared files.
          </p>
        </div>
      </div>

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

        <Button
          type="submit"
          disabled={isSubmitting || !code.trim()}
          className="w-full h-11 rounded-2xl bg-gradient-to-r from-primary to-purple-600 font-extrabold text-white text-xs shadow-md shadow-primary/20 gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all"
        >
          {isSubmitting ? "Validating Code..." : "Access File"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};
