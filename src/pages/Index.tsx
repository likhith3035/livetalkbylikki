import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MessageSquare, ArrowRight, Sparkles, Shield, Zap, Users, Lock,
  EyeOff, Video, Gamepad2, Link2, Copy, Check, Hash, Share2,
  Instagram, Linkedin, Mail, Camera, Smartphone, Globe, Download, CheckCircle2, ChevronRight, Bot, Phone, Play, ShieldAlert, Cpu
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
import LiquidBackground from "@/components/LiquidBackground";
import { cn } from "@/lib/utils";

// ─── Data & Constants ───

const FEATURES = [
  { 
    icon: Lock, 
    title: "End-to-End Encrypted", 
    desc: "Direct peer-to-peer data channels. Messages and media are never stored on any server.",
    gradient: "from-blue-500/20 to-indigo-500/20",
    iconColor: "text-blue-400"
  },
  { 
    icon: EyeOff, 
    title: "Zero Account Needed", 
    desc: "No email, phone number, or sign-up. Completely anonymous with zero user tracking.",
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400"
  },
  { 
    icon: Zap, 
    title: "Sub-Second Matching", 
    desc: "Smart interest matching algorithm pairs you with real online strangers in seconds.",
    gradient: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-400"
  },
  { 
    icon: Video, 
    title: "HD Video & Audio Calls", 
    desc: "Switch seamlessly from text to crystal-clear WebRTC video and audio calls with 1-tap.",
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-400"
  },
  { 
    icon: Gamepad2, 
    title: "Built-in Games & Canvas", 
    desc: "Break the ice with Tic-Tac-Toe, Rock-Paper-Scissors, and interactive shared drawing canvas.",
    gradient: "from-rose-500/20 to-red-500/20",
    iconColor: "text-rose-400"
  },
  { 
    icon: Bot, 
    title: "AI Personalities", 
    desc: "Chat with multi-provider AI companions (OpenAI, Gemini, Claude, Ollama) anytime you want.",
    gradient: "from-cyan-500/20 to-blue-500/20",
    iconColor: "text-cyan-400"
  },
];

const METRICS = [
  { label: "Average Match Time", value: "< 2 Sec", subtext: "Lightning fast pairing", icon: Zap, color: "text-amber-400" },
  { label: "Privacy Protection", value: "100%", subtext: "No logs or databases", icon: Shield, color: "text-emerald-400" },
  { label: "Active Countries", value: "150+", subtext: "Global community", icon: Globe, color: "text-blue-400" },
  { label: "Platform Access", value: "Web & APK", subtext: "Works on all devices", icon: Smartphone, color: "text-purple-400" },
];

const STEPS = [
  { num: "01", title: "Tap Start Chat", desc: "No registration or credentials needed. Access instantly from any browser.", icon: Zap },
  { num: "02", title: "Instant Match", desc: "Our engine pairs you with a random real stranger matching your optional topics.", icon: Users },
  { num: "03", title: "Text, Video & Play", desc: "Enjoy anonymous text, high-definition video calls, or fun multiplayer mini-games.", icon: MessageSquare },
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

// Animations
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Simulated Interactive Live Preview Component ───
const LiveChatPreview = () => {
  const [messages, setMessages] = useState<Array<{ id: number; text: string; sender: "stranger" | "you" | "system"; time: string }>>([
    { id: 1, text: "Hey there! Greetings from Tokyo 🇯🇵", sender: "stranger", time: "10:42 AM" },
    { id: 2, text: "Hey! Cool to meet you! How's Tokyo tonight?", sender: "you", time: "10:42 AM" },
    { id: 3, text: "Amazing! Listening to Lofi beats 🎧 Want to start a quick video call or play Tic-Tac-Toe?", sender: "stranger", time: "10:43 AM" },
  ]);

  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: 4, text: "🎥 Stranger requested a Video Call", sender: "system", time: "10:43 AM" },
      ]);
    }, 4500);

    return () => clearTimeout(timer1);
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto rounded-3xl border border-primary/20 bg-card/60 backdrop-blur-2xl p-4 sm:p-5 shadow-2xl shadow-primary/10 overflow-hidden relative group">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
          <div>
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>Stranger #4829</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/15 text-primary font-mono border border-primary/20">Active</span>
            </p>
            <p className="text-[10px] text-muted-foreground">Random Match • Encrypted Channel</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="h-7 px-2 rounded-lg bg-secondary/60 border border-border/40 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <Video className="h-3.5 w-3.5 text-primary" />
            <span>HD Video</span>
          </div>
        </div>
      </div>

      {/* Message list simulation */}
      <div className="py-3 space-y-2.5 min-h-[160px] flex flex-col justify-end text-xs">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "flex flex-col max-w-[85%]",
              m.sender === "you" && "ml-auto items-end",
              m.sender === "stranger" && "mr-auto items-start",
              m.sender === "system" && "mx-auto items-center text-center max-w-[90%]"
            )}
          >
            {m.sender === "system" ? (
              <span className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-semibold text-primary shadow-sm flex items-center gap-1.5 my-1 animate-pulse">
                {m.text}
              </span>
            ) : (
              <div
                className={cn(
                  "p-3 rounded-2xl leading-relaxed shadow-sm font-medium",
                  m.sender === "you"
                    ? "bg-primary text-primary-foreground rounded-br-xs"
                    : "bg-secondary/80 border border-border/50 text-foreground rounded-bl-xs"
                )}
              >
                {m.text}
              </div>
            )}
            <span className="text-[9px] text-muted-foreground/60 px-1 mt-0.5">{m.time}</span>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-muted-foreground text-[11px] italic pl-1">
            <span className="flex gap-1 items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:0.3s]" />
            </span>
            <span>Stranger is typing...</span>
          </motion.div>
        )}
      </div>

      {/* Decorative interactive prompt */}
      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground/70">✨ Simulated preview of LiveTalk chat screen</span>
        <span className="text-primary font-bold hover:underline cursor-pointer">Live Demo →</span>
      </div>
    </div>
  );
};

