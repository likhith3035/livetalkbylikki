import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Trash2, Send, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ChatVoiceNoteRecorderProps {
  onSendVoiceNote: (audioUrl: string, durationSec: number) => void;
  disabled?: boolean;
}

export const ChatVoiceNoteRecorder: React.FC<ChatVoiceNoteRecorderProps> = ({
  onSendVoiceNote,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    if (disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone permissions to send voice notes.",
        variant: "destructive",
      });
    }
  };

  const stopAndSend = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const duration = recordTime;

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        onSendVoiceNote(base64Audio, duration);
      };
      reader.readAsDataURL(audioBlob);

      // Stop stream tracks
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setRecordTime(0);
  };

  const cancelRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    mediaRecorderRef.current.onstop = () => {
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setRecordTime(0);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-full animate-pulse">
        {/* Pulsing Mic Indicator */}
        <div className="flex items-center gap-1 text-rose-500 font-mono text-xs font-bold">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
          <span>{formatTime(recordTime)}</span>
        </div>

        {/* Animated Waveform Bars */}
        <div className="flex items-center gap-0.5 h-4 px-1">
          <span className="w-1 bg-rose-500 rounded-full animate-[bounce_0.6s_infinite_100ms] h-3" />
          <span className="w-1 bg-rose-500 rounded-full animate-[bounce_0.6s_infinite_300ms] h-4" />
          <span className="w-1 bg-rose-500 rounded-full animate-[bounce_0.6s_infinite_200ms] h-2" />
          <span className="w-1 bg-rose-500 rounded-full animate-[bounce_0.6s_infinite_400ms] h-3.5" />
        </div>

        {/* Actions */}
        <button
          type="button"
          onClick={cancelRecording}
          className="h-7 w-7 rounded-full bg-secondary text-muted-foreground hover:text-rose-500 flex items-center justify-center transition-colors"
          title="Cancel Recording"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={stopAndSend}
          className="h-7 w-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
          title="Send Voice Note"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 border border-border/60 bg-card rounded-full text-[10px] sm:text-[11px] font-semibold text-foreground hover:bg-secondary/50 active:scale-95 transition-all shrink-0 shadow-sm disabled:opacity-40"
      )}
      title="Record Voice Note"
    >
      <Mic className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-400" />
      <span>Voice Note</span>
    </button>
  );
};

export default ChatVoiceNoteRecorder;
