import { useRef, useEffect } from "react";
import TypingIndicator from "@/components/TypingIndicator";
import MessageReactions from "@/components/MessageReactions";
import { cn } from "@/lib/utils";
import type { Message } from "@/hooks/use-chat";

interface ChatMessageListProps {
  messages: Message[];
  strangerTyping: boolean;
  onReact: (messageId: string, emoji: string) => void;
}

const ChatMessageList = ({ messages, strangerTyping, onReact }: ChatMessageListProps) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, strangerTyping]);

  if (messages.length === 0 && !strangerTyping) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <div className="text-4xl">💬</div>
          <p className="text-sm text-muted-foreground">Start a chat to begin talking with strangers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 pb-36 sm:pb-40 space-y-2">
      {messages.map((msg) => (
        <div key={msg.id} className={cn(msg.sender === "you" && "flex flex-col items-end")}>
          <div
            className={cn(
              "max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 text-sm animate-fade-in",
              msg.sender === "you" && "bg-primary text-primary-foreground rounded-br-md",
              msg.sender === "stranger" && "bg-secondary text-secondary-foreground rounded-bl-md",
              msg.sender === "system" && "mx-auto max-w-fit bg-transparent text-muted-foreground text-[11px] text-center italic px-2 py-1"
            )}
          >
            {msg.sender !== "system" && (
              <p className="text-[10px] font-medium opacity-50 mb-0.5">
                {msg.sender === "you" ? "You" : "Stranger"}
              </p>
            )}
            {msg.imageUrl && (
              <img
                src={msg.imageUrl}
                alt="Shared image"
                className="max-w-full rounded-lg mb-1 max-h-48 sm:max-h-60 object-cover"
                loading="lazy"
              />
            )}
            {msg.text && <span className="break-words">{msg.text}</span>}
          </div>

          {msg.sender !== "system" && (
            <MessageReactions
              messageId={msg.id}
              reactions={msg.reactions}
              onReact={onReact}
              isMine={msg.sender === "you"}
            />
          )}
        </div>
      ))}
      {strangerTyping && <TypingIndicator />}
      <div ref={endRef} />
    </div>
  );
};

export default ChatMessageList;
