import { useState } from "react";
import { cn } from "@/lib/utils";

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface MessageReactionsProps {
  messageId: string;
  reactions: Record<string, string[]>; // emoji -> list of senderIds
  onReact: (messageId: string, emoji: string) => void;
  isMine: boolean;
}

const MessageReactions = ({ messageId, reactions, onReact, isMine }: MessageReactionsProps) => {
  const [showPicker, setShowPicker] = useState(false);

  const hasReactions = Object.values(reactions).some((arr) => arr.length > 0);

  return (
    <div className={cn("relative", isMine ? "flex flex-col items-end" : "flex flex-col items-start")}>
      {/* Existing reactions */}
      {hasReactions && (
        <div className="flex gap-1 mt-1">
          {Object.entries(reactions).map(([emoji, senders]) =>
            senders.length > 0 ? (
              <button
                key={emoji}
                onClick={() => onReact(messageId, emoji)}
                className="flex items-center gap-0.5 rounded-full bg-secondary/80 border border-border px-1.5 py-0.5 text-xs hover:bg-secondary transition-colors"
              >
                <span>{emoji}</span>
                {senders.length > 1 && (
                  <span className="text-[10px] text-muted-foreground">{senders.length}</span>
                )}
              </button>
            ) : null
          )}
        </div>
      )}

      {/* Reaction trigger */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="mt-0.5 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        {showPicker ? "✕" : "＋"}
      </button>

      {/* Picker */}
      {showPicker && (
        <div className="absolute bottom-6 z-10 flex gap-1 rounded-xl bg-card border border-border px-2 py-1.5 shadow-lg animate-fade-in">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReact(messageId, emoji);
                setShowPicker(false);
              }}
              className="text-base hover:scale-125 transition-transform px-0.5"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageReactions;
