import { motion } from "framer-motion";

const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-2 max-w-fit rounded-2xl rounded-bl-md bg-secondary/80 backdrop-blur-sm border border-border/30 px-4 py-3">
      <span className="text-[10px] font-medium text-muted-foreground mr-0.5">Stranger</span>
      <div className="flex items-center gap-[3px]">
        <span className="typing-dot h-2 w-2 rounded-full bg-primary/70" />
        <span className="typing-dot h-2 w-2 rounded-full bg-primary/70" />
        <span className="typing-dot h-2 w-2 rounded-full bg-primary/70" />
      </div>
    </div>
  );
};

export default TypingIndicator;
