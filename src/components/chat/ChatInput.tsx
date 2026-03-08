import { useState, useRef, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Send, Mic, Square, X, Reply, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import ImageUploadButton from "@/components/ImageUploadButton";
import EmojiPicker from "@/components/chat/EmojiPicker";
import ChatGames from "@/components/chat/ChatGames";
import GifPicker from "@/components/chat/GifPicker";
import LocationShareButton from "@/components/chat/LocationShareButton";
import type { ChatStatus, Message } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  status: ChatStatus;
  onSend: (text: string, imageUrl?: string, replyTo?: Message["replyTo"]) => void;
  onImageUpload: (url: string) => void;
  onTyping: (text?: string) => void;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  roomChannel?: RealtimeChannel | null;
  sessionId?: string;
}

const ChatInput = ({ status, onSend, onImageUpload, onTyping, replyingTo, onCancelReply, roomChannel, sessionId }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [showMobileTools, setShowMobileTools] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const throttleRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingDurationRef = useRef(0);
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

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      recordingDurationRef.current = 0;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const dur = recordingDurationRef.current;
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        setRecordingDuration(0);

        if (chunksRef.current.length === 0 || dur === 0) return;

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        // Upload to storage
        const fileName = `voice_${Date.now()}.webm`;
        const { data, error } = await supabase.storage
          .from("chat-images")
          .upload(fileName, blob, { contentType: "audio/webm" });

        if (error) {
          toast({ title: "Upload failed", description: error.message, variant: "destructive" });
          return;
        }

        const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(fileName);
        onSend(`🎤 Voice message (${dur}s)`, urlData.publicUrl);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        recordingDurationRef.current += 1;
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  }, [onSend, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const isConnected = status === "connected";

  return (
    <div className="fixed bottom-14 lg:bottom-0 left-0 lg:left-[220px] right-0 glass-heavy z-40 px-2 sm:px-4 py-2 sm:py-3">
      {/* Reply preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-auto max-w-3xl mb-2"
          >
            <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2">
              <Reply className="h-3.5 w-3.5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-primary">
                  Replying to {replyingTo.sender === "you" ? "yourself" : "Stranger"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{replyingTo.text || "📷 Image"}</p>
              </div>
              <button onClick={onCancelReply} className="text-muted-foreground hover:text-foreground shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto flex max-w-3xl gap-1 sm:gap-2 items-center">
        {/* Collapsible tools on mobile - show only essential buttons */}
        <ImageUploadButton disabled={!isConnected} onUpload={onImageUpload} />
        <EmojiPicker disabled={!isConnected} onSelect={(emoji) => handleChange(input + emoji)} />
        {/* Mobile more button */}
        {isConnected && (
          <button
            onClick={() => setShowMobileTools(!showMobileTools)}
            className="sm:hidden h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
          >
            <Plus className={`h-4 w-4 transition-transform ${showMobileTools ? "rotate-45" : ""}`} />
          </button>
        )}
        <div className="hidden sm:flex gap-1 items-center">
          <ChatGames onSendMessage={onSend} isConnected={isConnected} roomChannel={roomChannel} sessionId={sessionId} />
          <GifPicker isConnected={isConnected} onSendGif={(url) => onSend("", url)} />
          <LocationShareButton isConnected={isConnected} onSend={onSend} />
        </div>

        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex-1 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm text-destructive font-medium tabular-nums">
                {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, "0")}
              </span>
              <span className="text-xs text-muted-foreground flex-1">Recording...</span>
            </motion.div>
          ) : (
            <motion.input
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              type="text"
              value={input}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isConnected ? "Type a message..." : "Connect to start chatting"}
              disabled={!isConnected}
              className="flex-1 min-w-0 rounded-xl border border-border bg-secondary/50 px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/30 disabled:opacity-50 transition-all duration-200"
            />
          )}
        </AnimatePresence>

        {isConnected && !input.trim() && (
          <Button
            variant={isRecording ? "destructive" : "ghost"}
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shrink-0"
          >
            {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}

        {(input.trim() || !isConnected) && (
          <Button
            variant="glow"
            size="icon"
            onClick={handleSend}
            disabled={!isConnected || !input.trim()}
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Mobile tools tray */}
      <AnimatePresence>
        {showMobileTools && isConnected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden mx-auto max-w-3xl mt-1.5 flex gap-1 items-center justify-center"
          >
            <ChatGames onSendMessage={onSend} isConnected={isConnected} roomChannel={roomChannel} sessionId={sessionId} />
            <ChatPolls isConnected={isConnected} roomChannel={roomChannel} sessionId={sessionId} onSendMessage={onSend} />
            <LocationShareButton isConnected={isConnected} onSend={onSend} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatInput;
