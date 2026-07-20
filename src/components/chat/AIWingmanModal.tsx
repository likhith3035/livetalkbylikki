import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Heart, Dices, X, RefreshCw, MessageSquare, Flame, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AIWingmanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendPrompt: (promptText: string) => void;
  matchedInterests?: string[];
  strangerName?: string;
}

const WOULD_YOU_RATHER = [
  "⚡ Would You Rather: Have the ability to teleport anywhere instantly OR read people's minds?",
  "⚡ Would You Rather: Live in a futuristic sci-fi city OR in a peaceful magical fantasy kingdom?",
  "⚡ Would You Rather: Never need sleep again OR never get hungry/tired again?",
  "⚡ Would You Rather: Travel 100 years into the past OR 100 years into the future?",
  "⚡ Would You Rather: Always speak your mind out loud OR never speak again?",
  "⚡ Would You Rather: Have infinite free food for life OR infinite free travel for life?",
];

const ICEBREAKERS = [
  "🔮 Question for you: If our chat was a movie, what genre would it be?",
  "🍕 What is your single most controversial food opinion?",
  "🎧 What song is currently stuck in your head on repeat?",
  "✈️ If you could board a plane to any country right now, where would you go?",
  "🎮 Are you a night owl or an early bird?",
];

const TRUTHS_LIES = [
  "🎯 2 Truths & 1 Lie Game! Guess which one is the lie: 1) I love pineapple pizza 2) I once met a celebrity 3) I can speak 3 languages!",
  "🎯 2 Truths & 1 Lie Game! Guess the lie: 1) I've stayed awake for 36 hours straight 2) I love scary movies 3) I've won a gaming tournament!",
];

export const AIWingmanModal: React.FC<AIWingmanModalProps> = ({
  isOpen,
  onClose,
  onSendPrompt,
  matchedInterests = [],
  strangerName = "Stranger",
}) => {
  const [activeTab, setActiveTab] = useState<"vibe" | "wyr" | "icebreaker" | "game">("vibe");
  const [vibeScore, setVibeScore] = useState<number | null>(null);
  const [vibeTitle, setVibeTitle] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateVibe = () => {
    setIsCalculating(true);
    setVibeScore(null);
    setTimeout(() => {
      const base = matchedInterests.length * 15 + 70;
      const score = Math.min(99, Math.max(78, Math.floor(base + Math.random() * 14)));
      setVibeScore(score);
      setIsCalculating(false);

      if (score > 92) setVibeTitle("✨ Cosmic Soulmates!");
      else if (score > 85) setVibeTitle("🔥 High Voltage Synergy!");
      else setVibeTitle("⚡ Instant Connection!");
    }, 1200);
  };

  const handleSend = (text: string) => {
    onSendPrompt(text);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative z-10 w-full max-w-lg bg-card/95 border border-primary/30 rounded-3xl p-6 shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-primary via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-primary/20">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground tracking-tight flex items-center gap-1.5">
                    AI Wingman & Vibe Check
                  </h2>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Instant Icebreakers & Conversation Sparkers
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-2xl mb-4 border border-border/40">
              <button
                onClick={() => setActiveTab("vibe")}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  activeTab === "vibe" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Heart className="h-3.5 w-3.5" />
                <span>Vibe Check</span>
              </button>
              <button
                onClick={() => setActiveTab("wyr")}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  activeTab === "wyr" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Would You Rather</span>
              </button>
              <button
                onClick={() => setActiveTab("icebreaker")}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  activeTab === "icebreaker" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Icebreakers</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="min-h-[220px] flex flex-col justify-between">
              {activeTab === "vibe" && (
                <div className="flex flex-col items-center justify-center text-center py-4 space-y-4">
                  {vibeScore === null && !isCalculating ? (
                    <div className="space-y-4">
                      <div className="h-24 w-24 rounded-full bg-primary/10 border-2 border-dashed border-primary/40 flex items-center justify-center mx-auto text-primary">
                        <Flame className="h-10 w-10 animate-bounce" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-sm">Calculate Vibe Synergy with {strangerName}</h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                          AI analyzes matched interests and chat frequency to determine your compatibility score!
                        </p>
                      </div>
                      <Button variant="glow" onClick={calculateVibe} className="rounded-2xl px-6">
                        <Sparkles className="h-4 w-4 mr-2" /> Start Vibe Check
                      </Button>
                    </div>
                  ) : isCalculating ? (
                    <div className="space-y-3 py-6">
                      <RefreshCw className="h-10 w-10 text-primary animate-spin mx-auto" />
                      <p className="text-xs font-bold uppercase tracking-widest text-primary animate-pulse">
                        Analyzing Cosmic Vibe...
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-4 w-full"
                    >
                      <div className="relative h-28 w-28 mx-auto flex items-center justify-center">
                        <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-secondary"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-primary"
                            strokeDasharray={`${vibeScore}, 100`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-2xl font-black text-foreground">{vibeScore}%</span>
                          <span className="text-[9px] font-bold uppercase text-primary">Match</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-primary">{vibeTitle}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          You and {strangerName} have exceptional vibe chemistry!
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSend(`🔮 AI Vibe Check Result: ${vibeScore}% Compatibility! ${vibeTitle}`)}
                        className="rounded-2xl border-primary/40 text-primary font-bold text-xs"
                      >
                        Share Score in Chat 🚀
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}

              {activeTab === "wyr" && (
                <div className="space-y-2.5 py-2">
                  <p className="text-xs text-muted-foreground font-medium mb-2">
                    Tap any dilemma to send directly into chat:
                  </p>
                  {WOULD_YOU_RATHER.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(item)}
                      className="w-full text-left p-3 rounded-2xl bg-secondary/40 hover:bg-primary/15 border border-border/50 text-xs font-semibold text-foreground transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === "icebreaker" && (
                <div className="space-y-2.5 py-2">
                  <p className="text-xs text-muted-foreground font-medium mb-2">
                    Instant fun questions to break the ice:
                  </p>
                  {ICEBREAKERS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(item)}
                      className="w-full text-left p-3 rounded-2xl bg-secondary/40 hover:bg-primary/15 border border-border/50 text-xs font-semibold text-foreground transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AIWingmanModal;
