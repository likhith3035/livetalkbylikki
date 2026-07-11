import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MessageSquare, ArrowRight, Sparkles, Shield, Zap, Users, Globe, Lock,
  EyeOff, Video, Gamepad2, Link2, Copy, Check, Hash, Share2,
  Instagram, Linkedin, Mail, ChevronDown, Timer,
  Heart, Search, Pin, Image, Palette, Camera,
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
import AnimatedCounter from "@/components/AnimatedCounter";
import MockChatSimulator from "@/components/MockChatSimulator";
import { useIsMobile } from "@/hooks/use-mobile";
const CyberCorners = () => (
  <>
    <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-primary/40 pointer-events-none rounded-tl-[3px]" />
    <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-primary/40 pointer-events-none rounded-tr-[3px]" />
    <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-primary/40 pointer-events-none rounded-bl-[3px]" />
    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-primary/40 pointer-events-none rounded-br-[3px]" />
  </>
);

const FEATURES = [
  { icon: Lock, title: "End-to-End Secure", desc: "Your conversations are fully encrypted and never stored on servers.", code: "// AES_GCM_256" },
  { icon: EyeOff, title: "Zero Data Collection", desc: "No accounts, no tracking, no cookies. Complete digital privacy.", code: "// COOKIELESS_SESSION" },
  { icon: Zap, title: "Instant Matching", desc: "Get paired with a stranger in seconds based on shared interests.", code: "// MATCHMAKING_NODE" },
  { icon: Video, title: "Audio & Video Calls", desc: "Switch to voice or video mid-chat with one tap. Screen sharing included.", code: "// WEBRTC_STREAM" },
  { icon: Gamepad2, title: "Built-in Games", desc: "Play Truth or Dare, Tic-Tac-Toe, and more while chatting.", code: "// PEER_GAME_ENGINE" },
  { icon: Heart, title: "Reactions & Emojis", desc: "React to messages with ❤️ 😂 🔥 and more — just like Instagram DMs.", code: "// SYNC_REACTION" },
  { icon: Image, title: "GIFs & Images", desc: "Send GIFs from Tenor or share images directly in your conversations.", code: "// TENOR_API" },
  { icon: Timer, title: "Disappearing Messages", desc: "Set messages to auto-delete after 30s, 1 min, or 5 min for extra privacy.", code: "// TIMED_TTL_DELETE" },
  { icon: Search, title: "Message Search", desc: "Instantly find any message in your conversation with full-text search.", code: "// LOCAL_DB_INDEX" },
  { icon: Pin, title: "Pin Messages", desc: "Pin important messages to keep them accessible throughout the chat.", code: "// CACHED_PIN_NODE" },
  { icon: Palette, title: "Chat Themes", desc: "Customize your chat with color themes like Ocean, Sunset, and Neon.", code: "// HSL_THEMING" },
  { icon: Globe, title: "Global Community", desc: "Meet people from around the world, anytime, anywhere.", code: "// WAN_PEER_ROUTING" },
];

const STATS = [
  { value: "100%", label: "Anonymous" },
  { value: "0", label: "Data Stored" },
  { value: "24/7", label: "Available" },
  { value: "∞", label: "Conversations" },
];

const STEPS = [
  { num: "01", title: "Hit Start", desc: "No signup needed — just tap the button and go.", icon: Zap },
  { num: "02", title: "Get Matched", desc: "We'll pair you with a random stranger instantly.", icon: Users },
  { num: "03", title: "Start Talking", desc: "Chat, call, play games — it's all up to you.", icon: MessageSquare },
];

const TESTIMONIALS = [
  { text: "Finally an anonymous chat that actually feels safe. The UI is gorgeous too!", author: "Anonymous User", emoji: "✨" },
  { text: "Love the video call feature. Made a friend across the globe in 5 minutes.", author: "Happy Chatter", emoji: "🌍" },
  { text: "The built-in games make waiting for a match actually fun.", author: "Game Lover", emoji: "🎮" },
];

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } } },
};

