import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatQuickReactionsProps {
  onSelectReaction: (emoji: string) => void;
  disabled?: boolean;
}

const QUICK_EMOJIS = [
  { emoji: "❤️", label: "Love" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "🚀", label: "Hype" },
  { emoji: "⚡", label: "Electric" },
  { emoji: "😂", label: "Laugh" },
  { emoji: "💯", label: "Facts" },
];

export const ChatQuickReactions: React.FC<ChatQuickReactionsProps> = ({
  onSelectReaction,
  disabled = false,
}) => {
  if (disabled) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1.5 bg-card/60 border border-border/40 rounded-full backdrop-blur-md shadow-sm">
      {QUICK_EMOJIS.map((item) => (
        <motion.button
          key={item.emoji}
          whileHover={{ scale: 1.15, y: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelectReaction(item.emoji)}
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/40 hover:bg-primary/20 text-xs font-bold transition-colors shrink-0"
          title={`Send ${item.label}`}
        >
          <span className="text-sm">{item.emoji}</span>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase hidden sm:inline">
            {item.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
};

export default ChatQuickReactions;
