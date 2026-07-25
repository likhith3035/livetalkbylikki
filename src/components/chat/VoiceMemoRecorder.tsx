import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Send, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { haptics } from "@/lib/haptics";

interface VoiceMemoRecorderProps {
  onSendVoiceMemo: (audioBase64: string, durationSeconds: number) => void;
  onCancel?: () => void;
}

export const VoiceMemoRecorder: React.FC<VoiceMemoRecorderProps> = ({
  onSendVoiceMemo,
  onCancel,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      haptics.impactLight();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 15) {
            stopRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("[VoiceMemo] Could not access microphone:", err);
      toast({
        title: "Microphone Required",
        description: "Please allow microphone access to record voice memos.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    haptics.impactLight();
  };

  const handleDiscard = () => {
    stopRecording();
    setAudioUrl(null);
    setAudioBase64(null);
    setRecordingSeconds(0);
    if (onCancel) onCancel();
  };

  const handleSend = () => {
    if (audioBase64 && recordingSeconds > 0) {
      onSendVoiceMemo(audioBase64, recordingSeconds);
      handleDiscard();
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        {!isRecording && !audioBase64 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={startRecording}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl border-primary/30 text-primary hover:bg-primary/10 shrink-0"
              title="Record Voice Memo"
            >
              <Mic className="h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {isRecording && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs"
          >
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-mono">{recordingSeconds}s / 15s</span>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={stopRecording}
              className="h-7 w-7 rounded-lg text-rose-400 hover:bg-rose-500/20"
              title="Stop Recording"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleDiscard}
              className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-secondary"
              title="Discard"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        )}

        {!isRecording && audioBase64 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/15 border border-primary/30 text-primary font-bold text-xs"
          >
            <Volume2 className="h-4 w-4 animate-bounce" />
            <span>Voice Memo ({recordingSeconds}s)</span>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleSend}
              className="h-7 w-7 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              title="Send Voice Memo"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleDiscard}
              className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-secondary"
              title="Discard"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
