import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, ArrowRight, Sparkles, Instagram, Linkedin, Mail, Link2, Copy, Check, Hash } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import FeatureBadges from "@/components/FeatureBadges";
import BottomNav from "@/components/BottomNav";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { emoji: "1️⃣", title: "Tap \"Start Chatting\"", desc: "We'll find a random stranger for you" },
  { emoji: "2️⃣", title: "Say hello!", desc: "Type a message and hit send" },
  { emoji: "3️⃣", title: "Next or stay", desc: "Click Next to meet someone new anytime" },
];

const Index = () => {
  const navigate = useNavigate();
  const onlineCount = useOnlineCount();
  const { toast } = useToast();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateRoomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setRoomCode(code);
  };

  const copyLink = async () => {
    if (!roomCode) return;
    const url = `${window.location.origin}/room/${roomCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Link copied!", description: "Share it with your friend to connect directly." });
    setTimeout(() => setCopied(false), 2000);
  };

  const joinMyRoom = () => {
    if (roomCode) navigate(`/room/${roomCode}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="lg:hidden">
        <Header onlineCount={onlineCount} />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl sm:text-5xl font-bold font-display leading-tight text-foreground">
            Connect
            <br />
            Anonymously
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-sm mx-auto">
            No registration. No tracking.
            <br />
            Just real talk with real people.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-sm"
        >
          <Button
            variant="glow"
            size="lg"
            className="w-full h-14 sm:h-16 text-base sm:text-lg font-semibold rounded-2xl gap-2"
            onClick={() => navigate("/chat")}
          >
            <MessageSquare className="h-5 w-5" />
            Start Chatting
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Free · No sign-up required · 100% anonymous
          </p>
        </motion.div>

        {/* Share Link to Connect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-sm"
        >
          {!roomCode ? (
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 text-sm font-medium rounded-2xl gap-2 border-primary/30 hover:border-primary/50"
              onClick={generateRoomCode}
            >
              <Link2 className="h-4 w-4 text-primary" />
              Share Link to Chat with a Friend
            </Button>
          ) : (
            <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-medium text-muted-foreground text-center">Your private room code</p>
              <div className="flex items-center gap-2 rounded-xl bg-secondary border border-border p-3">
                <Hash className="h-4 w-4 text-primary shrink-0" />
                <span className="font-mono text-lg font-bold tracking-widest text-foreground flex-1">
                  {roomCode}
                </span>
                <Button size="sm" variant="ghost" onClick={copyLink} className="h-8 px-2">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={copyLink} variant="secondary" size="sm" className="flex-1 gap-1.5 text-xs">
                  <Copy className="h-3.5 w-3.5" />
                  Copy Link
                </Button>
                <Button onClick={joinMyRoom} variant="glow" size="sm" className="flex-1 gap-1.5 text-xs">
                  <ArrowRight className="h-3.5 w-3.5" />
                  Enter Room
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Share the link, then tap "Enter Room" to wait for your friend
              </p>
            </div>
          )}
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-sm space-y-3"
        >
          <div className="flex items-center gap-2 justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">How it works</h2>
          </div>
          <div className="space-y-2">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-start gap-3 rounded-xl bg-secondary/40 border border-border/50 px-4 py-3"
              >
                <span className="text-lg shrink-0">{step.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <FeatureBadges />
      </main>

      <footer className="pb-20 text-center space-y-4">
        <div className="flex justify-center gap-8 text-sm text-muted-foreground">
          <span className="cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate("/info")}>About</span>
          <span className="cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate("/info")}>Safety</span>
          <span className="cursor-pointer hover:text-foreground transition-colors">Terms</span>
        </div>

        {/* Social links */}
        <div className="flex justify-center gap-4">
          <a href="https://instagram.com/Lucky__likhith" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-200" aria-label="Instagram">
            <Instagram className="h-4 w-4" />
          </a>
          <a href="https://www.linkedin.com/in/likhith-kami/" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-200" aria-label="LinkedIn">
            <Linkedin className="h-4 w-4" />
          </a>
          <a href="mailto:kamilikhith@gmail.com" className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-200" aria-label="Email">
            <Mail className="h-4 w-4" />
          </a>
        </div>

        <p className="text-xs text-muted-foreground/60">© 2026 L Chat. Developed with 💜 by <a href="https://www.linkedin.com/in/likhith-kami/" target="_blank" rel="noopener noreferrer" className="text-primary/70 hover:text-primary transition-colors">Likhith Kami</a></p>
      </footer>

      <BottomNav />
    </div>
  );
};

export default Index;