const bentoStagger = {
  container: { 
    hidden: {}, 
    visible: { 
      transition: { 
        staggerChildren: 0.05 
      } 
    } 
  },
  item: { 
    hidden: { opacity: 0, scale: 0.9, y: 25 }, 
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { 
        type: "spring" as const, 
        stiffness: 120, 
        damping: 18 
      } 
    } 
  },
};

const stepsStagger = {
  container: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12
      }
    }
  },
  item: {
    hidden: { opacity: 0, x: -45 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  }
};

const testimonialStagger = {
  container: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },
  item: {
    hidden: { opacity: 0, scale: 0.85, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 110,
        damping: 16
      }
    }
  }
};

const FLOATING_TAGS = [
  { text: "#gaming 🎮", x: "12%", y: "15%", delay: 0 },
  { text: "#anime 🍿", x: "78%", y: "12%", delay: 1.5 },
  { text: "#music 🎵", x: "8%", y: "65%", delay: 0.8 },
  { text: "#coding 💻", x: "82%", y: "55%", delay: 2.2 },
  { text: "#movies 🎬", x: "42%", y: "82%", delay: 1.2 },
  { text: "#memes 😂", x: "52%", y: "18%", delay: 2.8 },
];

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

  // Track visits
  useAnalytics();

  const handleQrScanSuccess = (decodedText: string) => {
    let code = decodedText.trim().toUpperCase();
    const urlMatch = decodedText.match(/\/room\/([A-Za-z0-9]+)/i);
    if (urlMatch) {
      code = urlMatch[1].toUpperCase();
    }

    if (code.length >= 4) {
      toast({ title: "✅ QR Scanned!", description: `Joining room ${code}...` });
      setShowScanner(false);
      navigate(`/room/${code}`);
    } else {
      toast({ title: "Invalid QR", description: "This QR code doesn't contain a valid room code.", variant: "destructive" });
    }
  };

  const appOrigin = "https://LiveTalkbylikki.netlify.app";
  const getRoomUrl = (code: string) => `${appOrigin}/room/${code}`;

  const handleJoinRoom = async () => {
    if (!joinCode) {
      toast({ title: "Error", description: "Please enter a room code.", variant: "destructive" });
      return;
    }

    // Secure Admin Panel entry check via hashed passcode
    const rawCode = joinCode.trim();
    if (rawCode.startsWith("#") && rawCode.endsWith("#")) {
      try {
        const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawCode));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

        if (hashHex === "5f064930eee39bdc7dd4c2b651b159cf83782a11b543f87facd0fed6eb84ad14") {
          sessionStorage.setItem("echo_admin_token", "5f064930eee39bdc7dd4c2b651b159cf83782a11b543");
          toast({ title: "Authorized", description: "Navigating to Telemetry Control..." });
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
    
    // Scroll to panel after it renders
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
      <section className="relative flex flex-col justify-center px-6 pt-16 pb-24 sm:pt-24 sm:pb-32 lg:pt-24 lg:pb-32 animated-gradient-bg overflow-hidden">
        {/* Floating orbs */}
        {!isMobile && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[20%] left-[15%] w-72 h-72 rounded-full bg-primary/10 blur-[100px] float-slow" />
            <div className="absolute top-[40%] right-[10%] w-96 h-96 rounded-full bg-accent/8 blur-[120px] float-medium" />
            <div className="absolute bottom-[10%] left-[40%] w-64 h-64 rounded-full bg-primary/6 blur-[80px] float-fast" />
          </div>
        )}
          
          {/* Floating Interest Tags in background */}
          {!isMobile && FLOATING_TAGS.map((tag) => (
            <motion.button
              key={tag.text}
              className="absolute text-xs font-semibold bg-card/60 hover:bg-primary/10 border border-border/80 hover:border-primary/30 text-muted-foreground hover:text-primary backdrop-blur-sm px-3.5 py-1.5 rounded-full pointer-events-auto transition-all cursor-pointer shadow-sm hidden md:block"
              style={{ left: tag.x, top: tag.y }}
              animate={{
                y: [0, -15, 0],
                rotate: [0, 2, -2, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: tag.delay
              }}
              onClick={() => {
                toast({
                  title: "Interest pre-filled! 🎯",
                  description: `Added "${tag.text.split(" ")[0]}" to your matchmaking list.`,
                });
              }}
            >
              {tag.text}
            </motion.button>
          ))}

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

        {/* Futuristic Scanline Effect */}
        {!isMobile && (
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none animate-scanline z-10" />
        )}

        <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Content */}
          <div className="lg:col-span-7 text-left space-y-8 flex flex-col justify-center">
            {/* Futuristic Engine Descriptor */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05, type: "spring" }}
              className="text-[9px] font-mono font-bold tracking-[0.3em] text-primary/60 self-start border-l border-primary/40 pl-2 uppercase"
            >
              // INITIALIZING_PROTOCOL_v2.4
            </motion.div>

            {/* Highlights Row */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
              className="flex flex-wrap justify-start items-center gap-x-4 gap-y-2 mb-2"
            >
              {[
                "No Signup", "No Tracking", "No Storing", "Pure Privacy", "Unlimited Fun"
              ].map((text, i) => (
                <span key={text} className="flex items-center gap-2">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-foreground/50 whitespace-nowrap">
                    // {text}
                  </span>
                  {i < 4 && <span className="h-1.5 w-1.5 bg-primary/20 rotate-45" />}
                </span>
              ))}
            </motion.div>

            {/* Live badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 15 }}
              className="inline-flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary/5 backdrop-blur-sm px-5 py-2.5 text-xs font-mono font-bold tracking-wider text-primary pulse-glow-ring self-start relative"
            >
              <CyberCorners />
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-online opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-online" />
              </span>
              SYS_PEER_COUNT: {onlineCount.toLocaleString()}
            </motion.div>

            {/* Staggered Word Reveal Heading */}
            <h1 className="text-4xl xs:text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold font-display leading-[1.1] tracking-tight text-foreground break-words max-w-full flex flex-wrap gap-x-3 sm:gap-x-4">
              {["LiveTalk", "by", "Likki"].map((word, i) => (
                <span key={i} className="overflow-hidden inline-block py-1">
                  <motion.span
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                      delay: 0.25 + i * 0.1,
                    }}
                    className={`inline-block ${word === "LiveTalk" ? "text-gradient" : ""}`}
                  >
                    {word}
                  </motion.span>
                </span>
              ))}
            </h1>

            {/* Developer Credit */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, type: "spring", stiffness: 100, damping: 15 }}
              className="flex items-center gap-2 text-sm text-muted-foreground/60 font-medium tracking-wide uppercase"
            >
              <span>Developed with 💜 by</span>
              <a href="https://devlikhith.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-primary/80 hover:text-primary transition-colors hover:underline decoration-primary/30 underline-offset-4" title="Kami Likhith Portfolio">Likhith Kami</a>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, type: "spring", stiffness: 100, damping: 15 }}
              className="text-lg sm:text-xl lg:text-2xl text-gradient font-bold"
            >
              The #1 Omegle Alternative
            </motion.p>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, type: "spring", stiffness: 100, damping: 15 }}
              className="space-y-4 max-w-xl"
            >
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                No sign-ups. No tracking. Just real conversations with real people from around the world. LiveTalk 2 brings back everything you loved — better, safer, and faster.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, type: "spring", stiffness: 100, damping: 15 }}
              className="flex flex-col items-stretch sm:items-center justify-start gap-3 pt-2 w-full max-w-lg"
            >
              <Button
                variant="glow"
                size="lg"
                className="w-full h-14 sm:h-16 px-8 sm:px-10 text-base sm:text-lg font-semibold rounded-2xl gap-2.5 shadow-xl shadow-primary/20"
                onClick={() => navigate("/chat")}
              >
                <MessageSquare className="h-5 w-5" />
                Start Chatting
                <ArrowRight className="h-4 w-4" />
              </Button>

              {/* APK Download card */}
              <div className="w-full">
                <ApkDownloadButton variant="full" />
              </div>

              <div className="flex items-center justify-center gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1 h-11 px-4 text-xs font-medium rounded-xl gap-2 border-border/80 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                  onClick={generateAndJoinRoom}
                >
                  <Link2 className="h-3.5 w-3.5 text-primary" />
                  Invite Friend
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-11 px-4 text-xs font-medium rounded-xl gap-2 border-border/80 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
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
                  Join Room
                </Button>
              </div>
            </motion.div>

            <AnimatePresence>
              {showJoinInput && (
                <motion.div
                  key="join-room-panel"
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="w-full max-w-sm pt-2 overflow-hidden"
                >
                  <div ref={joinPanelRef} className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="ROOM CODE"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                        className="h-12 rounded-xl bg-background/50 backdrop-blur-sm border-primary/20 focus-visible:ring-primary/30 font-mono tracking-widest text-center text-lg uppercase pr-12"
                        maxLength={6}
                        onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-10 w-10 text-muted-foreground hover:text-primary rounded-lg"
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

            {/* ═══════════ PRIVATE ROOM PANEL ═══════════ */}
            {roomCode && (
              <motion.div
                key="invite-room-panel"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="w-full pt-4 scroll-mt-20"
              >
                <div ref={invitePanelRef} className="relative max-w-md space-y-4 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-5 shadow-lg shadow-primary/5">
                  <CyberCorners />
                  <p className="text-sm font-semibold text-foreground text-center">🔗 Your private room is ready!</p>
                  <div className="flex items-center gap-2 rounded-xl bg-secondary/80 border border-border p-3">
                    <Hash className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-mono text-lg font-bold tracking-widest text-foreground flex-1">{roomCode}</span>
                    <Button size="sm" variant="ghost" onClick={copyLink} className="h-8 px-2">
                      {copied ? <Check className="h-4 w-4 text-online" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-[10px] text-muted-foreground">Share via</span>
                    <a href={`https://wa.me/?text=${encodeURIComponent(`Let's chat anonymously! ${getRoomUrl(roomCode)}`)}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(142_70%_45%)]/10 border border-[hsl(142_70%_45%)]/20 text-[hsl(142_70%_45%)] hover:bg-[hsl(142_70%_45%)]/20 hover:scale-110 transition-all" title="WhatsApp">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><title>WhatsApp</title><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    </a>
                    <a href={`https://www.instagram.com/direct/new/?text=${encodeURIComponent(`Let's chat anonymously! ${getRoomUrl(roomCode)}`)}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(330_70%_55%)]/10 border border-[hsl(330_70%_55%)]/20 text-[hsl(330_70%_55%)] hover:bg-[hsl(330_70%_55%)]/20 hover:scale-110 transition-all" title="Instagram">
                      <Instagram className="h-4 w-4" />
                    </a>
                    <a href={`mailto:?subject=${encodeURIComponent("Let's chat anonymously!")}&body=${encodeURIComponent(`Join me: ${getRoomUrl(roomCode)}`)}`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 hover:scale-110 transition-all" title="Email">
                      <Mail className="h-4 w-4" />
                    </a>
                    {typeof navigator !== "undefined" && "share" in navigator && (
                      <button onClick={() => navigator.share({ title: "L Chat", text: "Join me for an anonymous chat", url: getRoomUrl(roomCode) }).catch(() => { })} className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/50 border border-border text-foreground hover:bg-accent hover:scale-110 transition-all" title="More">
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

            <div className="flex items-center gap-2 pt-2">
              <span className="px-3 py-1 bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-bold uppercase rounded-lg tracking-widest">Adults Only 18+</span>
            </div>
          </div>

          {/* Right Column: Chat Simulator Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.2 }}
            className="lg:col-span-5 flex justify-center items-center relative lg:pt-0 pt-8"
          >
            <div className="relative flex items-center justify-center">
              {/* Glow background behind simulator */}
              {!isMobile && (
                <div className="absolute -inset-4 rounded-[56px] bg-gradient-to-tr from-primary to-accent opacity-20 blur-xl animate-pulse" />
              )}

              {/* Left Floating Telemetry Panel */}
              {!isMobile && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7, type: "spring" }}
                  className="absolute right-[calc(100%+24px)] top-12 z-20 glass p-4 rounded-2xl border border-primary/20 w-44 font-mono text-[9px] space-y-2 shadow-2xl hover:scale-105 transition-transform hidden lg:block"
                >
                  <CyberCorners />
                  <p className="text-primary font-bold border-b border-primary/10 pb-1 flex items-center justify-between">
                    <span>SYS_DIAGNOSTICS</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-online animate-pulse" />
                  </p>
                  <div className="space-y-1.5 text-foreground/70">
                    <p className="flex justify-between"><span>CIPHER:</span> <span className="text-foreground font-semibold">AES_GCM_256</span></p>
                    <p className="flex justify-between"><span>MATCH_PING:</span> <span className="text-foreground font-semibold">24ms</span></p>
                    <p className="flex justify-between"><span>STABILITY:</span> <span className="text-foreground font-semibold">99.98%</span></p>
                    <p className="flex justify-between"><span>PORT_P2P:</span> <span className="text-foreground font-semibold">5004/UDP</span></p>
                    <p className="flex justify-between"><span>ENGINE:</span> <span className="text-foreground font-semibold">LiveTalk_v2.4</span></p>
                  </div>
                </motion.div>
              )}

              {/* Right Floating Security Panel */}
              {!isMobile && (
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className="absolute left-[calc(100%+24px)] bottom-12 z-20 glass p-4 rounded-2xl border border-primary/20 w-44 font-mono text-[9px] space-y-2 shadow-2xl hover:scale-105 transition-transform hidden lg:block"
                >
                  <CyberCorners />
                  <p className="text-primary font-bold border-b border-primary/10 pb-1 flex items-center justify-between">
                    <span>SEC_TELEMETRY</span>
                    <Shield className="h-3 w-3 text-primary" />
                  </p>
                  <div className="space-y-1.5 text-foreground/70">
                    <p className="flex justify-between"><span>METRICS:</span> <span className="text-online font-semibold">ZERO_LOGS</span></p>
                    <p className="flex justify-between"><span>TRACKING:</span> <span className="text-online font-semibold">BLOCKED</span></p>
                    <p className="flex justify-between"><span>SIGNUP_REQ:</span> <span className="text-online font-semibold">FALSE</span></p>
                    <p className="flex justify-between"><span>STORAGE:</span> <span className="text-online font-semibold">VOLATILE_RAM</span></p>
                  </div>
                </motion.div>
              )}

              <MockChatSimulator />
            </div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground animate-bounce" />
        </motion.div>
      </section>

      {/* ═══════════ STATS BAR ═══════════ */}
      <section className="border-y border-border/30 bg-card/20 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
              className="flex flex-col items-center py-10 sm:py-12 relative"
            >
              {i < 3 && <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-px bg-border/30 hidden sm:block" />}
              <span className="text-4xl sm:text-5xl font-bold font-display text-gradient">
                <AnimatedCounter value={stat.value} />
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground mt-2 font-medium">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════ FEATURES GRID ═══════════ */}
      <section className="px-6 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 100, damping: 16 }}
            className="text-center mb-14 sm:mb-20"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-5"
            >
              <Sparkles className="h-3.5 w-3.5" /> Features
            </motion.span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-foreground leading-tight">
              Everything you need,
              <br />
              <span className="text-gradient">nothing you don't</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto text-base sm:text-lg">
              Built for privacy-first conversations with powerful features baked in.
            </p>
          </motion.div>

          <motion.div
            variants={bentoStagger.container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-6 lg:grid-cols-12"
          >
            {FEATURES.map((feature, idx) => {
              // Custom span mapping for Bento Grid
              let spanClass = "lg:col-span-4 sm:col-span-2 col-span-12";
              if (idx === 0) spanClass = "lg:col-span-6 sm:col-span-3 col-span-12";
              else if (idx === 1) spanClass = "lg:col-span-6 sm:col-span-3 col-span-12";
              else if (idx === 2) spanClass = "lg:col-span-4 sm:col-span-3 col-span-12";
              else if (idx === 3) spanClass = "lg:col-span-8 sm:col-span-3 col-span-12";
              else if (idx === 4) spanClass = "lg:col-span-6 sm:col-span-3 col-span-12";
              else if (idx === 5) spanClass = "lg:col-span-6 sm:col-span-3 col-span-12";

              return (
                <motion.div
                  key={feature.title}
                  variants={bentoStagger.item}
                  className={`group glow-card rounded-3xl border border-border/40 bg-card/30 backdrop-blur-md p-7 hover:bg-card/60 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between relative overflow-hidden ${spanClass}`}
                >
                  <CyberCorners />
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/30 transition-all duration-500">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-mono text-[8px] sm:text-[9px] font-bold text-primary/50 tracking-wider">
                        {feature.code}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden sm:flex items-center gap-1.5 text-xs font-semibold text-primary">
                    Learn more <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="px-6 py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-card/20 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.04)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.04)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 100, damping: 16 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-foreground">
              Three steps. <span className="text-gradient">That's it.</span>
            </h2>
          </motion.div>

          <motion.div 
            variants={stepsStagger.container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid sm:grid-cols-3 gap-6 sm:gap-8"
          >
            {STEPS.map((step) => (
              <motion.div
                key={step.num}
                variants={stepsStagger.item}
                className="relative text-center group"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15 mx-auto mb-5 group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-500">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary/40 tracking-widest uppercase">Step {step.num}</span>
                <h3 className="text-xl font-semibold text-foreground mt-1 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ CONNECT WITH FRIEND ═══════════ */}
      <section className="px-6 py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 animated-gradient-bg opacity-30 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 100, damping: 16 }}
            className="text-center mb-14 sm:mb-20"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-5"
            >
              <Link2 className="h-3.5 w-3.5" /> Private Rooms
            </motion.span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-foreground leading-tight">
              Chat with <span className="text-gradient">your friend</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto text-base sm:text-lg">
              Create a private room and share the link — no sign-ups, no hassle.
            </p>
          </motion.div>

          <motion.div 
            variants={stepsStagger.container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid sm:grid-cols-3 gap-6 sm:gap-0 relative"
          >
            {/* Connecting lines (desktop) */}
            <div className="hidden sm:block absolute top-10 left-[calc(33.33%+8px)] right-[calc(33.33%+8px)] h-px bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40" />

            {[
              {
                num: "1",
                icon: Link2,
                title: "Create a Room",
                desc: 'Click "Invite a Friend" or use the Room button in chat to generate a unique 6-character code.',
                color: "primary",
              },
              {
                num: "2",
                icon: Share2,
                title: "Share the Link",
                desc: "Send the room code or link via WhatsApp, Instagram, Telegram, or any way you like.",
                color: "primary",
              },
              {
                num: "3",
                icon: MessageSquare,
                title: "Start Chatting!",
                desc: "Once your friend joins, you're instantly connected. Chat, call, play games — all private.",
                color: "primary",
              },
            ].map((step) => (
              <motion.div
                key={step.num}
                variants={stepsStagger.item}
                className="relative text-center group px-4"
              >
                {/* Step number circle */}
                <div className="relative mx-auto mb-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 border-2 border-primary/20 mx-auto group-hover:scale-110 group-hover:bg-primary/15 group-hover:border-primary/30 transition-all duration-500">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/30">
                    {step.num}
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px] mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-14"
          >
            <Button
              variant="glow"
              size="lg"
              className="h-14 px-10 text-base font-semibold rounded-2xl gap-2.5 shadow-xl shadow-primary/20"
              onClick={generateAndJoinRoom}
            >
              <Link2 className="h-5 w-5" />
              Create a Private Room
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 text-base font-medium rounded-2xl gap-2.5 border-border/80 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              onClick={() => navigate("/chat")}
            >
              Or Chat with a Stranger
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="px-6 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 100, damping: 16 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-foreground">
              Loved by <span className="text-gradient">thousands</span>
            </h2>
          </motion.div>

          <motion.div
            variants={testimonialStagger.container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid gap-6 sm:grid-cols-3"
          >
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                variants={testimonialStagger.item}
                className="rounded-3xl border border-border/40 bg-card/30 backdrop-blur-md p-8 hover:bg-card/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1.5 relative overflow-hidden group"
              >
                <CyberCorners />
                {/* Subtle backglow on card hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <span className="text-4xl mb-5 block">{t.emoji}</span>
                <p className="text-sm sm:text-base text-foreground leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {t.author[0]}
                  </div>
                  <div>
                    <p className="text-xs text-foreground font-semibold">{t.author}</p>
                    <p className="text-[10px] text-muted-foreground">Verified User</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="px-6 py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", stiffness: 100, damping: 16 }}
          className="max-w-3xl mx-auto text-center rounded-[32px] border border-primary/25 bg-card/25 backdrop-blur-md p-10 sm:p-16 relative overflow-hidden shadow-2xl"
        >
          <CyberCorners />
          {/* Animated decorative glow rings */}
          {!isMobile && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-40 -left-40 w-[600px] h-[400px] bg-primary/15 blur-[120px] rounded-full animate-pulse" />
              <div className="absolute -bottom-40 -right-40 w-[600px] h-[400px] bg-accent/10 blur-[120px] rounded-full animate-pulse" />
            </div>
          )}
          <div className="relative z-10 space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 border border-primary/20 mx-auto mb-2 shadow-inner">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold font-display text-foreground leading-tight">
              Ready to connect?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto text-base sm:text-lg leading-relaxed">
              Join thousands of people having anonymous, private conversations right now.
            </p>
            <div className="pt-4">
              <Button
                variant="glow"
                size="lg"
                className="h-14 sm:h-16 px-10 sm:px-12 text-base sm:text-lg font-semibold rounded-2xl gap-2.5 shadow-2xl shadow-primary/20 hover:scale-105 transition-all duration-300"
                onClick={() => navigate("/chat")}
              >
                <MessageSquare className="h-5 w-5" />
                Start Chatting Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
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
            <Link to="/info" className="hover:text-foreground transition-colors duration-200">About</Link>
            <Link to="/safety" className="hover:text-foreground transition-colors duration-200">Safety Center</Link>
            <Link to="/info" className="hover:text-foreground transition-colors duration-200">Help & FAQ</Link>
          </div>

          <div className="flex items-center gap-3">
            <a href="https://instagram.com/Lucky__likhith" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 hover:scale-110 transition-all duration-300" aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://www.linkedin.com/in/likhith-kami/" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 hover:scale-110 transition-all duration-300" aria-label="LinkedIn">
              <Linkedin className="h-4 w-4" />
            </a>
            <a href="mailto:kamilikhith@gmail.com" className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 hover:scale-110 transition-all duration-300" aria-label="Email">
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* SEO footer text */}
        <p className="text-center text-xs text-muted-foreground/40 mt-6 max-w-2xl mx-auto leading-relaxed">
          LiveTalk by Likki — the best anonymous chat app built by Likhith Kami (Likki). Meet strangers, make friends, and play games. Learn more about the developer and check out other Kami Likhith websites at <a href="https://devlikhith.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-primary underline font-medium">Kami Likhith Portfolio</a>.
        </p>

        <p className="text-center text-xs text-muted-foreground/50 mt-4">
          © 2026 LiveTalk by Likki. Developed with 💜 by{" "}
          <a href="https://devlikhith.vercel.app/" target="_blank" rel="noopener noreferrer me" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors font-medium">
Likhith Kami (Likki)</a>
        </p>

        <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mt-2 text-[10px] text-muted-foreground/40 font-semibold uppercase tracking-wider">
          <Link to="/guidelines" className="hover:text-primary transition-colors">Guidelines</Link>
          <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a>
          <Link to="/info" className="hover:text-primary transition-colors">About</Link>
          <a href="https://devlikhith.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors text-primary/70" title="Kami Likhith Portfolio & Websites">Developer Portfolio</a>
        </div>
      </footer>

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
