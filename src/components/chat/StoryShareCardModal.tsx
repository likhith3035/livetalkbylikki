import { useState, useRef, useEffect } from "react";
import QRCodeLib from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share2, X, Sparkles, QrCode, Image as ImageIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface StoryShareCardModalProps {
  roomCode: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StoryShareCardModal({ roomCode, isOpen, onClose }: StoryShareCardModalProps) {
  const { toast } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const roomUrl = typeof window !== "undefined" ? `${window.location.origin}/room/${roomCode}` : `https://incogtalk.netlify.app/room/${roomCode}`;

  useEffect(() => {
    if (!roomCode || !isOpen) return;
    QRCodeLib.toDataURL(roomUrl, {
      width: 400,
      margin: 1,
      color: {
        dark: "#ffffff",
        light: "#00000000",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Failed to generate QR for card", err));
  }, [roomCode, roomUrl, isOpen]);

  const generateCanvasImage = async (): Promise<Blob | null> => {
    const width = 1080;
    const height = 1920;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 1. Dark Background Gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, "#0a0518");
    bgGradient.addColorStop(0.5, "#0d0a26");
    bgGradient.addColorStop(1, "#05030a");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Neon Glow Spheres
    const glow1 = ctx.createRadialGradient(540, 400, 50, 540, 400, 600);
    glow1.addColorStop(0, "rgba(147, 51, 234, 0.4)");
    glow1.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow1;
    ctx.beginPath();
    ctx.arc(540, 400, 600, 0, Math.PI * 2);
    ctx.fill();

    const glow2 = ctx.createRadialGradient(540, 1400, 50, 540, 1400, 500);
    glow2.addColorStop(0, "rgba(16, 185, 129, 0.25)");
    glow2.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow2;
    ctx.beginPath();
    ctx.arc(540, 1400, 500, 0, Math.PI * 2);
    ctx.fill();

    // 3. Central Glass Card
    const cardX = 100;
    const cardY = 320;
    const cardW = 880;
    const cardH = 1280;
    const radius = 60;

    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, radius);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 4. Header Text
    ctx.textAlign = "center";
    ctx.fillStyle = "#a855f7";
    ctx.font = "900 48px system-ui, sans-serif";
    ctx.fillText("INCOGTALK PRIVATE ROOM", 540, 440);

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 64px system-ui, sans-serif";
    ctx.fillText("YOU'RE INVITED!", 540, 530);

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "500 32px system-ui, sans-serif";
    ctx.fillText("Scan QR with camera or enter code below", 540, 590);

    // 5. Draw QR Code Image
    if (qrDataUrl) {
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise((res) => { qrImg.onload = res; });
      const qrSize = 460;
      const qrX = (width - qrSize) / 2;
      const qrY = 660;

      // White background box for QR
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 40);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.stroke();

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    }

    // 6. Room Code Box
    const codeBoxY = 1200;
    ctx.fillStyle = "rgba(147, 51, 234, 0.2)";
    ctx.strokeStyle = "rgba(168, 85, 247, 0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(180, codeBoxY, 720, 130, 30);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 68px monospace";
    ctx.fillText(roomCode, 540, codeBoxY + 88);

    // 7. Footer Branding
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "700 36px system-ui, sans-serif";
    ctx.fillText("https://incogtalkk.netlify.app", 540, 1720);

    ctx.fillStyle = "#10b981";
    ctx.font = "600 28px system-ui, sans-serif";
    ctx.fillText("Speak Freely • Stay Incognito • Encrypted P2P", 540, 1780);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await generateCanvasImage();
      if (!blob) throw new Error("Failed to generate image");

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `IncogTalk-Room-${roomCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "📸 Story Card Downloaded!", description: "Share it on Instagram Stories or TikTok." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to create card image.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const handleNativeShare = async () => {
    try {
      const blob = await generateCanvasImage();
      if (blob && navigator.share && navigator.canShare) {
        const file = new File([blob], `IncogTalk-Room-${roomCode}.png`, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Join my IncogTalk Private Room",
            text: `Join my private room on IncogTalk! Code: ${roomCode}`,
          });
          return;
        }
      }
      handleDownload();
    } catch {
      handleDownload();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm rounded-3xl border border-primary/30 bg-zinc-950 p-6 shadow-2xl space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-base font-extrabold text-white">Story Sharing Graphic</h3>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-white/60 hover:text-white" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Visual Preview Card */}
          <div
            ref={cardRef}
            className="w-full aspect-[9/16] rounded-2xl border border-primary/40 bg-gradient-to-b from-purple-950/60 via-zinc-950 to-zinc-950 p-5 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-xl"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-emerald-400 to-indigo-500" />
            
            <div className="space-y-1 pt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Private Room Invite</span>
              <h4 className="text-xl font-black text-white italic tracking-tight">YOU'RE INVITED!</h4>
              <p className="text-[11px] text-muted-foreground">Scan QR or enter code on IncogTalk</p>
            </div>

            {/* QR Code Container */}
            <div className="p-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md my-2">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-36 h-36 object-contain" />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center">
                  <QrCode className="h-10 w-10 text-primary animate-pulse" />
                </div>
              )}
            </div>

            {/* Room Code Badge */}
            <div className="w-full rounded-xl bg-primary/20 border border-primary/40 py-2">
              <p className="font-mono text-xl font-black text-white tracking-[0.25em]">{roomCode}</p>
            </div>

            {/* Sub copy */}
            <div className="space-y-0.5 pb-1">
              <p className="text-[10px] font-bold text-white/80">incogtalk.netlify.app</p>
              <p className="text-[9px] text-emerald-400 font-bold">100% Free • Anonymous • Encrypted</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              variant="glow"
              className="w-full h-12 text-xs font-black uppercase tracking-wider rounded-xl gap-2 shadow-lg shadow-primary/20"
              onClick={handleNativeShare}
              disabled={downloading}
            >
              <Share2 className="h-4 w-4" />
              <span>Share to Instagram / Snapchat</span>
            </Button>

            <Button
              variant="outline"
              className="w-full h-11 text-xs font-bold rounded-xl gap-2 border-white/20 text-white hover:bg-white/10"
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download className="h-4 w-4" />
              <span>Download Image (9:16 Story Ratio)</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
