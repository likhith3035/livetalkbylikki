import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2, MessageCircle, Send, QrCode, ScanLine, Eye, Swords } from "lucide-react";
import { toast } from "sonner";
import { gameAudio } from "../services/gameSoundService";
import QrScanner from "@/components/chat/QrScanner";

interface QRShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  gameTitle: string;
  onScanJoin?: (scannedCode: string) => void;
}

export const QRShareModal: React.FC<QRShareModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  gameTitle,
  onScanJoin,
}) => {
  const [tab, setTab] = useState<"play" | "spectate">("play");
  const [copied, setCopied] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const inviteUrl = `${window.location.origin}/games?room=${roomCode}`;
  const spectatorUrl = `${window.location.origin}/games?room=${roomCode}&spectate=true`;
  const activeUrl = tab === "play" ? inviteUrl : spectatorUrl;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    gameAudio.playClick();
    toast.success(`Room Code ${roomCode} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeUrl);
    gameAudio.playClick();
    toast.success(tab === "play" ? "Player invite link copied!" : "Spectator watch link copied!");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: tab === "play" ? `Duel me in ${gameTitle} on IncogTalk!` : `Watch live ${gameTitle} match on IncogTalk!`,
          text: tab === "play" ? `Join my game room on IncogTalk! Room Code: ${roomCode}` : `Watch live match! Room: ${roomCode}`,
          url: activeUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      tab === "play"
        ? `🎮 Duel me in ${gameTitle} on IncogTalk Arcade!\n\nTap to join: ${inviteUrl}\nRoom Code: ${roomCode}`
        : `👁️ Watch our live ${gameTitle} match on IncogTalk Arcade!\n\nTap to spectate: ${spectatorUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleTelegramShare = () => {
    const text = encodeURIComponent(
      tab === "play" ? `🎮 Play ${gameTitle} with me on IncogTalk Arcade!` : `👁️ Watch our live ${gameTitle} match!`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(activeUrl)}&text=${text}`, "_blank");
  };

  return (
    <>
      <Dialog open={isOpen && !showScanner} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-[92vw] sm:max-w-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/50 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar touch-manipulation">
          <DialogHeader className="text-center">
            {/* Share Tab Switcher */}
            <div className="flex items-center justify-center gap-1.5 p-1 rounded-2xl bg-muted/50 border border-border/40 mx-auto mb-2 w-fit">
              <button
                onClick={() => setTab("play")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tab === "play" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Player Invite</span>
              </button>

              <button
                onClick={() => setTab("spectate")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tab === "spectate" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Spectator Link</span>
              </button>
            </div>

            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              {tab === "play" ? "Invite Opponent" : "Share Spectator Link"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {tab === "play"
                ? `Scan QR or share code to start your 1v1 battle in ${gameTitle}.`
                : "Friends can scan this QR code to watch your match live with real-time cheering."}
            </DialogDescription>
          </DialogHeader>

          {/* QR Card Container */}
          <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-muted/40 border border-border/30 my-2">
            <div className="p-3 bg-white rounded-2xl shadow-md">
              <QRCodeSVG
                value={activeUrl}
                size={160}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* Room Code Badge */}
            <div className="mt-3 sm:mt-4 flex items-center gap-2">
              <div className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-background/80 border border-border/40 text-base sm:text-lg font-black tracking-widest text-primary">
                {roomCode}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
                className="h-9 w-9 rounded-xl border-border/40 hover:bg-primary/10 cursor-pointer"
                title="Copy Room Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsAppShare}
              className="rounded-xl border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500 text-[11px] sm:text-xs font-semibold gap-1 sm:gap-1.5 cursor-pointer px-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTelegramShare}
              className="rounded-xl border-sky-500/30 hover:bg-sky-500/10 text-sky-500 text-[11px] sm:text-xs font-semibold gap-1 sm:gap-1.5 cursor-pointer px-1.5"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Telegram</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNativeShare}
              className="rounded-xl border-primary/30 hover:bg-primary/10 text-primary text-[11px] sm:text-xs font-semibold gap-1 sm:gap-1.5 cursor-pointer px-1.5"
            >
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Share</span>
            </Button>
          </div>

          {/* Scan QR alternative */}
          {onScanJoin && (
            <div className="pt-2 border-t border-border/30 flex justify-center">
              <button
                onClick={() => setShowScanner(true)}
                className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1.5 transition-colors"
              >
                <ScanLine className="w-3.5 h-3.5 text-primary" />
                Want to scan friend's QR instead?
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Camera QR Scanner Integration */}
      <QrScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={(scannedText) => {
          setShowScanner(false);
          onClose();
          const urlMatch = scannedText.match(/[?&]room=([A-Za-z0-9]+)/);
          const codeToJoin = urlMatch ? urlMatch[1] : scannedText.trim();
          onScanJoin?.(codeToJoin);
        }}
      />
    </>
  );
};
