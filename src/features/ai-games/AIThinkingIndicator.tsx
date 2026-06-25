import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIThinkingIndicatorProps {
  visible: boolean;
  label?: string;
  className?: string;
}

export function AIThinkingIndicator({
  visible,
  label = "AI is thinking…",
  className,
}: AIThinkingIndicatorProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        "flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-xs font-medium text-primary",
        className
      )}
    >
      <Bot className="h-4 w-4 animate-pulse" />
      <span>{label}</span>
      <span className="inline-flex gap-0.5 ml-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1 h-1 rounded-full bg-primary"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </span>
    </motion.div>
  );
}
