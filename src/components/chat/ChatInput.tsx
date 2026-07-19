import { useState, useRef } from "react";
import { RoomChannel } from "@/lib/types";
import { Send, X, Reply, File, Image, Music, Video, Gamepad2, Smile, MapPin, Loader2, SkipForward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import EmojiPicker from "@/components/chat/EmojiPicker";
import ChatGames from "@/components/chat/ChatGames";
import GifPicker from "@/components/chat/GifPicker";
import LocationShareButton from "@/components/chat/LocationShareButton";
import Icebreakers from "@/components/chat/Icebreakers";
import type { ChatStatus, Message } from "@/hooks/use-chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { trackRoomMediaUpload } from "@/features/temp-rooms/registerMediaUpload";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  status: ChatStatus;
  onSend: (text: string, imageUrl?: string, replyTo?: Message["replyTo"]) => void;
  onImageUpload: (url: string) => void;
  onTyping: (text?: string) => void;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  roomChannel?: RoomChannel;
  sessionId?: string;
  roomId?: string | null;
  hideGames?: boolean;
  hasMessages?: boolean;
  activeGame: "none" | "ttt" | "canvas" | "rps";
  setActiveGame: (game: "none" | "ttt" | "canvas" | "rps") => void;
  onToggleAI?: () => void;
  onVideoCall?: () => void;
  onNext?: () => void;
}

