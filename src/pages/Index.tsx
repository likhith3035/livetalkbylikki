import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, ArrowRight, Sparkles, Instagram, Linkedin, Mail, Link2, Copy, Check, Hash, Share2 } from "lucide-react";
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
              {/* Share via apps */}
              <div className="flex items-center justify-center gap-3 pt-1">
                <span className="text-[10px] text-muted-foreground">Share via</span>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Let's chat anonymously! Join me here: ${window.location.origin}/room/${roomCode}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(142_70%_45%)]/10 border border-[hsl(142_70%_45%)]/20 text-[hsl(142_70%_45%)] hover:bg-[hsl(142_70%_45%)]/20 transition-all"
                  title="WhatsApp"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <a
                  href={`https://www.instagram.com/direct/new/?text=${encodeURIComponent(`Let's chat anonymously! ${window.location.origin}/room/${roomCode}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(330_70%_55%)]/10 border border-[hsl(330_70%_55%)]/20 text-[hsl(330_70%_55%)] hover:bg-[hsl(330_70%_55%)]/20 transition-all"
                  title="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href={`https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(`${window.location.origin}/room/${roomCode}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(55_100%_50%)]/10 border border-[hsl(55_100%_50%)]/20 text-[hsl(55_80%_45%)] hover:bg-[hsl(55_100%_50%)]/20 transition-all"
                  title="Snapchat"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.922-.237.195-.088.39-.137.584-.137.19 0 .375.056.535.168.39.272.39.72.343.96-.09.51-.45.814-.765 1.006-.39.24-.915.39-1.29.465-.12.03-.21.045-.27.06-.18.03-.36.12-.42.33-.03.12 0 .255.06.39.45.96 1.11 1.8 1.95 2.49.24.195.48.375.735.54.345.225.6.465.66.735.06.345-.21.645-.735.975-.645.39-1.425.57-1.875.63-.12.015-.195.03-.255.06-.09.045-.12.15-.165.3-.015.06-.03.135-.06.21-.09.3-.27.42-.69.42-.24 0-.54-.06-.87-.12-.54-.105-1.17-.225-1.92-.12-.675.09-1.29.48-1.95.9-.87.57-1.86 1.2-3.24 1.2s-2.37-.63-3.24-1.2c-.66-.42-1.275-.81-1.95-.9-.75-.105-1.38.015-1.92.12-.33.06-.63.12-.87.12-.39 0-.585-.105-.69-.42-.03-.075-.045-.15-.06-.21-.045-.15-.075-.255-.165-.3-.06-.03-.135-.045-.255-.06-.45-.06-1.23-.24-1.875-.63-.525-.33-.795-.63-.735-.975.06-.27.315-.51.66-.735.255-.165.495-.345.735-.54.84-.69 1.5-1.53 1.95-2.49.06-.135.09-.27.06-.39-.06-.21-.24-.3-.42-.33-.06-.015-.15-.03-.27-.06-.375-.075-.9-.225-1.29-.465-.315-.195-.675-.495-.765-1.005-.045-.24-.045-.69.345-.96.16-.112.345-.168.535-.168.195 0 .39.045.585.135.264.12.624.225.922.24.198 0 .327-.045.402-.09-.008-.165-.018-.33-.03-.51l-.003-.06c-.105-1.627-.225-3.654.3-4.848C5.862 1.07 9.217.793 10.207.793h1.999z"/></svg>
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent("Let's chat anonymously!")}&body=${encodeURIComponent(`Join me for an anonymous chat: ${window.location.origin}/room/${roomCode}`)}`}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
                  title="Email"
                >
                  <Mail className="h-4 w-4" />
                </a>
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
