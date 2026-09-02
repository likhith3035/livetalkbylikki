import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MessageSquare,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Users,
  Lock,
  EyeOff,
  Video,
  Gamepad2,
  Link2,
  Share2,
  Instagram,
  Linkedin,
  Mail,
  Camera,
  Smartphone,
  Globe,
  Download,
  ChevronRight,
  Bot,
  Phone,
  ShieldAlert,
  FileText,
  Radio,
  QrCode,
  Flame,
  Layers,
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
import LiquidBackground from "@/components/LiquidBackground";
import { HomeLiveTicker } from "@/components/home/HomeLiveTicker";
import { HomeInteractiveShowcase } from "@/components/home/HomeInteractiveShowcase";
import { cn } from "@/lib/utils";

// ─── Data & Constants ───

const QUICK_TOPICS = [
  { label: "#gaming", icon: "🎮" },
  { label: "#music", icon: "🎵" },
  { label: "#tech", icon: "💻" },
  { label: "#chill", icon: "☕" },
  { label: "#anime", icon: "🎌" },
  { label: "#movies", icon: "🎬" },
  { label: "#deep-talk", icon: "🌌" },
  { label: "#crypto", icon: "🪙" },
];

const METRICS = [
  { label: "Average Match Time", value: "< 2 Sec", subtext: "Lightning fast pairing", icon: Zap, color: "text-amber-400" },
  { label: "Privacy Protection", value: "100%", subtext: "Zero logs or databases", icon: Shield, color: "text-emerald-400" },
  { label: "Active Countries", value: "150+", subtext: "Global community", icon: Globe, color: "text-blue-400" },
  { label: "Platform Access", value: "Web & APK", subtext: "Universal device support", icon: Smartphone, color: "text-purple-400" },
];

const STEPS = [
  { num: "01", title: "Tap Start Chat", desc: "No registration or credentials needed. Instant browser launch.", icon: Zap },
  { num: "02", title: "Instant Match", desc: "Engine matches you with a real online stranger by shared topics.", icon: Users },
  { num: "03", title: "Text, Video & Play", desc: "Enjoy private text, HD video calls, and 1v1 multiplayer games.", icon: MessageSquare },
];

const COMPARISON_ITEMS = [
  {
    feature: "Instant Browser Access",
    web: "✅ 1-Tap Access (No Download)",
    apk: "📥 APK Installation (~7.3 MB)",
    isApkBest: false,
  },
  {
    feature: "Incoming Call Banner (WhatsApp Style)",
    web: "❌ Web Audio Alert Only",
    apk: "🟢 High-Priority Heads-Up Banner",
    isApkBest: true,
  },
  {
    feature: "Audio Output Switcher (Speaker/Earpiece/Bluetooth)",
    web: "❌ Default Speaker Only",
    apk: "🟢 1-Tap Audio Output Routing",
    isApkBest: true,
  },
  {
    feature: "Background Call Persistence",
    web: "⚠️ Requires Active Browser Tab",
    apk: "🟢 Foreground Service (Background Calls)",
    isApkBest: true,
  },
  {
    feature: "Biometric Hardware Lock",
    web: "🔒 Passcode Only",
    apk: "🟢 Hardware Fingerprint & Face ID",
    isApkBest: true,
  },
  {
    feature: "In-App APK Auto Updater",
    web: "⚡ Always Live on Netlify",
    apk: "📲 5-Second GitHub Auto Updates",
    isApkBest: true,
  },
  {
    feature: "Hardware Screen Shield",
    web: "🔒 Browser Storage Protection",
    apk: "🛡️ Hardware Screen Capture Block",
    isApkBest: true,
  },
];

