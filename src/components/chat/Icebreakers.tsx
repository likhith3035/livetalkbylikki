import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageSquare, HelpCircle, Laugh, Dices, Flame, Lightbulb, Compass, HeartHandshake } from "lucide-react";

interface Icebreaker {
  text: string;
  icon: React.ReactNode;
  label: string;
  category: "starter" | "question" | "fact" | "funny" | "creative" | "deep";
}

export const ALL_ICEBREAKERS: Icebreaker[] = [
  { text: "Hey there! How's your day going? 👋", icon: <MessageSquare className="h-3.5 w-3.5 text-blue-400" />, label: "Say Hello", category: "starter" },
  { text: "What's the most interesting thing that happened to you today? 🤔", icon: <HelpCircle className="h-3.5 w-3.5 text-purple-400" />, label: "Ask Question", category: "question" },
  { text: "Tell me a random fun fact about yourself! ✨", icon: <Sparkles className="h-3.5 w-3.5 text-amber-400" />, label: "Fun Fact", category: "fact" },
  { text: "Quick! You've got 5 seconds to tell me your favorite joke! 😂", icon: <Laugh className="h-3.5 w-3.5 text-pink-400" />, label: "Tell Joke", category: "funny" },
  { text: "If you could teleport anywhere in the world right now, where would you go? ✈️", icon: <Compass className="h-3.5 w-3.5 text-emerald-400" />, label: "Travel Goal", category: "creative" },
  { text: "What's a movie or show you can watch 100 times without getting bored? 🎬", icon: <Flame className="h-3.5 w-3.5 text-orange-400" />, label: "Fav Movie", category: "question" },
  { text: "Would you rather explore space 🌌 or the deep ocean 🌊?", icon: <Lightbulb className="h-3.5 w-3.5 text-cyan-400" />, label: "Space vs Ocean", category: "creative" },
  { text: "What's the weirdest food combo that you secretly love? 🍕🍍", icon: <Sparkles className="h-3.5 w-3.5 text-yellow-400" />, label: "Weird Food", category: "funny" },
  { text: "If you could have any superpower for one day, what would it be? 🦸", icon: <Flame className="h-3.5 w-3.5 text-rose-400" />, label: "Superpower", category: "creative" },
  { text: "What song is stuck in your head right now? 🎵", icon: <HeartHandshake className="h-3.5 w-3.5 text-indigo-400" />, label: "Fav Song", category: "question" },
];

interface IcebreakersProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
  isSilentMatch?: boolean;
}

const Icebreakers = ({ onSelect, disabled, isSilentMatch = false }: IcebreakersProps) => {
  const [currentPool, setCurrentPool] = useState<Icebreaker[]>(ALL_ICEBREAKERS.slice(0, 5));
  const [isSpinning, setIsSpinning] = useState(false);

  if (disabled) return null;

  const handleShuffle = () => {
    setIsSpinning(true);
    setTimeout(() => {
      const shuffled = [...ALL_ICEBREAKERS].sort(() => 0.5 - Math.random());
      setCurrentPool(shuffled.slice(0, 5));
      setIsSpinning(false);
    }, 250);
  };

  const handleRandomInstantSend = () => {
    const randomItem = ALL_ICEBREAKERS[Math.floor(Math.random() * ALL_ICEBREAKERS.length)];
    onSelect(randomItem.text);
  };

  return (
    <div className="space-y-1.5 py-1">
      {isSilentMatch && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold"
        >
          <Sparkles className="h-3 w-3 animate-pulse text-amber-400 shrink-0" />
          <span>Room is quiet! Break the ice with a fun topic below 👇</span>
        </motion.div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar -mx-1 px-1">
        {/* Shuffle/Generate Random Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShuffle}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary/20 border border-primary/40 px-3 py-1 text-[11px] font-bold text-primary hover:bg-primary/30 transition-all shadow-sm shrink-0"
          title="Shuffle Icebreaker Topics"
        >
          <Dices className={`h-3.5 w-3.5 ${isSpinning ? "animate-spin" : ""}`} />
          <span>Shuffle</span>
        </motion.button>

        {/* Icebreaker Pills */}
        {currentPool.map((item, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(item.text)}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-secondary/70 border border-border/60 px-3.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-secondary hover:border-primary/30 transition-all shadow-sm shrink-0"
          >
            {item.icon}
            <span>{item.label}</span>
          </motion.button>
        ))}

        {/* Instant Random Topic Sender */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRandomInstantSend}
          className="flex items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 px-3 py-1.5 text-[11px] font-extrabold text-purple-300 hover:opacity-90 transition-all shrink-0"
        >
          <Sparkles className="h-3 w-3 text-pink-400" />
          <span>Surprise Question 🎲</span>
        </motion.button>
      </div>
    </div>
  );
};

export default Icebreakers;
