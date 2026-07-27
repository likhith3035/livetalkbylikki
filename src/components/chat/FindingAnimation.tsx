import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";
import { X, Globe, Zap, Users, UserPlus, Bot, Sparkles, Share2, Copy, Check, FilterX, Lightbulb, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface FindingAnimationProps {
  searchElapsed: number;
  onStop: () => void;
  interests: string[];
  onInviteFriend?: () => void;
  onStartAIChat?: () => void;
  onClearInterests?: () => void;
}

const STATUS_MESSAGES = [
  "Scanning for online users...",
  "Filtering by interests...",
  "Optimizing connection path...",
  "Matching with someone compatible...",
  "Entering the digital lobby...",
  "Almost there...",
];

const FUN_TRIVIA = [
  "Over 3 million random conversations happen every day on LiveTalk!",
  "Common interests increase chat duration by over 300%.",
  "Pro Tip: You can play Tic-Tac-Toe or draw on the live canvas during calls!",
  "Zero-Log Privacy: Transient signaling data is wiped immediately upon connecting.",
];

// Stable particle data
const PARTICLES = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  x: (i * 80) - 160,
  y: (i * 60) - 120,
  duration: 3.5 + i * 0.7,
  delay: i * 0.9,
  dy: -60 - i * 15,
}));

export const FindingAnimation = ({
  searchElapsed,
  onStop,
  interests,
  onInviteFriend,
  onStartAIChat,
  onClearInterests,
}: FindingAnimationProps) => {
  const [statusIdx, setStatusIdx] = useState(0);
  const [triviaIdx, setTriviaIdx] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const triviaInterval = setInterval(() => {
      setTriviaIdx((prev) => (prev + 1) % FUN_TRIVIA.length);
    }, 4500);
    return () => clearInterval(triviaInterval);
  }, []);

  const handleShareInvite = () => {
    if (onInviteFriend) {
      onInviteFriend();
      return;
    }

    const shareUrl = `${window.location.origin}/chat`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      toast({
        title: "🚀 Link Copied!",
        description: "Share this link with a friend to chat instantly while waiting.",
      });
    }

    if (navigator.share) {
      navigator.share({
        title: "Join me on LiveTalk",
        text: "Hey! Come chat with me on LiveTalk!",
        url: shareUrl,
      }).catch(() => {});
    }
  };

  const isTakingLonger = searchElapsed >= 8;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-6 relative overflow-hidden">
      {/* Background glow & particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px]" />
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute left-1/2 top-1/2 h-1 w-1 bg-primary rounded-full"
            style={{ x: p.x, y: p.y }}
            animate={{ y: [p.y, p.y + p.dy, p.y], opacity: [0, 0.5, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-6 relative z-10 w-full max-w-md"
      >
        {/* Searching animation */}
        <div className="relative flex items-center justify-center h-44 sm:h-52">
          {/* Outer slow ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border border-primary/10"
          />

          {/* Inner ring with dot */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full border border-primary/20"
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary)/0.8)]" />
          </motion.div>

          {/* Center logo */}
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-20 bg-card/80 backdrop-blur-sm p-4 sm:p-5 rounded-[2rem] border border-border shadow-xl"
          >
            <BrandLogo className="h-12 w-12 sm:h-14 sm:w-14" />
          </motion.div>

          {/* Status label */}
          <AnimatePresence mode="wait">
            <motion.div
              key={statusIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="absolute -bottom-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border shadow-sm"
            >
              {statusIdx % 3 === 0
                ? <Globe className="h-3 w-3 text-primary" />
                : statusIdx % 3 === 1
                ? <Users className="h-3 w-3 text-primary" />
                : <Zap className="h-3 w-3 text-primary" />}
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                {STATUS_MESSAGES[statusIdx]}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

          {/* Elapsed Timer & Privacy Badge */}
          <div className="space-y-2">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black font-display text-foreground tracking-tighter uppercase italic leading-none">
                Searching<span className="text-primary animate-pulse">...</span>
              </h2>
              <div className="flex items-center justify-center gap-2 px-3 py-1 rounded-lg bg-primary/5 border border-primary/10 w-fit mx-auto">
                <div className="h-1.5 w-1.5 rounded-full bg-online animate-pulse" />
                <span className="text-xs font-bold text-muted-foreground tabular-nums">
                  {searchElapsed}s elapsed
                </span>
              </div>
            </div>

            {/* Beginner Reassurance Badge */}
            <p className="text-[11px] font-semibold text-emerald-400/90 flex items-center justify-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 py-1 px-3 rounded-full w-fit mx-auto">
              🔒 Privacy Safe: Your camera & mic are OFF until matched
            </p>

            {/* Target Interests Pill */}
            {interests.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 max-w-xs mx-auto pt-1">
                {interests.map((i) => (
                  <span key={i} className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-lg uppercase tracking-wide">
                    #{i}
                  </span>
                ))}
              </div>
            )}
          </div>

        {/* ── Interactive Assistant Card when searchElapsed >= 8s ── */}
        <AnimatePresence>
          {isTakingLonger && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.96 }}
              className="bg-card/90 backdrop-blur-xl border border-primary/30 p-4 sm:p-5 rounded-3xl shadow-2xl space-y-4 text-left relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/15 text-primary">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                      Don't Wait Alone!
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Invite a friend or play while waiting
                    </p>
                  </div>
                </div>
                <span className="text-[9px] bg-primary/20 text-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Fast Options
                </span>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Invite Friend Button */}
                <button
                  onClick={handleShareInvite}
                  className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 hover:border-primary/60 transition-all text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <UserPlus className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    {copiedLink ? (
                      <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> Copied
                      </span>
                    ) : (
                      <Share2 className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-foreground font-display uppercase tracking-wide mt-1">
                    Invite Friend
                  </span>
                  <span className="text-[9px] text-muted-foreground leading-tight">
                    Share instant room link
                  </span>
                </button>

                {/* AI Wingman Fallback Button */}
                {onStartAIChat && (
                  <button
                    onClick={onStartAIChat}
                    className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-secondary/80 hover:bg-secondary border border-border hover:border-primary/40 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <Bot className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                      <Sparkles className="h-3 w-3 text-primary/60" />
                    </div>
                    <span className="text-xs font-bold text-foreground font-display uppercase tracking-wide mt-1">
                      Chat with AI
                    </span>
                    <span className="text-[9px] text-muted-foreground leading-tight">
                      No wait, instant reply
                    </span>
                  </button>
                )}
              </div>

              {/* Clear Interests button if active */}
              {interests.length > 0 && onClearInterests && (
                <button
                  onClick={onClearInterests}
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-xl bg-muted/50 border border-border text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FilterX className="h-3 w-3 text-amber-400" />
                  Match Faster (Clear Interest Filters)
                </button>
              )}

              {/* Rotating Fun Trivia */}
              <div className="pt-2 border-t border-border/40 flex items-start gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={triviaIdx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-[10px] text-muted-foreground leading-snug font-medium italic"
                  >
                    "{FUN_TRIVIA[triviaIdx]}"
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cancel Button */}
        <div className="pt-2">
          <Button
            variant="danger"
            size="lg"
            onClick={onStop}
            className="h-12 px-8 text-sm font-black uppercase tracking-widest italic rounded-2xl gap-2 active:scale-95 transition-transform"
          >
            <X className="h-4 w-4" />
            Cancel Search
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