const Index = () => {
  const navigate = useNavigate();
  const onlineCount = useOnlineCount();
  const { toast } = useToast();

  useSEO({
    title: "LiveTalk by Likhith Kami – Talk to Anyone Instantly",
    description:
      "LiveTalk by Likhith Kami (Likki) — free anonymous chat with strangers. No signup, no tracking. HD WebRTC video calls, 1v1 arcade games, private QR rooms & P2P file drop. The #1 modern Omegle alternative.",
    keywords:
      "likhith livetalk, likki livetalk, livetalk by likki, omegle alternative, omegle 2, anonymous chat, chat with strangers, random chat, video chat, talk to strangers, free chat app, anonymous video chat, 1v1 games, connect 4 online, tic tac toe with friends",
  });

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useAnalytics();

  const handleStartChat = (topic?: string) => {
    const activeTopic = topic || selectedTopic;
    if (activeTopic) {
      navigate(`/chat?topic=${encodeURIComponent(activeTopic.replace("#", ""))}`);
    } else {
      navigate("/chat");
    }
  };

  const handleToggleTopic = (topic: string) => {
    setSelectedTopic((prev) => (prev === topic ? null : topic));
  };

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

  const handleJoinRoom = () => {
    if (!joinCode) {
      toast({ title: "Error", description: "Please enter a room code.", variant: "destructive" });
      return;
    }

    const clean = joinCode.trim().toUpperCase();
    if (clean.length < 3 || clean.length > 30) {
      toast({ title: "Invalid code", description: "Room code must be between 3 and 30 characters.", variant: "destructive" });
      return;
    }
    navigate(`/room/${clean}`);
  };

  const generateAndJoinRoom = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

    sessionStorage.setItem("echo_created_room", code);
    toast({ title: "🔗 Private Room Created!", description: `Room Code: ${code}. Entering room...` });
    navigate(`/room/${code}`);
  };

  return (
    <div className="flex w-full min-h-full flex-col bg-background overflow-x-hidden relative select-none">
      <LiquidBackground />

      {/* Header for Mobile */}
      <div className="lg:hidden relative z-30">
        <Header onlineCount={onlineCount} />
      </div>

      {/* Subtle Background Tech Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-40" />

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative flex flex-col items-center justify-start text-center px-4 sm:px-6 pt-6 pb-10 sm:pt-10 sm:pb-14 lg:pt-14 lg:pb-16 overflow-visible">
        {/* Glow Spheres */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full bg-gradient-to-tr from-primary/25 via-purple-600/15 to-indigo-600/10 blur-[140px] pointer-events-none -z-30" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-5">
          {/* Top Online Indicator Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/80 backdrop-blur-xl px-3.5 py-1 text-[11px] sm:text-xs font-semibold text-foreground shadow-lg shadow-primary/5 max-w-full flex-wrap justify-center"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-emerald-400 font-extrabold">{onlineCount.toLocaleString()} Online Now</span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <Shield className="h-3 w-3 text-primary shrink-0" /> 100% Anonymous & Free
            </span>
          </motion.div>

          {/* Hero Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black font-display leading-[1.08] tracking-tight max-w-full px-1"
          >
            Talk to anyone, <br />
            <span className="bg-gradient-to-r from-primary via-purple-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_10px_25px_rgba(168,85,247,0.35)]">
              completely anonymously
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed font-medium px-2"
          >
            Zero accounts. Zero tracking. Instant encrypted video calls, 1v1 multiplayer games, and private rooms with real people worldwide.
          </motion.p>

          {/* Developer Credit Tag */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80 font-medium flex-wrap"
          >
            <span>Crafted with 💜 by</span>
            <a
              href="https://devlikhith.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-bold hover:underline underline-offset-4 flex items-center gap-1 bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full transition-all hover:bg-primary/20 cursor-pointer"
            >
              <span>Likhith Kami (Likki)</span>
              <ChevronRight className="h-3 w-3" />
            </a>
          </motion.div>

          {/* ══════════ QUICK TOPIC MATCH SELECTOR ══════════ */}
          <div className="pt-2">
            <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-xl mx-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
                Filter by Topic:
              </span>
              {QUICK_TOPICS.map((topic) => {
                const isSelected = selectedTopic === topic.label;
                return (
                  <button
                    key={topic.label}
                    onClick={() => handleToggleTopic(topic.label)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-105"
                        : "bg-card/70 border border-border/70 text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}
                  >
                    <span>{topic.icon}</span>
                    <span>{topic.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ══════════ HERO ACTION HUB (COMMAND CENTER) ══════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full max-w-lg mx-auto pt-2 px-1"
          >
            <div className="rounded-3xl border border-primary/30 bg-card/90 backdrop-blur-2xl p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(147,51,234,0.25)] relative overflow-hidden text-left space-y-4">
              {/* PRIMARY ACTION — Instant Chat */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span>Instant Stranger Match</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    {selectedTopic ? `Matching in ${selectedTopic}` : "Sub-second pairing"}
                  </span>
                </div>

                <Button
                  variant="glow"
                  size="lg"
                  className="w-full h-14 sm:h-15 text-base sm:text-lg font-black rounded-2xl gap-3 shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] group cursor-pointer"
                  onClick={() => handleStartChat()}
                >
                  <MessageSquare className="h-5 w-5 group-hover:scale-110 transition-transform shrink-0" />
                  <span>{selectedTopic ? `Chat with Stranger (${selectedTopic})` : "Start Anonymous Chat"}</span>
                  <ArrowRight className="h-5 w-5 ml-auto group-hover:translate-x-1 transition-transform shrink-0" />
                </Button>
              </div>

              {/* DIVIDER */}
              <div className="relative flex items-center justify-center py-0.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60" />
                </div>
                <span className="relative bg-card px-3 text-[10px] uppercase font-bold text-muted-foreground/70 tracking-wider">
                  or choose an experience
                </span>
              </div>

              {/* 4-PILLAR FEATURE CARDS */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {/* 1. Arcade Games */}
                <button
                  onClick={() => navigate("/games")}
                  className="p-3 rounded-2xl bg-secondary/40 hover:bg-secondary/70 border border-border/60 hover:border-amber-500/50 transition-all flex items-center gap-2.5 text-left group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">1v1 Arcade</p>
                    <p className="text-[10px] text-muted-foreground truncate">5 Games • AI Duel</p>
                  </div>
                </button>

                {/* 2. Private QR Room */}
                <button
                  onClick={() => setShowJoinInput((prev) => !prev)}
                  className={`p-3 rounded-2xl border transition-all flex items-center gap-2.5 text-left group cursor-pointer ${
                    showJoinInput
                      ? "bg-primary/10 border-primary"
                      : "bg-secondary/40 hover:bg-secondary/70 border border-border/60 hover:border-primary/50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">Private Room</p>
                    <p className="text-[10px] text-muted-foreground truncate">Custom Code / QR</p>
                  </div>
                </button>

                {/* 3. AI Wingman */}
                <button
                  onClick={() => navigate("/ai-chat")}
                  className="p-3 rounded-2xl bg-secondary/40 hover:bg-secondary/70 border border-border/60 hover:border-purple-500/50 transition-all flex items-center gap-2.5 text-left group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">AI Wingman</p>
                    <p className="text-[10px] text-muted-foreground truncate">Claude, GPT, Gemini</p>
                  </div>
                </button>

                {/* 4. P2P File Sharing */}
                <button
                  onClick={() => navigate("/file-sharing")}
                  className="p-3 rounded-2xl bg-secondary/40 hover:bg-secondary/70 border border-border/60 hover:border-blue-500/50 transition-all flex items-center gap-2.5 text-left group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">P2P File Drop</p>
                    <p className="text-[10px] text-muted-foreground truncate">Zero Server Storage</p>
                  </div>
                </button>
              </div>

              {/* EXPANDABLE PRIVATE ROOM CONTROLS */}
              <AnimatePresence>
                {showJoinInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2.5 pt-2 border-t border-border/40 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground">Create or Enter Room Code:</p>
                      <button
                        onClick={generateAndJoinRoom}
                        className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        + Generate New Room
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          placeholder="e.g. A8K3P9"
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                          className="h-11 rounded-xl bg-background/50 font-mono tracking-wider text-center text-sm font-bold uppercase"
                          onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-9 w-9 text-muted-foreground hover:text-primary cursor-pointer"
                          onClick={() => setShowScanner(true)}
                          title="Scan QR Code with Camera"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        onClick={handleJoinRoom}
                        variant="glow"
                        className="h-11 px-4 sm:px-5 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                      >
                        Join Room
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ANDROID APK COMPACT FOOTER */}
              <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs">
                    📱
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Android Native App</p>
                    <p className="text-[10px] text-muted-foreground">Background Calls & Biometrics</p>
                  </div>
                </div>
                <ApkDownloadButton variant="compact" />
              </div>
            </div>
          </motion.div>

          {/* AMBIENT REALTIME PLATFORM TICKER */}
          <HomeLiveTicker />

          {/* 3-STEP HOW IT WORKS */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-lg mx-auto pt-2">
            {STEPS.map((s, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center text-center p-3 rounded-2xl bg-card/50 border border-border/40 backdrop-blur-md transition-all hover:border-primary/40 group"
              >
                <span className="text-xs font-black text-primary mb-0.5">{s.num}</span>
                <span className="text-xs font-bold text-foreground">{s.title}</span>
                <span className="text-[10px] text-muted-foreground hidden sm:block">{s.desc}</span>
              </div>
            ))}
          </div>

          {/* Age Restriction Badge */}
          <div className="pt-1">
            <span className="px-3 py-0.5 bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-extrabold uppercase rounded-full tracking-widest inline-flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" /> Adults Only 18+
            </span>
          </div>
        </div>
      </section>

      {/* ══════════ INTERACTIVE FEATURE SHOWCASE ══════════ */}
      <section className="px-4 sm:px-6 py-10 sm:py-16 relative">
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Interactive Live Playground
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display">
              Designed for <span className="bg-gradient-to-r from-primary via-purple-400 to-indigo-400 bg-clip-text text-transparent">speed, privacy & fun</span>
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto">
              Test out real LiveTalk capabilities right now before jumping into a conversation.
            </p>
          </div>

          {/* Interactive Multi-Tab Showcase */}
          <HomeInteractiveShowcase />
        </div>
      </section>

      {/* ══════════ TRUST METRICS ══════════ */}
      <section className="px-4 sm:px-6 py-10 border-y border-border/40 bg-card/20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {METRICS.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 sm:p-5 rounded-2xl bg-card/40 border border-border/40 backdrop-blur-sm flex flex-col items-center text-center space-y-1 hover:border-primary/30 transition-all"
            >
              <m.icon className={cn("h-5 w-5 sm:h-6 sm:w-6 mb-1", m.color)} />
              <span className="text-xl sm:text-3xl font-black font-display tracking-tight text-foreground">{m.value}</span>
              <span className="text-xs font-bold text-foreground/90">{m.label}</span>
              <span className="text-[10px] text-muted-foreground">{m.subtext}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════ BENTO GRID FEATURE ARCHITECTURE ══════════ */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 relative">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-semibold text-primary">
              <Layers className="h-3.5 w-3.5" /> Next-Gen Technology
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display leading-tight">
              Powerful Peer-to-Peer Social Engine
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-lg mx-auto">
              Engineered with modern WebRTC, STUN servers, and zero-storage peer connections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: WebRTC Video & Audio (Span 2) */}
            <div className="md:col-span-2 rounded-3xl border border-primary/30 bg-gradient-to-br from-card/90 via-card/60 to-primary/10 backdrop-blur-2xl p-6 sm:p-8 hover:border-primary/50 transition-all duration-300 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30 text-primary">
                    <Video className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    HD P2P WebRTC
                  </span>
                </div>

                <div>
                  <h3 className="text-lg sm:text-2xl font-black text-foreground mb-1.5">Dual P2P WebRTC Video & Voice</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
                    Peer-to-peer encrypted calls with zero intermediary server recording. Direct device-to-device audio & video streams.
                  </p>
                </div>
              </div>

              {/* Live Signal Pulse */}
              <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-xs font-mono text-muted-foreground relative z-10">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-foreground font-bold">Latency: 24ms</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-1 bg-primary/40 rounded-full animate-bounce" />
                  <span className="h-5 w-1 bg-primary rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="h-4 w-1 bg-primary/70 rounded-full animate-bounce [animation-delay:0.3s]" />
                  <span className="text-[10px] text-primary font-bold ml-1">ENCRYPTED PIPELINE</span>
                </div>
              </div>
            </div>

            {/* Card 2: 1v1 Games Arcade (Span 1) */}
            <div className="rounded-3xl border border-primary/30 bg-card/80 backdrop-blur-2xl p-6 hover:border-primary/50 transition-all duration-300 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                    <Gamepad2 className="h-5 w-5" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    5 Arcade Games
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-foreground">1v1 Multiplayer Arcade</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tic-Tac-Toe, Connect 4, RPS, Memory Duel & Reaction Dash. Play via QR code or vs Cyber AI with WebRTC Face Cam.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400">Spectator Emoji Cannon</span>
                <span className="text-primary font-bold hover:underline cursor-pointer" onClick={() => navigate("/games")}>
                  Play Now →
                </span>
              </div>
            </div>

            {/* Card 3: P2P File & Text Drop (Span 1) */}
            <div className="rounded-3xl border border-primary/30 bg-card/80 backdrop-blur-2xl p-6 hover:border-primary/50 transition-all duration-300 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                    Zero Storage
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-foreground">Zero-Knowledge File Drop</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Send unlimited size files and self-destructing text notes directly between devices with zero cloud servers.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                <span className="font-bold text-blue-400">48 MB/s Direct Pipe</span>
                <span className="text-primary font-bold hover:underline cursor-pointer" onClick={() => navigate("/file-sharing")}>
                  Send File →
                </span>
              </div>
            </div>

            {/* Card 4: Private QR Rooms & Device Handoff (Span 2) */}
            <div className="md:col-span-2 rounded-3xl border border-primary/30 bg-gradient-to-br from-card/90 via-card/60 to-purple-900/15 backdrop-blur-2xl p-6 sm:p-8 hover:border-primary/50 transition-all duration-300 shadow-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
                    QR & Device Handoff
                  </span>
                </div>

                <div>
                  <h3 className="text-lg sm:text-2xl font-black text-foreground mb-1.5">Private Rooms & Seamless Handoff</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
                    Create rooms with custom codes (e.g. `LIKKI-HANGOUT`). Seamlessly scan QR code from desktop to continue your chat or game on mobile without disconnecting.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-xs flex-wrap gap-2">
                <span className="text-muted-foreground font-mono">Custom Slugs • 1-Tap QR Scan</span>
                <button
                  onClick={generateAndJoinRoom}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold border border-purple-500/40 cursor-pointer"
                >
                  Create Instant Private Room →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ WEB VS NATIVE APK COMPARISON ══════════ */}
      <section className="px-4 sm:px-6 py-14 border-t border-border/40 bg-card/10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Smartphone className="h-3.5 w-3.5" /> Web vs Native Android APK
            </span>
            <h2 className="text-2xl sm:text-4xl font-black font-display tracking-tight">
              Website vs <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Android App</span>
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto">
              Enjoy 1-Tap instant browser access or download the native Android app for hardware-level capabilities.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-primary/25 bg-card/60 backdrop-blur-xl shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/50">
                    <th className="py-4 px-5 font-bold text-foreground">Capability</th>
                    <th className="py-4 px-5 font-bold text-foreground">Web Version</th>
                    <th className="py-4 px-5 font-bold text-primary">
                      <div className="flex items-center gap-2">
                        <span>Android APK</span>
                        <span className="rounded bg-primary/20 px-2 py-0.5 text-[9px] font-black text-primary">RECOMMENDED</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {COMPARISON_ITEMS.map((item, index) => (
                    <tr key={index} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-5 font-semibold text-foreground">{item.feature}</td>
                      <td className="py-3 px-5 text-muted-foreground text-xs">{item.web}</td>
                      <td className="py-3 px-5 text-xs font-semibold">
                        <span className={item.isApkBest ? "text-emerald-400 font-bold" : "text-foreground"}>
                          {item.apk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 sm:p-5 border-t border-border/40 bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground text-center sm:text-left">
                <span className="font-semibold text-foreground">Want native background calls & biometric hardware lock?</span>
              </div>
              <ApkDownloadButton variant="compact" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FINAL HIGH-CONVERTING CTA ══════════ */}
      <section className="px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-xl mx-auto text-center rounded-3xl border border-primary/30 bg-card/40 backdrop-blur-2xl p-8 sm:p-12 relative overflow-hidden shadow-2xl shadow-primary/15">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30 mx-auto text-primary">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display leading-tight">
              Ready to start chatting?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto text-xs sm:text-sm leading-relaxed">
              Connect instantly with people from over 150 countries. No sign-up required.
            </p>
            <Button
              variant="glow"
              size="lg"
              className="h-14 px-8 text-base font-extrabold rounded-2xl gap-3 shadow-xl shadow-primary/30 hover:scale-105 transition-all cursor-pointer"
              onClick={() => handleStartChat()}
            >
              <MessageSquare className="h-5 w-5" />
              <span>Start Anonymous Chat Now</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="border-t border-border/40 px-6 py-12 pb-24 lg:pb-12 bg-card/20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <BrandLogo className="h-9 w-9 drop-shadow-md" />
            <div>
              <span className="font-display text-base font-bold text-foreground block leading-none">LiveTalk by Likki</span>
              <span className="text-[10px] text-muted-foreground">Anonymous Text, Video & Arcade Social Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground font-semibold">
            <Link to="/info" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/safety" className="hover:text-foreground transition-colors">Safety</Link>
            <Link to="/guidelines" className="hover:text-foreground transition-colors">Guidelines</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com/Lucky__likhith"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground hover:text-primary hover:scale-110 transition-all cursor-pointer"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/likhith-kami/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground hover:text-primary hover:scale-110 transition-all cursor-pointer"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href="mailto:kamilikhith@gmail.com"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground hover:text-primary hover:scale-110 transition-all cursor-pointer"
              aria-label="Email"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground/60 mt-8 max-w-2xl mx-auto space-y-2">
          <p>
            © 2026 LiveTalk by Likki. Developed with 💜 by{" "}
            <a href="https://devlikhith.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">
              Likhith Kami (Likki)
            </a>
          </p>
          <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 text-[10px] text-muted-foreground/40 font-semibold uppercase tracking-wider">
            <Link to="/guidelines" className="hover:text-primary">Guidelines</Link>
            <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
            <a href="https://devlikhith.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-primary/70 hover:text-primary">
              Kami Likhith Portfolio
            </a>
          </div>
        </div>
      </footer>

      {/* QR Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Scan QR Code</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex justify-center">
            <QrScanner onScanSuccess={handleQrScanSuccess} onClose={() => setShowScanner(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <MobileNav />
    </div>
  );
};

export default Index;
