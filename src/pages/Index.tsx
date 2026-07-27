import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MessageSquare, ArrowRight, Sparkles, Shield, Zap, Users, Lock,
  EyeOff, Video, Gamepad2, Link2, Copy, Check, Hash, Share2,
  Instagram, Linkedin, Mail, Camera, Smartphone, Globe, Download, CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useToast } from "@/hooks/use-toast";
import { BrandLogo } from "@/components/BrandLogo";
import { useSEO } from "@/hooks/use-seo";
import { useAnalytics } from "@/hooks/use-analytics";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QrScanner from "@/components/chat/QrScanner";
import ApkDownloadButton from "@/components/ApkDownloadButton";
import { useIsMobile } from "@/hooks/use-mobile";

// ─── Data ───

const FEATURES = [
  { icon: Lock, title: "End-to-End Secure", desc: "Fully encrypted conversations that are never stored." },
  { icon: EyeOff, title: "Zero Data Collection", desc: "No accounts, no tracking, no cookies." },
  { icon: Zap, title: "Instant Matching", desc: "Get paired with a stranger in seconds." },
  { icon: Video, title: "Audio & Video Calls", desc: "Switch to voice or video mid-chat with one tap." },
  { icon: Gamepad2, title: "Built-in Games", desc: "Play Truth or Dare, Tic-Tac-Toe, and more." },
  { icon: Shield, title: "Safe Community", desc: "Moderation tools and reporting keep things clean." },
];

const STEPS = [
  { num: "01", title: "Hit Start", desc: "No signup needed — just tap and go.", icon: Zap },
  { num: "02", title: "Get Matched", desc: "Paired with a random stranger instantly.", icon: Users },
  { num: "03", title: "Start Talking", desc: "Chat, call, play games — all up to you.", icon: MessageSquare },
];

const COMPARISON_ITEMS = [
  {
    feature: "Instant Access (No Installation)",
    web: "✅ Instant One-Tap Browser Access",
    apk: "📥 APK Download Required (~7.3 MB)",
    isApkBest: false,
  },
  {
    feature: "Native Incoming Call Banner (WhatsApp Style)",
    web: "❌ Web Audio Alert Only",
    apk: "🟢 High-Priority Heads-Up Banner",
    isApkBest: true,
  },
  {
    feature: "In-Call Audio Switcher (Speaker/Earpiece/Bluetooth)",
    web: "❌ Speaker Output Only",
    apk: "🟢 1-Tap Audio Output Routing",
    isApkBest: true,
  },
  {
    feature: "Background Call Persistence & Notifications",
    web: "⚠️ Requires Active Tab",
    apk: "🟢 Foreground Service (Runs in Background)",
    isApkBest: true,
  },
  {
    feature: "Native Biometric Hardware Lock (Fingerprint & Face ID)",
    web: "🔒 Passcode Only",
    apk: "🟢 Hardware Biometric Protection",
    isApkBest: true,
  },
  {
    feature: "Automatic In-App APK Updater",
    web: "⚡ Always Live on Web",
    apk: "📲 5s Auto-Download via GitHub",
    isApkBest: true,
  },
  {
    feature: "Screen Capture Protection & Shield",
    web: "🔒 Basic Web Storage",
    apk: "🛡️ Hardware Screen Shield",
    isApkBest: true,
  },
];

// Simple fade-up animation
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ─── Component ───

