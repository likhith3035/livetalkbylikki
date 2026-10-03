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
  Code2,
  Play,
  Search,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import QrScanner from "@/components/chat/QrScanner";
import ApkDownloadButton from "@/components/ApkDownloadButton";
import LiquidBackground from "@/components/LiquidBackground";
import { CosmicGoldWaves } from "@/components/home/CosmicGoldWaves";
import { HomeTopBar } from "@/components/home/HomeTopBar";
import { FeatureSearchDialog } from "@/components/home/FeatureSearchDialog";
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
  { label: "Platform Access", value: "Web & APK", subtext: "Universal device support", icon: Smartphone, color: "text-amber-400" },
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
    title: "IncogTalk (IncogTalkk) – Speak Freely. Stay Incognito | Free Anonymous Video Chat & 1v1 Games",
    description:
      "IncogTalk (incogtalkk.netlify.app) by Likhith Kami (Likki) — #1 free anonymous chat with strangers. Speak freely. Stay incognito. No signup, no tracking. HD WebRTC video calls, 1v1 arcade games, private QR rooms & P2P encrypted file drop.",
    keywords:
      "incogtalk, incogtalkk, incog talk, incog talkk, incogtalkk netlify, incogtalk netlify, incogchat, speak freely stay incognito, likhith kami, likki, omegle alternative, anonymous chat, chat with strangers, random chat, video chat, talk to strangers, free chat app, anonymous video chat, 1v1 games",
  });

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
      {/* Cosmic Golden Waves Background matching screenshot */}
      <CosmicGoldWaves />

      {/* Top Floating Navigation Header (Desktop) */}
      <div className="hidden lg:block relative z-30">
        <HomeTopBar onlineCount={onlineCount} onOpenSearch={() => setSearchOpen(true)} />
      </div>

      {/* Feature Search Command Dialog (Ctrl+K) */}
      <FeatureSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Header for Mobile */}
      <div className="lg:hidden relative z-30">
        <Header onlineCount={onlineCount} />
      </div>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative flex flex-col items-center justify-start text-center px-4 sm:px-6 pt-4 pb-8 sm:pt-6 sm:pb-10 lg:pt-8 lg:pb-12 overflow-visible z-10">
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          {/* Hero Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-6xl lg:text-[70px] font-black font-display leading-[1.06] tracking-tight max-w-full px-1 text-stone-900 dark:text-white"
          >
            Talk freely. <br />
            <span className="bg-gradient-to-r from-[#d99824] via-[#e5a93b] to-[#b87c1c] dark:from-[#f0c978] dark:via-[#e5a93b] dark:to-[#b87c1c] bg-clip-text text-transparent drop-shadow-[0_4px_30px_rgba(229,169,59,0.35)]">
              Stay anonymous.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xs sm:text-base text-stone-600 dark:text-stone-300/85 max-w-xl mx-auto leading-relaxed font-normal px-2"
          >
            Meet strangers, play games, code together, share files and explore — no account required.
          </motion.p>

          {/* Primary CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="pt-1 flex flex-col items-center justify-center gap-3"
          >
            <button
              onClick={() => handleStartChat()}
              className="h-13 sm:h-14 px-8 rounded-full bg-gradient-to-r from-[#f0be65] via-[#e5a83b] to-[#d48c18] hover:from-[#f3c876] hover:to-[#df9724] text-[#0a0a0d] font-bold text-sm sm:text-base shadow-[0_0_35px_rgba(229,169,59,0.35)] hover:shadow-[0_0_45px_rgba(229,169,59,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <MessageSquare className="w-5 h-5 fill-current/10 stroke-[2.2] group-hover:scale-110 transition-transform" />
              <span>{selectedTopic ? `Start Chat (${selectedTopic})` : "Start Anonymous Chat"}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Optional Topic Pills */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-xl mx-auto pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
                Filter by Topic:
              </span>
              {QUICK_TOPICS.slice(0, 5).map((topic) => {
                const isSelected = selectedTopic === topic.label;
                return (
                  <button
                    key={topic.label}
                    onClick={() => handleToggleTopic(topic.label)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? "bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/30 scale-105"
                        : "bg-white/80 hover:bg-stone-100 border border-stone-200 text-stone-700 hover:text-stone-950 shadow-sm dark:bg-[#14151c]/80 dark:border-white/10 dark:text-muted-foreground dark:hover:text-white dark:hover:border-amber-500/40"
                    }`}
                  >
                    <span>{topic.icon}</span>
                    <span>{topic.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* 3 Status / Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-2.5 sm:gap-5 flex-wrap pt-2"
          >
            {/* 1. Instant matching */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/85 dark:bg-[#121319]/75 border border-stone-200/90 dark:border-white/8 backdrop-blur-md shadow-sm">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 dark:bg-[#1e1b14] border border-amber-500/30 dark:border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Zap className="w-4 h-4 fill-current/20" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-stone-900 dark:text-white">Instant matching</p>
                <p className="text-[10px] text-stone-500 dark:text-muted-foreground">&lt; 1 second</p>
              </div>
            </div>

            {/* 2. Online users */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/85 dark:bg-[#121319]/75 border border-stone-200/90 dark:border-white/8 backdrop-blur-md shadow-sm">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 dark:bg-[#1e1b14] border border-amber-500/30 dark:border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-stone-900 dark:text-white">{onlineCount} online</p>
                <p className="text-[10px] text-stone-500 dark:text-muted-foreground">People chatting now</p>
              </div>
            </div>

            {/* 3. 100% Anonymous */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/85 dark:bg-[#121319]/75 border border-stone-200/90 dark:border-white/8 backdrop-blur-md shadow-sm">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 dark:bg-[#1e1b14] border border-amber-500/30 dark:border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-stone-900 dark:text-white">100% Anonymous</p>
                <p className="text-[10px] text-stone-500 dark:text-muted-foreground">No sign up needed</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ CHOOSE YOUR EXPERIENCE BENTO GRID ══════════ */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-2 pb-12 relative z-10 space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 dark:text-amber-400 text-lg drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">✦</span>
            <h2 className="text-lg sm:text-xl font-bold font-display text-stone-900 dark:text-white tracking-tight">
              Choose Your Experience
            </h2>
          </div>

          <button
            onClick={() => navigate("/games")}
            className="text-xs font-semibold text-amber-600 hover:text-amber-500 dark:text-amber-400/90 dark:hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer group"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 4 Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card 1: 1v1 Arcade */}
          <div
            onClick={() => navigate("/games")}
            className="rounded-2xl p-5 bg-white/85 hover:bg-white border border-stone-200/90 hover:border-amber-500/40 shadow-sm hover:shadow-md dark:bg-[#121319]/85 dark:hover:bg-[#161822]/95 dark:border-white/8 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between h-48 group cursor-pointer"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-[#231b12] border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-sm">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white mt-3.5 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                1v1 Arcade
              </h3>
              <p className="text-xs text-stone-600 dark:text-muted-foreground leading-relaxed mt-1 line-clamp-2">
                Play fun games with a random stranger
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800 dark:bg-[#181922] dark:border-white/5 dark:text-amber-300/80">
                5 Games
              </span>
              <div className="w-8 h-8 rounded-full bg-stone-100 group-hover:bg-amber-500 group-hover:text-stone-950 text-stone-600 dark:bg-[#1c1e28] dark:group-hover:bg-amber-500 dark:group-hover:text-black dark:text-muted-foreground flex items-center justify-center transition-all">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Card 2: Private Room */}
          <div
            onClick={() => setShowJoinInput((prev) => !prev)}
            className={cn(
              "rounded-2xl p-5 border backdrop-blur-xl transition-all duration-300 flex flex-col justify-between h-48 group cursor-pointer shadow-sm hover:shadow-md",
              showJoinInput
                ? "bg-rose-50/90 dark:bg-[#181520] border-rose-500/60"
                : "bg-white/85 hover:bg-white border-stone-200/90 hover:border-rose-500/40 dark:bg-[#121319]/85 dark:hover:bg-[#161822]/95 dark:border-white/8"
            )}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-[#25151c] border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform shadow-sm">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white mt-3.5 group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
                Private Room
              </h3>
              <p className="text-xs text-stone-600 dark:text-muted-foreground leading-relaxed mt-1 line-clamp-2">
                Create a private room with friends
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-[11px] font-semibold text-stone-600 dark:bg-[#181922] dark:border-white/5 dark:text-muted-foreground">
                Custom Code / QR
              </span>
              <div className="w-8 h-8 rounded-full bg-stone-100 group-hover:bg-rose-500 group-hover:text-white text-stone-600 dark:bg-[#1c1e28] dark:group-hover:bg-rose-500 dark:group-hover:text-black dark:text-muted-foreground flex items-center justify-center transition-all">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Card 3: AI Wingman */}
          <div
            onClick={() => navigate("/ai-chat")}
            className="rounded-2xl p-5 bg-white/85 hover:bg-white border border-stone-200/90 hover:border-amber-500/40 shadow-sm hover:shadow-md dark:bg-[#121319]/85 dark:hover:bg-[#161822]/95 dark:border-white/8 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between h-48 group cursor-pointer"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-[#231c12] border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white mt-3.5 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                AI Wingman
              </h3>
              <p className="text-xs text-stone-600 dark:text-muted-foreground leading-relaxed mt-1 line-clamp-2">
                Chat with AI assistants like Claude, GPT, Gemini
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800 dark:bg-[#181922] dark:border-white/5 dark:text-amber-300/80">
                Multiple AI Models
              </span>
              <div className="w-8 h-8 rounded-full bg-stone-100 group-hover:bg-amber-500 group-hover:text-stone-950 text-stone-600 dark:bg-[#1c1e28] dark:group-hover:bg-amber-500 dark:group-hover:text-black dark:text-muted-foreground flex items-center justify-center transition-all">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Card 4: P2P File Drop */}
          <div
            onClick={() => navigate("/file-sharing")}
            className="rounded-2xl p-5 bg-white/85 hover:bg-white border border-stone-200/90 hover:border-amber-500/40 shadow-sm hover:shadow-md dark:bg-[#121319]/85 dark:hover:bg-[#161822]/95 dark:border-white/8 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between h-48 group cursor-pointer"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-[#221c15] border border-amber-600/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-sm">
                <Link2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white mt-3.5 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                P2P File Drop
              </h3>
              <p className="text-xs text-stone-600 dark:text-muted-foreground leading-relaxed mt-1 line-clamp-2">
                Share files directly and securely
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800 dark:bg-[#181922] dark:border-white/5 dark:text-amber-300/80">
                Zero Server Storage
              </span>
              <div className="w-8 h-8 rounded-full bg-stone-100 group-hover:bg-amber-500 group-hover:text-stone-950 text-stone-600 dark:bg-[#1c1e28] dark:group-hover:bg-amber-500 dark:group-hover:text-black dark:text-muted-foreground flex items-center justify-center transition-all">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Private Room Controls if toggled */}
        <AnimatePresence>
          {showJoinInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl p-4 bg-white/95 dark:bg-[#121319]/90 border border-rose-500/30 overflow-hidden space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-stone-900 dark:text-white">Create or Enter Room Code:</p>
                <button
                  onClick={generateAndJoinRoom}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
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
                    className="h-10 rounded-xl bg-stone-50 dark:bg-background/50 font-mono tracking-wider text-center text-sm font-bold uppercase border-stone-200 dark:border-white/10 text-stone-900 dark:text-white"
                    onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-primary cursor-pointer"
                    onClick={() => setShowScanner(true)}
                    title="Scan QR Code with Camera"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  onClick={handleJoinRoom}
                  className="h-10 px-5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 cursor-pointer shrink-0 shadow-sm"
                >
                  Join Room
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wide Code Studio Showcase Banner */}
        <div
          onClick={() => navigate("/code")}
          className="w-full rounded-2xl p-5 sm:p-6 bg-white/90 hover:bg-white border border-stone-200/90 hover:border-amber-500/40 shadow-lg hover:shadow-xl dark:bg-[#121319]/85 dark:hover:bg-[#151722]/95 dark:border-white/8 backdrop-blur-xl transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden group cursor-pointer mt-4"
        >
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-amber-500/10 via-amber-500/5 to-transparent pointer-events-none" />

          {/* Left side info */}
          <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-[#231b12] border border-amber-500/35 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-105 transition-transform shadow-md">
              <Code2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                Code Studio
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-muted-foreground mt-0.5 max-w-xl">
                Practice problems, run code, build and collaborate — all in one place.
              </p>

              {/* Capability Pills */}
              <div className="flex items-center gap-2 flex-wrap mt-3">
                {["Web IDE", "AI Help", "Practice Arena", "Share Projects"].map((pill) => (
                  <span
                    key={pill}
                    className="px-3 py-1 rounded-full bg-stone-100 dark:bg-[#181922] border border-stone-200 dark:border-white/8 text-[11px] text-stone-600 dark:text-muted-foreground font-medium hover:text-stone-900 dark:hover:text-white transition-colors"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right side Editor Mockup + Action buttons */}
          <div className="flex items-center gap-3 relative z-10 self-end md:self-center shrink-0">
            {/* Mini Code Editor Graphic */}
            <div className="hidden sm:flex flex-col w-56 rounded-lg bg-stone-900 dark:bg-[#0b0c10] border border-stone-800 dark:border-white/10 p-2.5 shadow-inner">
              <div className="flex items-center gap-1.5 pb-2 border-b border-white/5">
                <div className="w-2 h-2 rounded-full bg-rose-500/80" />
                <div className="w-2 h-2 rounded-full bg-amber-500/80" />
                <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-10 h-1.5 rounded-full bg-cyan-400/80" />
                  <div className="w-16 h-1.5 rounded-full bg-purple-400/80" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-1.5 rounded-full bg-amber-400/80" />
                  <div className="w-20 h-1.5 rounded-full bg-emerald-400/70" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-14 h-1.5 rounded-full bg-rose-400/70" />
                  <div className="w-8 h-1.5 rounded-full bg-cyan-300/80" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-12 h-1.5 rounded-full bg-yellow-400/70" />
                </div>
              </div>
            </div>

            {/* Amber Play Button */}
            <div className="w-10 h-10 rounded-full bg-[#e5a83b] hover:bg-[#f0be65] text-[#0a0a0c] flex items-center justify-center shadow-lg shadow-amber-500/25 transition-transform group-hover:scale-105 shrink-0">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>

            {/* Dark/Light Arrow Button */}
            <div className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 dark:bg-[#1c1e28] dark:hover:bg-[#252838] dark:text-white dark:border-white/10 group-hover:border-amber-500/40 flex items-center justify-center transition-all shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Realtime Platform Ticker */}
        <div className="pt-2">
          <HomeLiveTicker />
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
              Designed for <span className="bg-gradient-to-r from-[#f0be65] via-[#e5a83b] to-[#d48c18] bg-clip-text text-transparent drop-shadow-sm">speed, privacy & fun</span>
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto">
              Test out real IncogTalk capabilities right now before jumping into a conversation.
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
            <div className="md:col-span-2 rounded-3xl border border-primary/30 bg-gradient-to-br from-card/90 via-card/60 to-amber-950/20 backdrop-blur-2xl p-6 sm:p-8 hover:border-primary/50 transition-all duration-300 shadow-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
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
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#f0be65] via-[#e5a83b] to-[#d48c18] hover:brightness-110 text-stone-950 font-bold shadow-md shadow-amber-500/20 cursor-pointer transition-all"
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
              Website vs <span className="bg-gradient-to-r from-[#f0be65] via-[#e5a83b] to-[#d48c18] bg-clip-text text-transparent drop-shadow-sm">Android App</span>
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto">
              Enjoy 1-Tap instant browser access or download the native Android app for hardware-level capabilities.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-primary/25 bg-card/60 backdrop-blur-xl shadow-2xl">
            <div className="overflow-x-auto touch-scroll">
              <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[480px]">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/50">
                    <th className="py-3 sm:py-4 px-3.5 sm:px-5 font-bold text-foreground">Capability</th>
                    <th className="py-3 sm:py-4 px-3.5 sm:px-5 font-bold text-foreground">Web Version</th>
                    <th className="py-3 sm:py-4 px-3.5 sm:px-5 font-bold text-primary">
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
                      <td className="py-3 px-3.5 sm:px-5 font-semibold text-foreground">{item.feature}</td>
                      <td className="py-3 px-3.5 sm:px-5 text-muted-foreground text-xs">{item.web}</td>
                      <td className="py-3 px-3.5 sm:px-5 text-xs font-semibold">
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
      <footer className="border-t border-border/40 px-4 sm:px-6 py-10 sm:py-12 pb-[max(env(safe-area-inset-bottom,0px),5rem)] lg:pb-12 bg-card/20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <BrandLogo className="h-9 w-9 drop-shadow-md" />
            <div>
              <span className="font-display text-base font-bold text-foreground block leading-none">IncogTalk by Likki</span>
              <span className="text-[10px] text-muted-foreground">Anonymous Text, Video & Arcade Social Platform</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-muted-foreground font-semibold">
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
            © 2026 IncogTalk by Likki. Developed with 💜 by{" "}
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
            <DialogDescription className="text-xs text-muted-foreground">
              Scan a private room or game invite QR code to join immediately.
            </DialogDescription>
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
