import { useState, useRef, useCallback } from "react";
import { Send, Mic, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import ImageUploadButton from "@/components/ImageUploadButton";
import EmojiPicker from "@/components/chat/EmojiPicker";
import ChatGames from "@/components/chat/ChatGames";
import type { ChatStatus } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  status: ChatStatus;
  onSend: (text: string, imageUrl?: string) => void;
  onImageUpload: (url: string) => void;
  onTyping: (text?: string) => void;
}

const ChatInput = ({ status, onSend, onImageUpload, onTyping }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const throttleRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
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

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        // Send as a message with audio indicator
        onSend(`🎤 Voice message (${recordingDuration}s)`, undefined);
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setRecordingDuration(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  }, [onSend, toast, recordingDuration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const isConnected = status === "connected";

  return (
    <div className="fixed bottom-14 lg:bottom-0 left-0 lg:left-[220px] right-0 glass-heavy z-40 px-3 sm:px-4 py-2.5 sm:py-3">
      <div className="mx-auto flex max-w-3xl gap-1.5 sm:gap-2 items-center">
        <ImageUploadButton disabled={!isConnected} onUpload={onImageUpload} />
        <EmojiPicker disabled={!isConnected} onSelect={(emoji) => handleChange(input + emoji)} />
        <ChatGames onSendMessage={onSend} isConnected={isConnected} />

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

        {/* Voice message button */}
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

        {/* Send button */}
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
    </div>
  );
};

export default ChatInput;
