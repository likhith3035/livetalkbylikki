import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Crown,
  Flame,
  Star,
  TrendingUp,
  Trophy,
  ExternalLink,
  Sparkles,
  QrCode,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { GameRoomState, GamerProfile } from "../types";
import { getGamerProfile, getXpForNextLevel } from "../services/gameProgressionService";
import { gameAudio } from "../services/gameSoundService";
import { gameHaptics } from "../services/gameHapticsService";

interface ShareVictoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: GameRoomState;
  myPlayerId: string;
  gameTitle: string;
}

export const ShareVictoryCardModal: React.FC<ShareVictoryCardModalProps> = ({
  isOpen,
  onClose,
  room,
  myPlayerId,
  gameTitle,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const profile: GamerProfile = getGamerProfile();
  const xpNeeded = getXpForNextLevel(profile.level);
  const streak = Math.max(profile.streak || 1, 1);
  const xpEarned = 100 + (streak >= 3 ? Math.round(80 * (streak >= 5 ? 1.5 : 1.25)) : 0);

  const isHost = room.players.host.id === myPlayerId;
  const myPlayer = isHost ? room.players.host : room.players.guest;
  const playerName = myPlayer?.name || profile.nickname || "Likhith";
  const playerAvatar = myPlayer?.avatar || profile.avatar || "👑";

  const inviteUrl = `${window.location.origin}/games?room=${room.roomCode}`;
  const shareText = `🔥 I just crushed a ${streak}-win streak in ${gameTitle} on IncogTalk Arcade!\n\nCan you beat me? Duel me now:\n${inviteUrl}`;

  // Copy Duel Link
  const handleCopyLink = async () => {
    gameHaptics.light();
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      gameAudio.playClick();
      toast.success("Duel link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Could not copy link to clipboard.");
    }
  };

  // WhatsApp Direct Share
  const handleShareWhatsApp = () => {
    gameHaptics.medium();
    const encoded = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  // Instagram Story Share
  const handleShareInstagram = async () => {
    gameHaptics.medium();
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Caption copied! Opening Instagram...");
      window.open("https://www.instagram.com/", "_blank");
    } catch {
      window.open("https://www.instagram.com/", "_blank");
    }
  };

  // Canvas Generation & Download (1080x1920 HD vertical story card)
  const handleDownloadImage = async () => {
    gameHaptics.success();
    setIsExporting(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas context not available");
      }

      // 1. Dark Cyber Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
      bgGrad.addColorStop(0, "#080914");
      bgGrad.addColorStop(0.5, "#0b0d1e");
      bgGrad.addColorStop(1, "#05060b");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // 2. Peripheral Lighting & Glows
      const cyanGlow = ctx.createRadialGradient(250, 400, 50, 250, 400, 600);
      cyanGlow.addColorStop(0, "rgba(56, 189, 248, 0.18)");
      cyanGlow.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = cyanGlow;
      ctx.fillRect(0, 0, 1080, 1920);

      const blueGlow = ctx.createRadialGradient(850, 1000, 50, 850, 1000, 650);
      blueGlow.addColorStop(0, "rgba(99, 102, 241, 0.18)");
      blueGlow.addColorStop(1, "rgba(99, 102, 241, 0)");
      ctx.fillStyle = blueGlow;
      ctx.fillRect(0, 0, 1080, 1920);

      // 3. Top Header Branding
      ctx.textAlign = "center";
      ctx.font = "bold 44px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("💬 IncogTalk", 540, 130);

      ctx.font = "bold 24px sans-serif";
      ctx.fillStyle = "#38bdf8";
      ctx.letterSpacing = "6px";
      ctx.fillText("A R C A D E", 540, 175);
      ctx.letterSpacing = "0px";

      // Top corner playful handwritten notes
      ctx.textAlign = "left";
      ctx.font = "italic 22px sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("GOOD GAMES", 80, 210);
      ctx.fillText("BETTER PEOPLE :)", 80, 240);

      ctx.textAlign = "right";
      ctx.fillText("PLAY · CHAT", 1000, 210);
      ctx.fillText("MAKE FRIENDS", 1000, 240);

      // 4. Crown Doodle
      ctx.textAlign = "center";
      ctx.font = "64px sans-serif";
      ctx.fillText("👑", 540, 290);

      // 5. Giant Brush "VICTORY"
      ctx.font = "900 135px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 35;
      ctx.fillText("VICTORY", 540, 420);
      ctx.shadowBlur = 0; // reset

      // 6. Win Streak Blue Ribbon
      const ribbonY = 460;
      const ribbonGrad = ctx.createLinearGradient(240, ribbonY, 840, ribbonY + 60);
      ribbonGrad.addColorStop(0, "#2563eb");
      ribbonGrad.addColorStop(1, "#0284c7");
      ctx.fillStyle = ribbonGrad;
      ctx.beginPath();
      ctx.roundRect(240, ribbonY, 600, 70, 35);
      ctx.fill();

      ctx.font = "900 36px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${streak} WIN STREAK 🔥`, 540, ribbonY + 48);

      // 7. Game Subtitle
      ctx.font = "900 32px sans-serif";
      ctx.fillStyle = "#93c5fd";
      ctx.fillText(gameTitle.toUpperCase().split("").join(" "), 540, 580);

      // 8. 3 Stat Chips (XP, Level, Wins)
      const chipW = 280;
      const chipH = 120;
      const chipY = 620;
      const chips = [
        { label: "XP EARNED", val: `+${xpEarned} XP`, icon: "⭐" },
        { label: "LEVEL PROGRESS", val: `LVL ${profile.level}`, icon: "📊" },
        { label: "IN A ROW", val: `${streak} WINS`, icon: "🏆" },
      ];

      chips.forEach((c, idx) => {
        const x = 90 + idx * (chipW + 40);
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, chipY, chipW, chipH, 20);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.font = "bold 32px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`${c.icon} ${c.val}`, x + chipW / 2, chipY + 52);

        ctx.font = "bold 18px sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(c.label, x + chipW / 2, chipY + 90);
      });

      // 9. 3D Game Visual Illustration (Connect 4 Board Matrix)
      const boardX = 220;
      const boardY = 790;
      const boardW = 640;
      const boardH = 500;

      // Board glow
      const gridGlow = ctx.createRadialGradient(540, 1040, 50, 540, 1040, 400);
      gridGlow.addColorStop(0, "rgba(59, 130, 246, 0.2)");
      gridGlow.addColorStop(1, "rgba(59, 130, 246, 0)");
      ctx.fillStyle = gridGlow;
      ctx.fillRect(boardX - 40, boardY - 40, boardW + 80, boardH + 80);

      // Cabinet
      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(boardX, boardY, boardW, boardH, 36);
      ctx.fill();
      ctx.stroke();

      // Side annotations
      ctx.textAlign = "right";
      ctx.font = "italic 24px sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("STRATEGY", 180, 960);
      ctx.fillText("PATIENCE", 180, 995);
      ctx.fillText("VICTORY", 180, 1030);

      ctx.textAlign = "left";
      ctx.font = "bold italic 26px sans-serif";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText("CAN YOU", 900, 980);
      ctx.fillText("BEAT ME?", 900, 1015);

      // Grid chips simulation
      const cols = 7;
      const rows = 6;
      const startGx = boardX + 50;
      const startGy = boardY + 45;
      const cellGap = 77;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = startGx + c * cellGap;
          const cy = startGy + r * cellGap;

          // Determine chip color pattern (winning diagonal)
          let chipColor = "rgba(255, 255, 255, 0.08)";
          if ((r === 5 && c === 2) || (r === 4 && c === 3) || (r === 3 && c === 4) || (r === 2 && c === 5)) {
            chipColor = "#ef4444"; // Red winning line
          } else if ((r === 5 && (c === 1 || c === 3 || c === 4)) || (r === 4 && c === 2) || (r === 3 && c === 3)) {
            chipColor = "#eab308"; // Yellow tokens
          } else if (r === 5 && (c === 0 || c === 5)) {
            chipColor = "#ef4444";
          }

          ctx.fillStyle = chipColor;
          ctx.beginPath();
          ctx.arc(cx, cy, 28, 0, Math.PI * 2);
          ctx.fill();

          if (chipColor !== "rgba(255, 255, 255, 0.08)") {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        }
      }

      // 10. Player Profile Callout Box
      const pBoxY = 1340;
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(140, pBoxY, 800, 220, 30);
      ctx.fill();
      ctx.stroke();

      // Avatar circle
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(230, pBoxY + 70, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.font = "40px sans-serif";
      ctx.fillText(playerAvatar, 230, pBoxY + 84);

      // Player Name & Quote
      ctx.textAlign = "left";
      ctx.font = "900 36px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`@${playerName}`, 300, pBoxY + 62);

      ctx.font = "italic 24px sans-serif";
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(`“I just crushed a ${streak}-win streak in ${gameTitle} on IncogTalk Arcade!”`, 300, pBoxY + 98);

      // Duel Me Now Button Pill
      ctx.fillStyle = "#2563eb";
      ctx.beginPath();
      ctx.roundRect(180, pBoxY + 135, 720, 60, 30);
      ctx.fill();

      ctx.textAlign = "center";
      ctx.font = "bold 26px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`🔗 DUEL ME NOW · ${window.location.hostname}/games >`, 540, pBoxY + 175);

      // 11. Footer Branding
      ctx.font = "bold 24px sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("SAME GAMES. NEW FRIENDS.  ——  GAME ON, ALWAYS", 540, 1840);

      // Download triggered
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Image generation failed");

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `incogtalk-${gameTitle.toLowerCase().replace(/\s+/g, "-")}-victory-streak.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("HD Victory Card downloaded!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to generate victory card image.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[94vw] sm:max-w-lg p-0 overflow-hidden bg-black/95 border border-primary/30 rounded-3xl shadow-2xl backdrop-blur-2xl max-h-[92vh] flex flex-col">
        {/* Scrollable Poster Container */}
        <div className="overflow-y-auto p-4 sm:p-6 no-scrollbar flex-1 flex flex-col items-center">
          {/* 9:16 Vertical Card Preview */}
          <div
            ref={cardRef}
            className="w-full max-w-sm aspect-[9/16] rounded-3xl relative overflow-hidden flex flex-col items-center justify-between p-4 sm:p-5 border-2 border-primary/40 shadow-2xl select-none"
            style={{
              background: "linear-gradient(180deg, #090b1a 0%, #0d1226 50%, #05060b 100%)",
            }}
          >
            {/* Ambient Corner Lighting */}
            <div className="absolute top-0 left-0 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-16 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* TOP BAR: Logo & Playful Badges */}
            <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-400 z-10">
              <div className="text-left leading-tight italic">
                <span>GOOD GAMES</span>
                <br />
                <span className="text-slate-300">BETTER PEOPLE :)</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="text-xs font-black tracking-wider text-white flex items-center gap-1">
                  <span>💬 IncogTalk</span>
                </div>
                <span className="text-[9px] font-extrabold tracking-[0.25em] text-cyan-400">ARCADE</span>
              </div>

              <div className="text-right leading-tight italic">
                <span>PLAY · CHAT</span>
                <br />
                <span className="text-cyan-400 font-black">ANOTHER WIN ✓</span>
              </div>
            </div>

            {/* HERO TITLE: Giant Victory & Streak Ribbon */}
            <div className="flex flex-col items-center text-center my-1 z-10 w-full">
              <span className="text-2xl animate-bounce">👑</span>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(56,189,248,0.6)]">
                VICTORY
              </h1>

              {/* Blue Streak Ribbon */}
              <div className="mt-1 px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-blue-500/30 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>{streak} WIN STREAK</span>
                <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
              </div>

              {/* Game Subtitle */}
              <span className="mt-1.5 text-[11px] font-black tracking-[0.3em] text-cyan-300 uppercase">
                {gameTitle}
              </span>
            </div>

            {/* STATS STRIP: 3 Frosted Glass Chips */}
            <div className="grid grid-cols-3 gap-1.5 w-full z-10 my-1">
              <div className="flex flex-col items-center p-2 rounded-2xl bg-white/[0.05] border border-white/10 text-center">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 mb-0.5" />
                <span className="text-xs font-black text-white">+{xpEarned} XP</span>
                <span className="text-[9px] font-semibold text-slate-400">XP EARNED</span>
              </div>

              <div className="flex flex-col items-center p-2 rounded-2xl bg-white/[0.05] border border-white/10 text-center">
                <TrendingUp className="w-4 h-4 text-emerald-400 mb-0.5" />
                <span className="text-xs font-black text-white">LVL {profile.level}</span>
                <span className="text-[9px] font-semibold text-slate-400">LEVEL UP!</span>
              </div>

              <div className="flex flex-col items-center p-2 rounded-2xl bg-white/[0.05] border border-white/10 text-center">
                <Trophy className="w-4 h-4 text-yellow-400 fill-yellow-400 mb-0.5" />
                <span className="text-xs font-black text-white">{streak} WINS</span>
                <span className="text-[9px] font-semibold text-slate-400">IN A ROW</span>
              </div>
            </div>

            {/* 3D GAME CENTERPIECE (Connect 4 Board Simulation) */}
            <div className="relative w-full max-w-[260px] aspect-[4/3] rounded-2xl bg-slate-900/90 border-2 border-cyan-500/50 shadow-2xl p-2.5 flex flex-col justify-between my-1 z-10">
              <div className="grid grid-cols-7 gap-1 h-full w-full place-items-center">
                {Array.from({ length: 42 }).map((_, idx) => {
                  const r = Math.floor(idx / 7);
                  const c = idx % 7;
                  const isWinChip =
                    (r === 5 && c === 2) ||
                    (r === 4 && c === 3) ||
                    (r === 3 && c === 4) ||
                    (r === 2 && c === 5);
                  const isOppChip =
                    (r === 5 && (c === 1 || c === 3 || c === 4)) ||
                    (r === 4 && c === 2) ||
                    (r === 3 && c === 3);

                  return (
                    <div
                      key={idx}
                      className={`w-4 sm:w-5 h-4 sm:h-5 rounded-full border transition-all ${
                        isWinChip
                          ? "bg-red-500 border-red-300 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                          : isOppChip
                          ? "bg-amber-400 border-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.7)]"
                          : "bg-slate-950/80 border-slate-800"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Side Callout Labels */}
              <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-[9px] font-bold italic text-slate-500 -rotate-90 hidden sm:block">
                STRATEGY
              </span>
              <span className="absolute -right-7 top-1/2 -translate-y-1/2 text-[9px] font-black italic text-cyan-400 rotate-90 hidden sm:block">
                BEAT ME?
              </span>
            </div>

            {/* PLAYER PROFILE CARD & DUEL CTA */}
            <div className="w-full p-2.5 rounded-2xl bg-slate-900/80 border border-white/15 backdrop-blur-md flex flex-col gap-1.5 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-cyan-400 flex items-center justify-center text-base shadow-sm">
                  {playerAvatar}
                </div>
                <div className="flex flex-col text-left leading-tight truncate">
                  <span className="text-xs font-black text-white truncate">@{playerName}</span>
                  <span className="text-[10px] text-slate-300 italic truncate">
                    “Crushed a {streak}-win streak in {gameTitle}!”
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold shadow-md">
                <span className="truncate">🔗 DUEL ME NOW · {window.location.hostname}</span>
                <span className="shrink-0">&gt;</span>
              </div>
            </div>

            {/* QR CODE & FOOTER */}
            <div className="w-full flex items-center justify-between mt-1 z-10">
              <div className="text-[9px] font-semibold text-slate-400 text-left">
                <span>SAME GAMES. NEW FRIENDS.</span>
                <br />
                <span className="text-[8px] text-slate-500">GAME ON, ALWAYS</span>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white shadow-md">
                <QRCodeSVG value={inviteUrl} size={42} level="M" />
                <div className="text-[8px] font-black text-slate-900 leading-tight">
                  SCAN
                  <br />
                  TO PLAY
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex flex-col gap-2.5">
          <div className="grid grid-cols-4 gap-2">
            {/* WhatsApp */}
            <Button
              variant="outline"
              onClick={handleShareWhatsApp}
              className="flex flex-col items-center gap-1 h-auto py-2 px-1 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 cursor-pointer"
            >
              <span className="text-lg">💬</span>
              <span className="text-[10px] font-bold leading-none">WhatsApp</span>
            </Button>

            {/* Instagram */}
            <Button
              variant="outline"
              onClick={handleShareInstagram}
              className="flex flex-col items-center gap-1 h-auto py-2 px-1 rounded-2xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border-pink-500/30 cursor-pointer"
            >
              <span className="text-lg">📸</span>
              <span className="text-[10px] font-bold leading-none">Instagram</span>
            </Button>

            {/* Save Image */}
            <Button
              variant="outline"
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="flex flex-col items-center gap-1 h-auto py-2 px-1 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30 cursor-pointer"
            >
              {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              <span className="text-[10px] font-bold leading-none">Save Card</span>
            </Button>

            {/* Copy Link */}
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-1 h-auto py-2 px-1 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/30 cursor-pointer"
            >
              {copiedLink ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              <span className="text-[10px] font-bold leading-none">{copiedLink ? "Copied!" : "Copy Link"}</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-xs text-muted-foreground hover:text-white py-1 cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
