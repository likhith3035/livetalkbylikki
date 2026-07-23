import React, { useState } from "react";
import { Flame, Trophy, Award, QrCode, Share2, Sparkles, X, Check } from "lucide-react";
import { useGamification } from "@/hooks/use-gamification";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const GamificationWidget: React.FC = () => {
  const { xp, level, streak, badges, progressPercent } = useGamification();
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://livetalkbylikki.netlify.app";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Sleek Top Banner Bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-secondary/30 border border-border/40 text-xs font-semibold backdrop-blur-md">
        {/* Daily Streak */}
        <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-bold" title="Daily Active Streak">
          <Flame className="h-4 w-4 fill-amber-500/20 animate-bounce" />
          <span>{streak}d Streak</span>
        </div>

        <div className="h-3 w-px bg-border/60" />

        {/* Level & XP Progress */}
        <button
          onClick={() => setShowBadgesModal(true)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left cursor-pointer"
          title="Click to view Achievements & Badges"
        >
          <div className="flex items-center gap-1 text-primary font-bold">
            <Trophy className="h-3.5 w-3.5" />
            <span>Lvl {level}</span>
          </div>
          <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden border border-border/40">
            <div className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{xp} XP</span>
        </button>

        <div className="h-3 w-px bg-border/60" />

        {/* Share QR Code Button */}
        <button
          onClick={() => setShowQrModal(true)}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all text-[11px] font-bold"
        >
          <QrCode className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Share App</span>
        </button>
      </div>

      {/* Badges Modal */}
      <Dialog open={showBadgesModal} onOpenChange={setShowBadgesModal}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" /> Achievements & Badges
            </DialogTitle>
            <DialogDescription>
              Earn XP by starting chats, maintaining streaks, and exploring features!
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                  b.unlocked
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-border/30 bg-secondary/10 opacity-50 grayscale"
                }`}
              >
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <p className="text-xs font-bold text-foreground leading-tight">{b.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share QR Code Modal */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-sm rounded-3xl p-6 text-center space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5 text-primary" /> Share LiveTalk
            </DialogTitle>
            <DialogDescription>
              Scan with any phone camera to launch LiveTalk instantly!
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-white rounded-2xl inline-block mx-auto border shadow-inner">
            <QRCodeSVG value={shareUrl} size={180} level="H" includeMargin />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 text-xs px-3 py-2.5 rounded-xl border bg-secondary/30 font-mono text-muted-foreground select-all"
            />
            <Button onClick={handleCopy} size="sm" className="rounded-xl gap-1">
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
