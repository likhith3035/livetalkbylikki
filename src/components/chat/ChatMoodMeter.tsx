import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatMoodMeterProps {
  messages: { text: string; sender: string }[];
}

const POSITIVE_WORDS = [
  "love", "happy", "great", "awesome", "amazing", "good", "nice", "cool", "beautiful",
  "wonderful", "fantastic", "brilliant", "excellent", "fun", "glad", "joy", "sweet",
  "best", "perfect", "lovely", "haha", "lol", "lmao", "😂", "😊", "😍", "❤️", "🥰",
  "💕", "😄", "🎉", "✨", "🔥", "💯", "👏", "🤩", "😁", "💖", "🥳", "yes", "yeah",
  "wow", "yay", "omg", "thanks", "thank", "like", "cute",
];

const NEGATIVE_WORDS = [
  "hate", "bad", "terrible", "awful", "horrible", "ugly", "boring", "sad", "angry",
  "worst", "stupid", "dumb", "annoying", "sucks", "ugh", "meh", "no", "nah",
  "😢", "😡", "😤", "💔", "😒", "😞", "😠", "🙄", "😑", "👎", "😭",
  "disgusting", "toxic", "gross", "cringe", "weird", "creepy",
];

type Mood = "🔥 Vibing" | "😊 Chill" | "😐 Neutral" | "😶 Quiet" | "💬 Just Started";

const analyzeMood = (messages: { text: string; sender: string }[]): { mood: Mood; score: number; color: string } => {
  const chatMessages = messages.filter((m) => m.sender !== "system");
  if (chatMessages.length === 0) return { mood: "💬 Just Started", score: 50, color: "muted-foreground" };
  if (chatMessages.length < 3) return { mood: "💬 Just Started", score: 50, color: "muted-foreground" };

  const recentMessages = chatMessages.slice(-15);
  let positiveCount = 0;
  let negativeCount = 0;

  for (const msg of recentMessages) {
    const text = msg.text.toLowerCase();
    for (const word of POSITIVE_WORDS) {
      if (text.includes(word)) positiveCount++;
    }
    for (const word of NEGATIVE_WORDS) {
      if (text.includes(word)) negativeCount++;
    }
  }

  // Also factor in message frequency and length
  const avgLength = recentMessages.reduce((sum, m) => sum + m.text.length, 0) / recentMessages.length;
  const engagementBonus = Math.min(avgLength / 50, 1) * 10;

  const rawScore = 50 + (positiveCount - negativeCount) * 8 + engagementBonus;
  const score = Math.max(0, Math.min(100, rawScore));

  if (score >= 75) return { mood: "🔥 Vibing", score, color: "text-green-500" };
  if (score >= 55) return { mood: "😊 Chill", score, color: "text-primary" };
  if (score >= 35) return { mood: "😐 Neutral", score, color: "text-muted-foreground" };
  return { mood: "😶 Quiet", score, color: "text-muted-foreground" };
};

const ChatMoodMeter = ({ messages }: ChatMoodMeterProps) => {
  const { mood, score, color } = useMemo(() => analyzeMood(messages), [messages]);

  const chatMessages = messages.filter((m) => m.sender !== "system");
  if (chatMessages.length < 3) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 rounded-full bg-secondary/60 border border-border/50 px-2.5 py-1"
    >
      <div className="relative h-1.5 w-12 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-700",
            score >= 75 && "bg-green-500",
            score >= 55 && score < 75 && "bg-primary",
            score >= 35 && score < 55 && "bg-muted-foreground",
            score < 35 && "bg-destructive/60",
          )}
          animate={{ width: `${score}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        />
      </div>
      <span className={cn("text-[10px] font-medium whitespace-nowrap", color)}>
        {mood}
      </span>
    </motion.div>
  );
};

export default ChatMoodMeter;
