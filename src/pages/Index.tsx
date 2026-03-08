import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare, ArrowRight, Sparkles, Shield, Zap, Users, Globe, Lock,
  EyeOff, Video, Gamepad2, Link2, Copy, Check, Hash, Share2,
  Instagram, Linkedin, Mail, ChevronDown,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useToast } from "@/hooks/use-toast";

const FEATURES = [
  { icon: Lock, title: "End-to-End Secure", desc: "Your conversations are fully encrypted and never stored on servers.", color: "text-primary" },
  { icon: EyeOff, title: "Zero Data Collection", desc: "No accounts, no tracking, no cookies. Complete digital privacy.", color: "text-primary" },
  { icon: Zap, title: "Instant Matching", desc: "Get paired with a stranger in seconds based on shared interests.", color: "text-primary" },
  { icon: Video, title: "Audio & Video Calls", desc: "Switch to voice or video mid-chat with one tap.", color: "text-primary" },
  { icon: Gamepad2, title: "Built-in Games", desc: "Play Truth or Dare, Tic-Tac-Toe, and more while chatting.", color: "text-primary" },
  { icon: Globe, title: "Global Community", desc: "Meet people from around the world, anytime, anywhere.", color: "text-primary" },
];

const STATS = [
  { value: "100%", label: "Anonymous" },
  { value: "0", label: "Data Stored" },
  { value: "24/7", label: "Available" },
  { value: "∞", label: "Conversations" },
];

const STEPS = [
  { num: "01", title: "Hit Start", desc: "No signup needed — just tap the button and go." },
  { num: "02", title: "Get Matched", desc: "We'll pair you with a random stranger instantly." },
  { num: "03", title: "Start Talking", desc: "Chat, call, play games — it's all up to you." },
];

const TESTIMONIALS = [
  { text: "Finally an anonymous chat that actually feels safe. The UI is gorgeous too!", author: "Anonymous User" },
  { text: "Love the video call feature. Made a friend across the globe in 5 minutes.", author: "Happy Chatter" },
  { text: "The built-in games make waiting for a match actually fun.", author: "Game Lover" },
];