const ChatInput = ({ 
  status, onSend, onImageUpload, onTyping, replyingTo, onCancelReply, 
  roomChannel, sessionId, roomId, hideGames, hasMessages,
  activeGame, setActiveGame, onToggleAI, onVideoCall, onNext
}: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("*");
  const throttleRef = useRef<number>(0);
  const isMobile = useIsMobile();
  const { toast } = useToast();

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

  const handleGenericFileUpload = async (file: File) => {
    if (!isConnected) return;
    
    // Limits: Max 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "The selected file exceeds the maximum size limit of 5MB."
      });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const path = roomId ? `${roomId}/${fileName}` : fileName;

      const { error } = await supabase.storage
        .from("chat-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      if (roomId) {
        await trackRoomMediaUpload(roomId, path).catch(() => {});
      }

      const { data } = supabase.storage.from("chat-images").getPublicUrl(path);
      onImageUpload(data.publicUrl);
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err.message || "An error occurred while uploading the file."
      });
    } finally {
      setUploading(false);
    }
  };

  const triggerFileSelect = (filter: string) => {
    if (!isConnected) return;
    setFileTypeFilter(filter);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const isConnected = status === "connected";

  return (
    <div className="w-full shrink-0 pb-[env(safe-area-inset-bottom,0px)] bg-background border-t border-border/30">
      <input
        type="file"
        ref={fileInputRef}
        accept={fileTypeFilter}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleGenericFileUpload(file);
        }}
      />

      <div className="px-2 sm:px-4 py-1.5 sm:py-3">
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-auto max-w-3xl mb-1.5 sm:mb-2"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20 px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-sm backdrop-blur-md">
                <Reply className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-wider">
                    Replying to {replyingTo.sender === "you" ? "yourself" : "Stranger"}
                  </p>
                  <p className="text-[11px] sm:text-xs text-foreground/80 truncate font-medium">{replyingTo.text || "📷 Attachment"}</p>
                </div>
                <button onClick={onCancelReply} className="text-muted-foreground hover:text-foreground shrink-0 hover:scale-110 transition-all p-0.5 sm:p-1">
                  <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrolling Action Pills above input */}
        {isConnected && (
          <div className="mx-auto max-w-3xl flex gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 sm:pb-2.5 mb-1 sm:mb-1.5 scrollbar-none select-none px-0.5">
            {/* Images Pill */}
            <button
              onClick={() => triggerFileSelect("image/*")}
              disabled={uploading}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 border border-border/60 bg-card rounded-full text-[10px] sm:text-[11px] font-semibold text-foreground hover:bg-secondary/50 active:scale-95 transition-all shrink-0"
            >
              {uploading ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : <Image className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500" />}
              Images
            </button>

            {/* Video Pill */}
            {onVideoCall && (
              <button
                onClick={onVideoCall}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 border border-border/60 bg-card rounded-full text-[10px] sm:text-[11px] font-semibold text-foreground hover:bg-secondary/50 active:scale-95 transition-all shrink-0"
              >
                <Video className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-500" />
                Video
              </button>
            )}

            {/* Emoji Pill */}
            <EmojiPicker
              disabled={!isConnected}
              onSelect={(emoji) => handleChange(input + emoji)}
              customTrigger={
                <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 border border-border/60 bg-card rounded-full text-[10px] sm:text-[11px] font-semibold text-foreground hover:bg-secondary/50 active:scale-95 transition-all shrink-0">
                  <Smile className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-violet-500" />
                  Emoji
                </div>
              }
            />

            {/* Games Pill */}
            {!hideGames && (
              <ChatGames
                onSendMessage={onSend}
                isConnected={isConnected}
                roomChannel={roomChannel}
                sessionId={sessionId}
                activeGame={activeGame}
                setActiveGame={setActiveGame}
                onToggleAI={onToggleAI}
                customTrigger={
                  <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 border border-border/60 bg-card rounded-full text-[10px] sm:text-[11px] font-semibold text-foreground hover:bg-secondary/50 active:scale-95 transition-all shrink-0">
                    <Gamepad2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500" />
                    Games
                  </div>
                }
              />
            )}

            {/* GIFs Pill */}
            <GifPicker
              isConnected={isConnected}
              onSendGif={(url) => onSend("", url)}
              customTrigger={
                <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 border border-border/60 bg-card rounded-full text-[10px] sm:text-[11px] font-semibold text-foreground hover:bg-secondary/50 active:scale-95 transition-all shrink-0">
                  <Smile className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-pink-500" />
                  GIFs
                </div>
              }
            />

            {/* Location Pill */}
            <LocationShareButton
              isConnected={isConnected}
              onSend={onSend}
              customTrigger={
                <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 border border-border/60 bg-card rounded-full text-[10px] sm:text-[11px] font-semibold text-foreground hover:bg-secondary/50 active:scale-95 transition-all shrink-0">
                  <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-500" />
                  Location
                </div>
              }
            />
          </div>
        )}

        {!hasMessages && (
          <div className="mx-auto max-w-3xl mb-1.5 sm:mb-3">
            <Icebreakers onSelect={(text) => onSend(text)} disabled={!isConnected} />
          </div>
        )}

        {/* Input box and circular Send Button */}
        <div className="mx-auto flex max-w-3xl gap-1.5 sm:gap-2.5 items-center">
          {onNext && (isConnected || status === "disconnected") && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onNext}
              className="h-9 w-9 sm:h-11 sm:w-11 rounded-full shrink-0 flex items-center justify-center bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 active:scale-95 transition-all lg:hidden shadow-sm"
              title="Skip to next stranger"
            >
              <SkipForward className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
            </motion.button>
          )}

          <div className={`flex-1 min-w-0 relative rounded-full transition-all duration-300 ${isFocused ? 'ring-2 ring-primary/30 shadow-lg shadow-primary/5' : ''}`}>
            <input
              type="text"
              value={input}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isConnected ? "Type a message..." : "Connect to start chatting"}
              disabled={!isConnected}
              className="w-full rounded-full border border-border/60 bg-secondary/30 px-4 sm:px-5 py-2 sm:py-3 text-sm sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-border/80 focus:bg-card disabled:opacity-40 transition-all duration-300 shadow-sm"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!isConnected || !input.trim()}
            className="h-9 w-9 sm:h-11 sm:w-11 rounded-full shrink-0 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md"
          >
            <Send className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
