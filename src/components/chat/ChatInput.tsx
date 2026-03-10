import { useState, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Send, X, Reply } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import ImageUploadButton from "@/components/ImageUploadButton";
import EmojiPicker from "@/components/chat/EmojiPicker";
import ChatGames from "@/components/chat/ChatGames";
import GifPicker from "@/components/chat/GifPicker";
import LocationShareButton from "@/components/chat/LocationShareButton";
import Icebreakers from "@/components/chat/Icebreakers";
import type { ChatStatus, Message } from "@/hooks/use-chat";

interface ChatInputProps {
  status: ChatStatus;
  onSend: (text: string, imageUrl?: string, replyTo?: Message["replyTo"]) => void;
  onImageUpload: (url: string) => void;
  onTyping: (text?: string) => void;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  roomChannel?: RealtimeChannel | null;
  sessionId?: string;
  hideGames?: boolean;
}

const ChatInput = ({ status, onSend, onImageUpload, onTyping, replyingTo, onCancelReply, roomChannel, sessionId, hideGames }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const throttleRef = useRef<number>(0);

  const handleSend = () => {
    if (!input.trim()) return;
    const reply = replyingTo ? { id: replyingTo.id, text: replyingTo.text, sender: replyingTo.sender } : undefined;
    onSend(input, undefined, reply);
    setInput("");
    onCancelReply?.();
  };

  const handleChange = (value: string) => {
    setInput(value);
    const now = Date.now();
    if (now - throttleRef.current > 500) {
      throttleRef.current = now;
      onTyping(value);
    }
  };

  const isConnected = status === "connected";

  return (
    <div className="fixed bottom-14 lg:bottom-0 left-0 lg:left-[220px] right-0 z-40">
      {/* Gradient fade above input */}
      <div className="h-6 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />

      <div className="glass-heavy px-3 sm:px-4 py-2.5 sm:py-3">
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-auto max-w-3xl mb-2"
            >
              <div className="flex items-center gap-2 rounded-xl bg-primary/8 border border-primary/15 px-3 py-2">
                <Reply className="h-3.5 w-3.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-primary">
                    Replying to {replyingTo.sender === "you" ? "yourself" : "Stranger"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{replyingTo.text || "📷 Image"}</p>
                </div>
                <button onClick={onCancelReply} className="text-muted-foreground hover:text-foreground shrink-0 hover:scale-110 transition-all">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mx-auto max-w-3xl mb-2 sm:mb-3">
          <Icebreakers onSelect={(text) => onSend(text)} disabled={!isConnected} />
        </div>

        <div className="mx-auto flex max-w-3xl gap-1.5 sm:gap-2 items-center">
          <div className="flex items-center gap-0.5">
            <ImageUploadButton disabled={!isConnected} onUpload={onImageUpload} />
            <EmojiPicker disabled={!isConnected} onSelect={(emoji) => handleChange(input + emoji)} />
            {!hideGames && <ChatGames onSendMessage={onSend} isConnected={isConnected} roomChannel={roomChannel} sessionId={sessionId} />}
            <GifPicker isConnected={isConnected} onSendGif={(url) => onSend("", url)} />
            <LocationShareButton isConnected={isConnected} onSend={onSend} />
          </div>

          <div className={`flex-1 min-w-0 relative rounded-2xl transition-all duration-300 ${isFocused ? 'ring-2 ring-primary/30 shadow-lg shadow-primary/5' : ''}`}>
            <input
              type="text"
              value={input}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isConnected ? "Type a message..." : "Connect to start chatting"}
              disabled={!isConnected}
              className="w-full rounded-2xl border border-border/60 bg-secondary/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/30 focus:bg-secondary/60 disabled:opacity-40 transition-all duration-300"
            />
          </div>

          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="glow"
              size="icon"
              onClick={handleSend}
              disabled={!isConnected || !input.trim()}
              className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl shrink-0 shadow-lg shadow-primary/15"
            >
              <Send className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