const Index = () => {
  const navigate = useNavigate();
  const onlineCount = useOnlineCount();
  const { toast } = useToast();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const appOrigin = "https://ohmeglebylikki.lovable.app";
  const getRoomUrl = (code: string) => `${appOrigin}/room/${code}`;

  const generateAndJoinRoom = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setRoomCode(code);
  };

  const shareAndJoin = async () => {
    if (!roomCode) return;
    const url = getRoomUrl(roomCode);
    await navigator.clipboard.writeText(url);
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
      <section className="relative flex flex-col items-center justify-center px-6 pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pt-28 lg:pb-36">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-accent/5 blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="relative z-10 text-center space-y-6 max-w-2xl mx-auto"
        >
          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary"
          >
            <span className="h-2 w-2 rounded-full bg-online animate-pulse" />
            {onlineCount.toLocaleString()} people chatting now
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display leading-[1.1] text-foreground">
            Talk to{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Anyone
            </span>
            <br />
            Stay{" "}
            <span className="bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
              Anonymous
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto">
            No sign-ups. No tracking. Just real conversations with real people from around the world.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="glow"
              size="lg"
              className="w-full sm:w-auto h-14 sm:h-16 px-8 text-base sm:text-lg font-semibold rounded-2xl gap-2"
              onClick={() => navigate("/chat")}
            >
              <MessageSquare className="h-5 w-5" />
              Start Chatting
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-14 sm:h-16 px-8 text-base font-medium rounded-2xl gap-2 border-primary/20 hover:border-primary/40"
              onClick={generateAndJoinRoom}
            >
              <Link2 className="h-4 w-4 text-primary" />
              Invite a Friend
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Free forever · No registration · Works on any device
          </p>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground/40 animate-bounce" />
        </motion.div>
      </section>

      {/* ═══════════ PRIVATE ROOM PANEL (conditional) ═══════════ */}
      {roomCode && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-6 pb-12"
        >
          <div className="max-w-md mx-auto space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-sm font-semibold text-foreground text-center">🔗 Your private room is ready!</p>
            <div className="flex items-center gap-2 rounded-xl bg-secondary border border-border p-3">
              <Hash className="h-4 w-4 text-primary shrink-0" />
              <span className="font-mono text-lg font-bold tracking-widest text-foreground flex-1">{roomCode}</span>
              <Button size="sm" variant="ghost" onClick={copyLink} className="h-8 px-2">
                {copied ? <Check className="h-4 w-4 text-online" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-3">
              <span className="text-[10px] text-muted-foreground">Share via</span>
              <a href={`https://wa.me/?text=${encodeURIComponent(`Let's chat anonymously! ${getRoomUrl(roomCode)}`)}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(142_70%_45%)]/10 border border-[hsl(142_70%_45%)]/20 text-[hsl(142_70%_45%)] hover:bg-[hsl(142_70%_45%)]/20 transition-all" title="WhatsApp">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <a href={`https://www.instagram.com/direct/new/?text=${encodeURIComponent(`Let's chat anonymously! ${getRoomUrl(roomCode)}`)}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(330_70%_55%)]/10 border border-[hsl(330_70%_55%)]/20 text-[hsl(330_70%_55%)] hover:bg-[hsl(330_70%_55%)]/20 transition-all" title="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href={`mailto:?subject=${encodeURIComponent("Let's chat anonymously!")}&body=${encodeURIComponent(`Join me: ${getRoomUrl(roomCode)}`)}`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all" title="Email">
                <Mail className="h-4 w-4" />
              </a>
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button onClick={() => navigator.share({ title: "L Chat", text: "Join me for an anonymous chat", url: getRoomUrl(roomCode) }).catch(() => {})} className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/50 border border-border text-foreground hover:bg-accent transition-all" title="More">
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
      <section className="border-y border-border/50 bg-card/30">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/50">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center py-8 sm:py-10"
            >
              <span className="text-3xl sm:text-4xl font-bold font-display text-primary">{stat.value}</span>
              <span className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════ FEATURES GRID ═══════════ */}
      <section className="px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary mb-4">
              <Sparkles className="h-3 w-3" /> Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground">
              Everything you need,{" "}
              <span className="text-primary">nothing you don't</span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              Built for privacy-first conversations with powerful features baked in.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.08 }}
                className="group rounded-2xl border border-border/50 bg-card/50 p-6 hover:border-primary/30 hover:bg-card/80 transition-all duration-300"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="px-6 py-16 sm:py-24 bg-card/30 border-y border-border/50">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground">
              Three steps. <span className="text-primary">That's it.</span>
            </h2>
          </motion.div>

          <div className="space-y-6 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center sm:text-left"
              >
                <span className="text-5xl sm:text-6xl font-bold font-display text-primary/15 leading-none">
                  {step.num}
                </span>
                <h3 className="text-lg font-semibold text-foreground -mt-3 sm:-mt-4 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground">
              Loved by <span className="text-primary">thousands</span>
            </h2>
          </motion.div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border/50 bg-card/50 p-6"
              >
                <p className="text-sm text-foreground leading-relaxed mb-4">"{t.text}"</p>
                <p className="text-xs text-muted-foreground font-medium">— {t.author}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="px-6 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-10 sm:p-14 relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/5 blur-[80px] rounded-full" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-4">
              Ready to connect?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Join thousands of people having anonymous conversations right now. It takes less than 3 seconds.
            </p>
            <Button
              variant="glow"
              size="lg"
              className="h-14 px-10 text-base font-semibold rounded-2xl gap-2"
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
      <footer className="border-t border-border/50 px-6 py-10 pb-24 lg:pb-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-base font-bold text-foreground">L Chat</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate("/info")}>About</span>
            <span className="cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate("/info")}>Safety</span>
            <span className="cursor-pointer hover:text-foreground transition-colors">Terms</span>
          </div>

          <div className="flex items-center gap-3">
            <a href="https://instagram.com/Lucky__likhith" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all" aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://www.linkedin.com/in/likhith-kami/" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all" aria-label="LinkedIn">
              <Linkedin className="h-4 w-4" />
            </a>
            <a href="mailto:kamilikhith@gmail.com" className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all" aria-label="Email">
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          © 2026 L Chat. Developed with 💜 by{" "}
          <a href="https://www.linkedin.com/in/likhith-kami/" target="_blank" rel="noopener noreferrer" className="text-primary/70 hover:text-primary transition-colors">
            Likhith Kami
          </a>
        </p>
      </footer>

      <BottomNav />
    </div>
  );
};

export default Index;
