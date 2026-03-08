import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const EMOJI_CATEGORIES: Record<string, string[]> = {
  "😀": ["😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊", "😋", "😎", "😍", "🥰", "😘", "😗", "😙", "😚", "🙂", "🤗", "🤩", "🤔", "🤨", "😐", "😑", "😶", "🙄", "😏", "😣", "😥", "😮", "🤐", "😯", "😪", "😫", "🥱", "😴", "😌", "😛", "😜", "😝", "🤤", "😒", "😓", "😔", "😕", "🙃", "🤑", "😲"],
  "❤️": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "🫶", "🤝", "👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐", "🖖", "👋", "🤙", "💪", "🦾", "🖕", "✍️"],
  "🎉": ["🎉", "🎊", "🎈", "🎁", "🎀", "🎗", "🏆", "🥇", "🥈", "🥉", "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸", "🥌", "🎿", "⛷", "🏂", "🪂", "🏋️", "🤼", "🤸", "⛹️"],
  "🌟": ["🌟", "⭐", "🌙", "☀️", "🌤", "⛅", "🌥", "☁️", "🌦", "🌧", "⛈", "🌩", "🌨", "❄️", "☃️", "⛄", "🌬", "💨", "🌪", "🌫", "🌈", "🔥", "💥", "✨", "🌸", "💮", "🏵", "🌹", "🥀", "🌺", "🌻", "🌼", "🌷", "🌱", "🪴", "🌲", "🌳", "🌴", "🌵", "🎋", "🎍", "🍀", "☘️", "🍁", "🍂", "🍃", "🍄", "🪨", "🌾", "💐"],
};

const CATEGORY_LABELS = Object.keys(EMOJI_CATEGORIES);

interface EmojiPickerProps {
  disabled?: boolean;
  onSelect: (emoji: string) => void;
}

const EmojiPicker = ({ disabled, onSelect }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(CATEGORY_LABELS[0]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl border border-border bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
        aria-label="Emoji picker"
      >
        <Smile className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute bottom-14 left-0 z-50 w-72 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Category tabs */}
            <div className="flex gap-0.5 px-2 pt-2 pb-1 border-b border-border/50">
              {CATEGORY_LABELS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "flex-1 text-center py-1.5 rounded-lg text-base transition-colors",
                    activeCategory === cat ? "bg-primary/20" : "hover:bg-secondary/80"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Emoji grid */}
            <div className="grid grid-cols-8 gap-0.5 p-2 max-h-48 overflow-y-auto">
              {EMOJI_CATEGORIES[activeCategory].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSelect(emoji);
                    setOpen(false);
                  }}
                  className="flex items-center justify-center h-8 w-full rounded-lg text-lg hover:bg-secondary/80 active:scale-90 transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmojiPicker;
