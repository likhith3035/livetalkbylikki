import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MessageSquare, ArrowRight, Sparkles, Shield, Zap, Users, Globe, Lock,
  EyeOff, Video, Gamepad2, Link2, Copy, Check, Hash, Share2,
  Instagram, Linkedin, Mail, ChevronDown, Phone, Timer,
  Heart, Search, Pin, Image, Palette, MapPin,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { useSEO } from "@/hooks/use-seo";

const FEATURES = [
  { icon: Lock, title: "End-to-End Secure", desc: "Your conversations are fully encrypted and never stored on servers." },
  { icon: EyeOff, title: "Zero Data Collection", desc: "No accounts, no tracking, no cookies. Complete digital privacy." },
  { icon: Zap, title: "Instant Matching", desc: "Get paired with a stranger in seconds based on shared interests." },
  { icon: Video, title: "Audio & Video Calls", desc: "Switch to voice or video mid-chat with one tap. Screen sharing included." },
  { icon: Gamepad2, title: "Built-in Games", desc: "Play Truth or Dare, Tic-Tac-Toe, and more while chatting." },
  { icon: Heart, title: "Reactions & Emojis", desc: "React to messages with ❤️ 😂 🔥 and more — just like Instagram DMs." },
  { icon: Image, title: "GIFs & Images", desc: "Send GIFs from Tenor or share images directly in your conversations." },
  { icon: Timer, title: "Disappearing Messages", desc: "Set messages to auto-delete after 30s, 1 min, or 5 min for extra privacy." },
  { icon: Search, title: "Message Search", desc: "Instantly find any message in your conversation with full-text search." },
  { icon: Pin, title: "Pin Messages", desc: "Pin important messages to keep them accessible throughout the chat." },
  { icon: Palette, title: "Chat Themes", desc: "Customize your chat with color themes like Ocean, Sunset, and Neon." },
  { icon: Globe, title: "Global Community", desc: "Meet people from around the world, anytime, anywhere." },
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

const Index = () => {
  const navigate = useNavigate();
  const onlineCount = useOnlineCount();
  const { toast } = useToast();
  useSEO({ title: "LiveTalk – Talk to Anyone Instantly", description: "LiveTalk by Likki – Free anonymous chat with strangers. No signup, no tracking. Video calls, text chat, games & more." });
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const appOrigin = "https://LiveTalkbylikki.lovable.app";
  const getRoomUrl = (code: string) => `${appOrigin}/room/${code}`;

  const generateAndJoinRoom = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setRoomCode(code);
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
      <section className="relative flex flex-col items-center justify-center px-6 pt-16 pb-24 sm:pt-24 sm:pb-32 lg:pt-32 lg:pb-40 animated-gradient-bg">
        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[15%] w-72 h-72 rounded-full bg-primary/10 blur-[100px] float-slow" />
          <div className="absolute top-[40%] right-[10%] w-96 h-96 rounded-full bg-accent/8 blur-[120px] float-medium" />
          <div className="absolute bottom-[10%] left-[40%] w-64 h-64 rounded-full bg-primary/6 blur-[80px] float-fast" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
          className="relative z-10 text-center space-y-8 max-w-3xl mx-auto"
        >
          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm px-5 py-2 text-sm font-medium text-primary pulse-glow-ring"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-online opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-online" />
            </span>
            {onlineCount.toLocaleString()} people chatting now
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold font-display leading-[1.05] tracking-tight text-foreground">
            <span className="text-gradient">LiveTalk</span>
            {" "}by Likki
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground/80 font-medium max-w-2xl mx-auto">
            The #1 Omegle Alternative — Chat Anonymously with Strangers
          </p>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            No sign-ups. No tracking. Just real conversations with real people from around the world. LiveTalk 2 brings back everything you loved — better, safer, and faster.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            <Button
              variant="glow"
              size="lg"
              className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-10 text-base sm:text-lg font-semibold rounded-2xl gap-2.5 shadow-xl shadow-primary/20"
              onClick={() => navigate("/chat")}
            >
              <MessageSquare className="h-5 w-5" />
              Start Chatting
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-14 sm:h-16 px-8 text-base font-medium rounded-2xl gap-2.5 border-border/80 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              onClick={generateAndJoinRoom}
            >
              <Link2 className="h-4 w-4 text-primary" />
              Invite a Friend
            </Button>
          </motion.div>

          <p className="text-xs text-muted-foreground/60">
            Free forever · No registration · Works on any device
          </p>
        </motion.div>

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

      {/* ═══════════ PRIVATE ROOM PANEL ═══════════ */}
      {roomCode && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-6 pb-12"
        >
          <div className="max-w-md mx-auto space-y-4 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-5 shadow-lg shadow-primary/5">
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
        </motion.section>
      )}

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
              <span className="text-4xl sm:text-5xl font-bold font-display text-gradient">{stat.value}</span>
              <span className="text-xs sm:text-sm text-muted-foreground mt-2 font-medium">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════ FEATURES GRID ═══════════ */}
      <section className="px-6 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
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
            variants={stagger.container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={stagger.item}
                className="group glow-card rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-6 sm:p-7 hover:bg-card/70 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15 mb-5 group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-500">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="px-6 py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-card/20 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.04)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.04)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-foreground">
              Three steps. <span className="text-gradient">That's it.</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 200 }}
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
          </div>
        </div>
      </section>

      {/* ═══════════ CONNECT WITH FRIEND ═══════════ */}
      <section className="px-6 py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 animated-gradient-bg opacity-30 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
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

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-0 relative">
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
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 200 }}
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
          </div>

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
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-foreground">
              Loved by <span className="text-gradient">thousands</span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger.container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-4 sm:gap-5 sm:grid-cols-3"
          >
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                variants={stagger.item}
                className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-6 sm:p-7 hover:bg-card/60 hover:shadow-lg transition-all duration-500 hover:-translate-y-1"
              >
                <span className="text-3xl mb-4 block">{t.emoji}</span>
                <p className="text-sm sm:text-base text-foreground leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                    {t.author[0]}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{t.author}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="px-6 py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center rounded-3xl border border-primary/15 bg-card/30 backdrop-blur-sm p-10 sm:p-16 relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/8 blur-[100px] rounded-full" />
            <div className="absolute -bottom-10 right-0 w-[200px] h-[200px] bg-accent/5 blur-[60px] rounded-full" />
          </div>
          <div className="relative z-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 border border-primary/20 mx-auto mb-6">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-foreground mb-4">
              Ready to connect?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-base sm:text-lg">
              Join thousands of people having anonymous conversations right now.
            </p>
            <Button
              variant="glow"
              size="lg"
              className="h-14 sm:h-16 px-10 sm:px-12 text-base sm:text-lg font-semibold rounded-2xl gap-2.5 shadow-xl shadow-primary/20"
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
            <Logo className="h-10 w-10 drop-shadow-md" />
            <span className="font-display text-lg font-bold text-foreground">LiveTalk by Likki</span>
          </div>

          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <Link to="/info" className="hover:text-foreground transition-colors duration-200">About</Link>
            <Link to="/info" className="hover:text-foreground transition-colors duration-200">Safety</Link>
            <Link to="/info" className="hover:text-foreground transition-colors duration-200">Terms</Link>
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
          LiveTalk by Likki — the best Omegle 2 alternative for anonymous chatting. Meet strangers, make friends, play games. LiveTalk is free, private, and works on any device.
        </p>

        <p className="text-center text-xs text-muted-foreground/50 mt-4">
          © 2026 LiveTalk by Likki. Developed with 💜 by{" "}
          <a href="https://www.instagram.com/likhith_kami/" target="_blank" rel="noopener noreferrer" className="text-primary/60 hover:text-primary transition-colors">Likhith</a>
        </p>
      </footer>

      <BottomNav />
    </div>
  );
};

export default Index;
