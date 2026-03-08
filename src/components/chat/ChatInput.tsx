import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import ImageUploadButton from "@/components/ImageUploadButton";
import type { ChatStatus } from "@/hooks/use-chat";

interface ChatInputProps {
  status: ChatStatus;
  onSend: (text: string) => void;
  onImageUpload: (url: string) => void;
  onTyping: () => void;
}

const ChatInput = ({ status, onSend, onImageUpload, onTyping }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const throttleRef = useRef<number>(0);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  const handleChange = (value: string) => {
    setInput(value);
    const now = Date.now();
    if (now - throttleRef.current > 1000) {
      throttleRef.current = now;
      onTyping();
    }
  };

  const isConnected = status === "connected";

  return (
    <div className="fixed bottom-14 sm:bottom-16 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-xl px-3 sm:px-4 py-2.5 sm:py-3 z-40">
      <div className="mx-auto flex max-w-2xl gap-1.5 sm:gap-2 items-center">
        <ImageUploadButton disabled={!isConnected} onUpload={onImageUpload} />
        <input
          type="text"
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={isConnected ? "Type a message..." : "Connect to start chatting"}
          disabled={!isConnected}
          className="flex-1 min-w-0 rounded-xl border border-border bg-secondary/50 px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <Button
          variant="glow"
          size="icon"
          onClick={handleSend}
          disabled={!isConnected || !input.trim()}
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