// ─── Main Landing Page Component ───
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
  const [activeTab, setActiveTab] = useState<"match" | "private" | "ai">("match");
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

    if (joinCode.length < 3 || joinCode.length > 30) {
      toast({ title: "Invalid code", description: "Room code must be between 3 and 30 characters.", variant: "destructive" });
      return;
    }
    navigate(`/room/${joinCode.toUpperCase()}`);
  };

  const [customRoomName, setCustomRoomName] = useState("");

  const generateAndJoinRoom = (givenCode?: string) => {
    let code = (typeof givenCode === "string" ? givenCode : customRoomName).trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (!code) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (code.length < 3) {
      toast({ title: "Invalid Name", description: "Custom room code must be at least 3 characters.", variant: "destructive" });
      return;
    }
    setShowJoinInput(false);
    setRoomCode(code);
    sessionStorage.setItem("echo_created_room", code);
    toast({ title: "🔗 Private Room Created!", description: `Room Code: ${code}. Entering room...` });
    navigate(`/room/${code}`);
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
    <div className="flex w-full min-h-full flex-col bg-background overflow-x-hidden relative">
      <LiquidBackground />

      {/* Header for Mobile */}
      <div className="lg:hidden relative z-30">
        <Header onlineCount={onlineCount} />
      </div>

      {/* Background Decorative Tech Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-40" />

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative flex flex-col items-center justify-start text-center px-4 sm:px-6 pt-6 pb-12 sm:pt-10 sm:pb-16 lg:pt-14 lg:pb-20 overflow-visible">
        
        {/* Glow Spheres */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[550px] rounded-full bg-gradient-to-tr from-primary/20 via-purple-600/15 to-indigo-600/10 blur-[140px] pointer-events-none -z-30" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          
          {/* Top Pill Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 sm:gap-2.5 rounded-full border border-primary/30 bg-card/80 backdrop-blur-xl px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-foreground shadow-lg shadow-primary/5 max-w-full flex-wrap justify-center text-center"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-emerald-400 font-extrabold">{onlineCount.toLocaleString()} Online Now</span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <Shield className="h-3 w-3 text-primary inline shrink-0" /> 100% Free & Anonymous
            </span>
          </motion.div>

          {/* Hero Main Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-6xl lg:text-7xl font-black font-display leading-[1.08] tracking-tight max-w-full px-1"
          >
            Talk to anyone, <br />
            <span className="bg-gradient-to-r from-primary via-purple-400 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_10px_20px_rgba(168,85,247,0.3)]">
              anonymously
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed font-medium break-words text-wrap px-2"
          >
            No sign-ups. No tracking. Just real, instant conversations with people from around the world.
          </motion.p>

          {/* Developer credit tag */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80 font-medium max-w-full flex-wrap"
          >
            <span>Crafted with 💜 by</span>
            <a 
              href="https://devlikhith.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary font-bold hover:underline underline-offset-4 flex items-center gap-1 bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full transition-all hover:bg-primary/20"
            >
              <span>Likhith Kami (Likki)</span>
              <ChevronRight className="h-3 w-3" />
            </a>
          </motion.div>

          {/* ══════════ HERO INTERACTIVE COMMAND CENTER CARD ══════════ */}
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-lg mx-auto pt-2 px-1"
          >
            <div className="rounded-3xl border border-primary/30 bg-card/90 backdrop-blur-2xl p-4 sm:p-7 shadow-[0_25px_60px_-15px_rgba(147,51,234,0.25)] relative overflow-hidden text-left space-y-4 sm:space-y-5 w-full max-w-full box-border">
              
              {/* PRIMARY ACTION — Instant Chat */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span>Random Stranger Chat</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                    Instant Match
                  </span>
                </div>

                <Button
                  variant="glow"
                  size="lg"
                  className="w-full h-14 sm:h-16 text-base sm:text-xl font-black rounded-2xl gap-3 shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                  onClick={() => navigate("/chat")}
                >
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform shrink-0" />
                  <span>Start Anonymous Chat</span>
                  <ArrowRight className="h-5 w-5 ml-auto group-hover:translate-x-1 transition-transform shrink-0" />
                </Button>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground text-center font-medium leading-normal px-1 break-words">
                  Connects you with a random stranger online. No account or profile needed.
                </p>
              </div>

              {/* DIVIDER */}
              <div className="relative flex items-center justify-center py-0.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60" />
                </div>
                <span className="relative bg-card px-3 text-[10px] uppercase font-bold text-muted-foreground/70 tracking-wider">
                  or choose a feature
                </span>
              </div>

              {/* SECONDARY DIRECT ACTIONS */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                <Button
                  variant="outline"
                  className="h-12 text-xs font-bold rounded-xl gap-2 border-primary/30 hover:border-primary hover:bg-primary/10 transition-all flex items-center justify-start px-2.5 sm:px-3 min-w-0"
                  onClick={generateAndJoinRoom}
                >
                  <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <Link2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left truncate min-w-0">
                    <p className="leading-none text-foreground font-bold truncate">Create Room</p>
                    <p className="text-[9px] text-muted-foreground font-normal truncate">Invite a friend</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className={cn(
                    "h-12 text-xs font-bold rounded-xl gap-2 border-primary/30 hover:border-primary hover:bg-primary/10 transition-all flex items-center justify-start px-2.5 sm:px-3 min-w-0",
                    showJoinInput && "bg-primary/10 border-primary"
                  )}
                  onClick={() => setShowJoinInput(!showJoinInput)}
                >
                  <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left truncate min-w-0">
                    <p className="leading-none text-foreground font-bold truncate">Join Room</p>
                    <p className="text-[9px] text-muted-foreground font-normal truncate">Enter 6-digit code</p>
                  </div>
                </Button>
              </div>

              {/* EXPANDABLE JOIN ROOM CODE INPUT */}
              <AnimatePresence>
                {showJoinInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 pt-1 border-t border-border/40 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-foreground">Enter Room Code from your friend:</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          placeholder="e.g. A8K3P9 or LIKKI-HANGOUT"
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                          className="h-11 rounded-xl bg-background/50 font-mono tracking-wider text-center text-sm sm:text-base font-bold uppercase"
                          onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-9 w-9 text-muted-foreground hover:text-primary"
                          onClick={() => setShowScanner(true)}
                          title="Scan QR Code with Camera"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button onClick={handleJoinRoom} variant="glow" className="h-11 px-4 sm:px-5 rounded-xl text-xs font-bold shrink-0">
                        Join Room
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI CHAT DIRECT BUTTON */}
              <Button
                variant="ghost"
                className="w-full h-auto min-h-11 py-2.5 text-xs font-bold rounded-xl gap-2 border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/15 text-purple-400 transition-all flex items-center justify-between px-3 text-left"
                onClick={() => navigate("/ai-chat")}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Bot className="h-4 w-4 text-purple-400 shrink-0" />
                  <span className="truncate text-[11px] sm:text-xs">Chat with AI Friend (ChatGPT / Claude / Gemini)</span>
                </div>
                <ChevronRight className="h-4 w-4 opacity-70 shrink-0" />
              </Button>

              {/* APK DOWNLOAD FOOTER BANNER */}
              <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                    📱
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground flex items-center gap-1">
                      <span>Android App</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">v2.4</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">Direct APK • Background Calling Support</p>
                  </div>
                </div>
                <ApkDownloadButton variant="compact" />
              </div>
            </div>
          </motion.div>

          {/* 3-STEP QUICK HOW IT WORKS PILLS */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-lg mx-auto pt-2">
            {STEPS.map((s, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-3 rounded-2xl bg-card/50 border border-border/40 backdrop-blur-md transition-all hover:border-primary/40 group">
                <span className="text-xs font-black text-primary mb-0.5">{s.num}</span>
                <span className="text-xs font-bold text-foreground">{s.title}</span>
                <span className="text-[10px] text-muted-foreground hidden sm:block">{s.desc}</span>
              </div>
            ))}
          </div>

          {/* Age restriction pill */}
          <div className="pt-2">
            <span className="px-3 py-1 bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-extrabold uppercase rounded-full tracking-widest inline-flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" /> Adults Only 18+
            </span>
          </div>
        </div>
      </section>

      {/* ══════════ LIVE INTERACTIVE DEMO PREVIEW SECTION ══════════ */}
      <section className="px-4 sm:px-6 py-10 sm:py-16 relative">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Interactive UI Preview
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display">
              Designed for <span className="text-gradient">speed & privacy</span>
            </h2>
          </div>

          <LiveChatPreview />
        </div>
      </section>

      {/* ══════════ METRICS & TRUST COUNTER BAR ══════════ */}
      <section className="px-4 sm:px-6 py-12 border-y border-border/40 bg-card/20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {METRICS.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-5 rounded-2xl bg-card/40 border border-border/40 backdrop-blur-sm flex flex-col items-center text-center space-y-1 hover:border-primary/30 transition-all"
            >
              <m.icon className={cn("h-6 w-6 mb-1", m.color)} />
              <span className="text-2xl sm:text-3xl font-black font-display tracking-tight text-foreground">{m.value}</span>
              <span className="text-xs font-bold text-foreground/90">{m.label}</span>
              <span className="text-[10px] text-muted-foreground">{m.subtext}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════ APPLE/LINEAR-STYLE BENTO GRID FEATURES ══════════ */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 relative">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Next-Gen Technology
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display leading-tight">
              Built for <span className="text-gradient">speed, privacy & fun</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
              Everything you need for instant anonymous human connection, zero registration required.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Bento Card 1 — Featured WebRTC Video & Audio (Span 2) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 rounded-3xl border border-primary/30 bg-gradient-to-br from-card/90 via-card/60 to-primary/10 backdrop-blur-2xl p-6 sm:p-8 hover:border-primary/50 transition-all duration-300 shadow-2xl relative overflow-hidden group flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/25 transition-all" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30 text-primary">
                    <Video className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    HD P2P WebRTC
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-foreground mb-2">Dual P2P WebRTC Video & Voice</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
                    Peer-to-peer encrypted calls with zero intermediary server recording. Direct device-to-device audio & video streams.
                  </p>
                </div>
              </div>

              {/* Live Signal Pulse Micro-Preview */}
              <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-xs font-mono text-muted-foreground relative z-10">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-foreground font-bold">Latency: 28ms</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-1 bg-primary/40 rounded-full animate-bounce" />
                  <span className="h-5 w-1 bg-primary rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="h-4 w-1 bg-primary/70 rounded-full animate-bounce [animation-delay:0.3s]" />
                  <span className="text-[10px] text-primary font-bold ml-1">AUDIO ACTIVE</span>
                </div>
              </div>
            </motion.div>

            {/* Bento Card 2 — Instant QR Private Rooms (Span 1) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-primary/30 bg-card/80 backdrop-blur-2xl p-6 hover:border-primary/50 transition-all duration-300 shadow-xl relative overflow-hidden group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
                    <Lock className="h-6 w-6" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                    Private Rooms
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground">Instant QR & Code Sharing</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Generate private rooms with 6-digit codes or custom slugs (`LIKKI-HANGOUT`) and 1-tap QR scan.
                </p>
              </div>

              {/* QR Scan Micro-Preview */}
              <div className="mt-4 p-3 rounded-2xl bg-background/60 border border-border/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                    QR
                  </div>
                  <span className="font-mono text-xs font-bold text-foreground">A8K3P9</span>
                </div>
                <span className="text-[10px] font-bold text-primary hover:underline cursor-pointer">Scan to Join →</span>
              </div>
            </motion.div>

            {/* Bento Card 3 — AI Wingman Assistant (Span 1) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="rounded-3xl border border-primary/30 bg-card/80 backdrop-blur-2xl p-6 hover:border-primary/50 transition-all duration-300 shadow-xl relative overflow-hidden group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                    <Bot className="h-6 w-6" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                    AI Wingman
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground">Smart AI Personalities</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Chat with custom AI companions powered by ChatGPT, Claude, Gemini & Ollama anytime.
                </p>
              </div>

              <div className="mt-4 p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-purple-300">🤖 AI Wingman Ready</span>
                <ChevronRight className="h-4 w-4 text-purple-400" />
              </div>
            </motion.div>

            {/* Bento Card 4 — Built-In Arcade Mini-Games & Story Cards (Span 2) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2 rounded-3xl border border-primary/30 bg-gradient-to-br from-card/90 via-card/60 to-purple-900/15 backdrop-blur-2xl p-6 sm:p-8 hover:border-primary/50 transition-all duration-300 shadow-2xl relative overflow-hidden group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                    <Gamepad2 className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                    Arcade & Story Cards
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-foreground mb-2">Built-in Games & Instagram Story Exporter</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
                    Play Tic-Tac-Toe, Canvas Drawing, and Rock-Paper-Scissors live in chat. Export 9:16 Story Cards directly to Instagram Stories or TikTok.
                  </p>
                </div>
              </div>

              {/* Interactive Micro Buttons */}
              <div className="mt-6 pt-4 border-t border-border/40 grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40 text-foreground">
                  ❌ Tic-Tac-Toe ⭕
                </div>
                <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40 text-foreground">
                  🎨 Canvas Draw
                </div>
                <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40 text-purple-300">
                  📸 9:16 Story Card
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ══════════ WEB VS MOBILE APK COMPARISON ══════════ */}
      <section className="px-4 sm:px-6 py-16 border-t border-border/40 bg-card/10">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Smartphone className="h-3.5 w-3.5" /> Web vs Android App
            </span>
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight">
              Website vs <span className="text-gradient">Mobile APK</span>
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto">
              Enjoy One-Tap browser access or download the native Android app for hardware features.
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
                      <td className="py-3.5 px-5 font-semibold text-foreground">{item.feature}</td>
                      <td className="py-3.5 px-5 text-muted-foreground text-xs">{item.web}</td>
                      <td className="py-3.5 px-5 text-xs font-semibold">
                        <span className={item.isApkBest ? "text-emerald-400 font-bold" : "text-foreground"}>
                          {item.apk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-5 border-t border-border/40 bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground text-center sm:text-left">
                <span className="font-semibold text-foreground">Want native background calls & hardware biometric lock?</span>
              </div>
              <ApkDownloadButton variant="compact" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-xl mx-auto text-center rounded-3xl border border-primary/30 bg-card/40 backdrop-blur-2xl p-8 sm:p-14 relative overflow-hidden shadow-2xl shadow-primary/10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/15 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 space-y-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30 mx-auto">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-display leading-tight">
              Ready to start chatting?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base leading-relaxed">
              Join thousands of people having anonymous text and video conversations right now.
            </p>
            <Button
              variant="glow"
              size="lg"
              className="h-15 px-10 text-base font-extrabold rounded-2xl gap-3 shadow-xl shadow-primary/25 hover:scale-105 transition-all"
              onClick={() => navigate("/chat")}
            >
              <MessageSquare className="h-5 w-5" />
              Start Anonymous Chat Now
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
              <span className="text-[10px] text-muted-foreground">Anonymous Text & Video Social Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground font-semibold">
            <Link to="/info" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/safety" className="hover:text-foreground transition-colors">Safety</Link>
            <Link to="/guidelines" className="hover:text-foreground transition-colors">Guidelines</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </div>

          <div className="flex items-center gap-3">
            <a href="https://instagram.com/Lucky__likhith" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground hover:text-primary hover:scale-110 transition-all" aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://www.linkedin.com/in/likhith-kami/" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground hover:text-primary hover:scale-110 transition-all" aria-label="LinkedIn">
              <Linkedin className="h-4 w-4" />
            </a>
            <a href="mailto:kamilikhith@gmail.com" className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground hover:text-primary hover:scale-110 transition-all" aria-label="Email">
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
            <a href="https://devlikhith.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-primary/70 hover:text-primary">Kami Likhith Portfolio</a>
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