const Index = () => {
  const navigate = useNavigate();
  const onlineCount = useOnlineCount();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  useSEO({ 
    title: "LiveTalk by Likhith Kami – Talk to Anyone Instantly", 
    description: "LiveTalk by Likhith Kami (Likki) — free anonymous chat with strangers. No signup, no tracking. Video calls, games, private rooms & more. The #1 Omegle alternative built by Kami Likhith.",
    keywords: "likhith livetalk, likki livetalk, likhith websites, kami likhith, kami likhith websites, likhith portfolio, kami likhith portfolio, likhith kami, likhith kami developer, likki developer, likhith kami chat app, likkimeet, likkitalk, likkichat, livetalk, live talk, livetalkbylikki, livetalk by likki, omegle alternative, omegle 2, anonymous chat, chat with strangers, random chat, video chat, talk to strangers, free chat app, anonymous video chat"
  });

  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const invitePanelRef = useRef<HTMLDivElement>(null);
  const joinPanelRef = useRef<HTMLDivElement>(null);

  useAnalytics();

  const appOrigin = "https://LiveTalkbylikki.netlify.app";
  const getRoomUrl = (code: string) => `${appOrigin}/room/${code}`;

  const handleQrScanSuccess = (decodedText: string) => {
    let code = decodedText.trim().toUpperCase();
    const urlMatch = decodedText.match(/\/room\/([A-Za-z0-9]+)/i);
    if (urlMatch) code = urlMatch[1].toUpperCase();
    if (code.length >= 4) {
      toast({ title: "✅ QR Scanned!", description: `Joining room ${code}...` });
      setShowScanner(false);
      navigate(`/room/${code}`);
    } else {
      toast({ title: "Invalid QR", description: "This QR code doesn't contain a valid room code.", variant: "destructive" });
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode) {
      toast({ title: "Error", description: "Please enter a room code.", variant: "destructive" });
      return;
    }

    const rawCode = joinCode.trim();

    // Admin passphrase shortcut
    if (rawCode.toLowerCase() === "likhith3035") {
      sessionStorage.setItem("echo_admin_token", "5f064930eee39bdc7dd4c2b651b159cf83782a11b543");
      toast({ title: "Welcome back, Admin", description: "Opening dashboard…" });
      navigate("/admin/dashboard");
      return;
    }

    // Legacy hash-based admin entry
    if (rawCode.startsWith("#") && rawCode.endsWith("#")) {
      try {
        const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawCode));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        if (hashHex === "5f064930eee39bdc7dd4c2b651b159cf83782a11b543f87facd0fed6eb84ad14") {
          sessionStorage.setItem("echo_admin_token", "5f064930eee39bdc7dd4c2b651b159cf83782a11b543");
          toast({ title: "Authorized", description: "Opening dashboard…" });
          navigate("/admin/dashboard");
          return;
        }
      } catch (err) {
        console.error("Cryptographic verification failed", err);
      }
    }

    if (joinCode.length !== 6) {
      toast({ title: "Invalid code", description: "Room code must be 6 characters.", variant: "destructive" });
      return;
    }
    navigate(`/room/${joinCode.toUpperCase()}`);
  };

  const generateAndJoinRoom = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setShowJoinInput(false);
    setRoomCode(code);
    sessionStorage.setItem("echo_created_room", code);
    setTimeout(() => {
      invitePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const shareAndJoin = async () => {
    if (!roomCode) return;
    await navigator.clipboard.writeText(getRoomUrl(roomCode));
    toast({ title: "Link copied!", description: "Now entering the room..." });
    setTimeout(() => navigate(`/room/${roomCode}`), 600);
  };

  const copyLink = async () => {
    if (!roomCode) return;
    await navigator.clipboard.writeText(getRoomUrl(roomCode));
    setCopied(true);
    toast({ title: "Link copied!", description: "Share it with your friend." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background overflow-x-hidden">
      <div className="lg:hidden">
        <Header onlineCount={onlineCount} />
      </div>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-20 sm:pt-28 sm:pb-28 lg:pt-32 lg:pb-32 overflow-hidden">
        {/* Subtle gradient orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          {/* Online badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm px-4 py-2 text-xs font-medium text-muted-foreground"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {onlineCount.toLocaleString()} people online
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-[1.1] tracking-tight"
          >
            Talk to anyone, <br />
            <span className="text-gradient">anonymously</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed"
          >
            No sign-ups. No tracking. Just real conversations with real people from around the world.
          </motion.p>

          {/* Developer credit */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-sm text-muted-foreground/50 font-medium"
          >
            Built with 💜 by{" "}
            <a href="https://devlikhith.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-primary/70 hover:text-primary transition-colors hover:underline underline-offset-4">
              Likhith Kami
            </a>
          </motion.p>

          {/* CTA Buttons - Simplified for Non-Tech & Family Users */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center gap-4 pt-2 w-full max-w-md mx-auto"
          >
            {/* GIANT PRIMARY ACTION */}
            <div className="w-full text-center space-y-2">
              <Button
                variant="glow"
                size="lg"
                className="w-full h-16 text-lg font-bold rounded-2xl gap-3 shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => navigate("/chat")}
              >
                <MessageSquare className="h-6 w-6" />
                Start Anonymous Chat
                <ArrowRight className="h-5 w-5 ml-auto" />
              </Button>
              <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1.5 pt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                Instant • Free • No Signup Required
              </p>
            </div>

            {/* 3-Step Simple Visual Guide for Beginners */}
            <div className="grid grid-cols-3 gap-2 w-full pt-4 pb-2">
              <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-card/40 border border-border/40">
                <span className="text-base font-bold text-primary mb-0.5">1️⃣</span>
                <span className="text-[11px] font-semibold text-foreground">Tap Start</span>
                <span className="text-[9px] text-muted-foreground">No account</span>
              </div>
              <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-card/40 border border-border/40">
                <span className="text-base font-bold text-primary mb-0.5">2️⃣</span>
                <span className="text-[11px] font-semibold text-foreground">Get Matched</span>
                <span className="text-[9px] text-muted-foreground">Random stranger</span>
              </div>
              <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-card/40 border border-border/40">
                <span className="text-base font-bold text-primary mb-0.5">3️⃣</span>
                <span className="text-[11px] font-semibold text-foreground">Start Talking</span>
                <span className="text-[9px] text-muted-foreground">Text or Video</span>
              </div>
            </div>

            {/* Secondary Actions (Collapsible/Organized so beginners aren't confused) */}
            <div className="w-full pt-2">
              <details className="group rounded-2xl border border-border/50 bg-card/20 backdrop-blur-sm text-left">
                <summary className="flex items-center justify-between px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Private Room with Friend or App Download
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="p-4 pt-1 space-y-3 border-t border-border/30">
                  <div className="w-full">
                    <ApkDownloadButton variant="full" />
                  </div>
                  <div className="flex items-center gap-2 w-full">
                    <Button
                      variant="outline"
                      className="flex-1 h-10 text-xs font-medium rounded-xl gap-2 border-border/80 hover:border-primary/40 hover:bg-primary/5 transition-all"
                      onClick={generateAndJoinRoom}
                    >
                      <Link2 className="h-3.5 w-3.5 text-primary" />
                      Create Private Room
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-10 text-xs font-medium rounded-xl gap-2 border-border/80 hover:border-primary/40 hover:bg-primary/5 transition-all"
                      onClick={() => {
                        const nextState = !showJoinInput;
                        setShowJoinInput(nextState);
                        if (nextState) {
                          setRoomCode(null);
                          setTimeout(() => {
                            joinPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }, 100);
                        }
                      }}
                    >
                      <Users className="h-3.5 w-3.5 text-primary" />
                      Enter Room Code
                    </Button>
                  </div>
                </div>
              </details>
            </div>
          </motion.div>

          {/* Join Room Input */}
          <AnimatePresence>
            {showJoinInput && (
              <motion.div
                key="join-room-panel"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="w-full max-w-sm mx-auto pt-2 overflow-hidden"
              >
                <div ref={joinPanelRef} className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="ROOM CODE"
                      value={joinCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.length > 6 || /[a-z]/.test(val)) {
                          setJoinCode(val.slice(0, 20));
                        } else {
                          setJoinCode(val.toUpperCase().slice(0, 6));
                        }
                      }}
                      className="h-12 rounded-xl bg-background/50 backdrop-blur-sm border-primary/20 focus-visible:ring-primary/30 font-mono tracking-widest text-center text-lg pr-12"
                      maxLength={20}
                      onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-10 w-10 text-muted-foreground hover:text-primary rounded-xl"
                      onClick={() => setShowScanner(true)}
                      title="Scan QR Code"
                    >
                      <Camera className="h-5 w-5" />
                    </Button>
                  </div>
                  <Button onClick={handleJoinRoom} variant="glow" className="h-12 px-6 rounded-xl">
                    Join
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Private Room Panel */}
          {roomCode && (
            <motion.div
              key="invite-room-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="w-full max-w-sm mx-auto pt-4"
            >
              <div ref={invitePanelRef} className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-5 shadow-lg shadow-primary/5">
                <p className="text-sm font-semibold text-foreground text-center">🔗 Your private room is ready!</p>
                <div className="flex items-center gap-2 rounded-xl bg-secondary/80 border border-border p-3">
                  <Hash className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-mono text-lg font-bold tracking-widest text-foreground flex-1">{roomCode}</span>
                  <Button size="sm" variant="ghost" onClick={copyLink} className="h-8 px-2">
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-[10px] text-muted-foreground">Share via</span>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`Let's chat anonymously! ${getRoomUrl(roomCode)}`)}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 hover:scale-110 transition-all" title="WhatsApp">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><title>WhatsApp</title><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                  </a>
                  <a href={`https://www.instagram.com/direct/new/?text=${encodeURIComponent(`Let's chat anonymously! ${getRoomUrl(roomCode)}`)}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-500 hover:bg-pink-500/20 hover:scale-110 transition-all" title="Instagram">
                    <Instagram className="h-4 w-4" />
                  </a>
                  <a href={`mailto:?subject=${encodeURIComponent("Let's chat anonymously!")}&body=${encodeURIComponent(`Join me: ${getRoomUrl(roomCode)}`)}`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 hover:scale-110 transition-all" title="Email">
                    <Mail className="h-4 w-4" />
                  </a>
                  {typeof navigator !== "undefined" && "share" in navigator && (
                    <button onClick={() => navigator.share({ title: "LiveTalk", text: "Join me for an anonymous chat", url: getRoomUrl(roomCode) }).catch(() => { })} className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted border border-border text-foreground hover:bg-muted/80 hover:scale-110 transition-all" title="More">
                      <Share2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button onClick={shareAndJoin} variant="glow" className="w-full gap-2 h-11">
                  <ArrowRight className="h-4 w-4" />
                  Share & Enter Room
                </Button>
              </div>
            </motion.div>
          )}

          <div className="flex items-center justify-center pt-2">
            <span className="px-3 py-1 bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-bold uppercase rounded-lg tracking-widest">Adults Only 18+</span>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section className="px-6 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display leading-tight">
              Everything you need, <span className="text-gradient">nothing you don't</span>
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm p-6 hover:bg-card/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 mb-4 group-hover:scale-110 group-hover:bg-primary/15 transition-all">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ WEBSITE VS MOBILE APK COMPARISON ═══════════ */}
      <section className="px-6 py-16 sm:py-20 border-t border-border/20 bg-background/50">
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center space-y-3"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Web vs Android APK</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">
              Website vs <span className="text-gradient">Mobile App</span>
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              Compare features between the instant web browser version and the powerful native Android APK build.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="overflow-hidden rounded-3xl border border-primary/20 bg-card/40 backdrop-blur-md shadow-xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40">
                    <th className="py-4 px-5 font-semibold text-foreground">Feature / Capability</th>
                    <th className="py-4 px-5 font-semibold text-foreground min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-400" />
                        <span>LiveTalk Web</span>
                      </div>
                    </th>
                    <th className="py-4 px-5 font-semibold text-primary min-w-[220px]">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-primary" />
                        <span>Android APK</span>
                        <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">RECOMMENDED</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {COMPARISON_ITEMS.map((item, index) => (
                    <tr key={index} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-5 font-medium text-foreground/90">{item.feature}</td>
                      <td className="py-3.5 px-5 text-muted-foreground text-xs">{item.web}</td>
                      <td className="py-3.5 px-5 text-xs font-semibold text-foreground">
                        <span className={item.isApkBest ? "text-emerald-400 font-bold" : "text-foreground"}>
                          {item.apk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-5 border-t border-border/40 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground text-center sm:text-left">
                <span>Want WhatsApp-style calling, background notifications & 1-tap speaker switching?</span>
              </div>
              <div className="shrink-0 w-full sm:w-auto">
                <ApkDownloadButton variant="compact" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="px-6 py-16 sm:py-24 bg-card/20">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold font-display text-center mb-12"
          >
            Three steps. <span className="text-gradient">That's it.</span>
          </motion.h2>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-3 gap-8"
          >
            {STEPS.map((step) => (
              <motion.div key={step.num} variants={fadeUp} className="text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15 mx-auto mb-4 group-hover:scale-110 transition-all">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs font-semibold text-primary/40 tracking-widest uppercase">Step {step.num}</span>
                <h3 className="text-lg font-semibold mt-1 mb-1.5">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="px-6 py-16 sm:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="max-w-xl mx-auto text-center rounded-3xl border border-primary/20 bg-card/20 backdrop-blur-sm p-10 sm:p-14 relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 space-y-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 border border-primary/20 mx-auto">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-display leading-tight">
              Ready to connect?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto text-base leading-relaxed">
              Join people having anonymous, private conversations right now.
            </p>
            <Button
              variant="glow"
              size="lg"
              className="h-14 px-10 text-base font-semibold rounded-2xl gap-2.5 shadow-xl shadow-primary/20"
              onClick={() => navigate("/chat")}
            >
              <MessageSquare className="h-5 w-5" />
              Start Chatting Now
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-border/30 px-6 py-10 pb-24 lg:pb-10 bg-card/10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <BrandLogo className="h-10 w-10 drop-shadow-md" />
            <span className="font-display text-lg font-bold text-foreground">LiveTalk by Likki</span>
          </div>

          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <Link to="/info" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/safety" className="hover:text-foreground transition-colors">Safety</Link>
            <Link to="/info" className="hover:text-foreground transition-colors">Help</Link>
          </div>

          <div className="flex items-center gap-3">
            <a href="https://instagram.com/Lucky__likhith" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 hover:scale-110 transition-all" aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://www.linkedin.com/in/likhith-kami/" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 hover:scale-110 transition-all" aria-label="LinkedIn">
              <Linkedin className="h-4 w-4" />
            </a>
            <a href="mailto:kamilikhith@gmail.com" className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 hover:scale-110 transition-all" aria-label="Email">
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/40 mt-6 max-w-2xl mx-auto leading-relaxed">
          LiveTalk by Likki — the best anonymous chat app built by Likhith Kami (Likki). Meet strangers, make friends, and play games. Learn more about the developer at{" "}
          <a href="https://devlikhith.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-primary underline font-medium">Kami Likhith Portfolio</a>.
        </p>

        <p className="text-center text-xs text-muted-foreground/50 mt-4">
          © 2026 LiveTalk by Likki. Developed with 💜 by{" "}
          <a href="https://devlikhith.vercel.app/" target="_blank" rel="noopener noreferrer me" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors font-medium">
            Likhith Kami (Likki)
          </a>
        </p>

        <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mt-2 text-[10px] text-muted-foreground/40 font-semibold uppercase tracking-wider">
          <Link to="/guidelines" className="hover:text-primary transition-colors">Guidelines</Link>
          <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a>
          <Link to="/info" className="hover:text-primary transition-colors">About</Link>
          <a href="https://devlikhith.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors text-primary/70" title="Kami Likhith Portfolio & Websites">Developer Portfolio</a>
        </div>
      </footer>

      {/* QR Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Scan QR Code</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex justify-center">
            <QrScanner
              onScanSuccess={handleQrScanSuccess}
              onClose={() => setShowScanner(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <MobileNav />
    </div>
  );
};

export default Index;
