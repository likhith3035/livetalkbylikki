import React, { useState, useRef, useEffect } from "react";
import { Camera, CameraOff, Video, VideoOff, Mic, MicOff, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameMiniPIPProps {
  playerName: string;
}

export const GameMiniPIP: React.FC<GameMiniPIPProps> = ({ playerName }) => {
  const [isActive, setIsActive] = useState(false);
  const [hasMic, setHasMic] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsActive(true);
    } catch {
      setIsActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setHasMic(audioTrack.enabled);
      }
    }
  };

  if (!isActive) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={startCamera}
        className="h-8 rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground border border-border/40 hover:bg-muted/40"
        title="Turn on Mini Cam Reaction"
      >
        <Video className="w-3.5 h-3.5 text-primary" />
        <span>Face Cam</span>
      </Button>
    );
  }

  return (
    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-primary/50 shadow-xl bg-black flex items-center justify-center shrink-0 group">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform -scale-x-100"
      />

      <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={toggleMic}
          className="p-1 rounded-lg bg-black/60 text-white hover:text-primary transition-colors text-[10px]"
        >
          {hasMic ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3 text-rose-400" />}
        </button>

        <button
          onClick={stopCamera}
          className="p-1 rounded-lg bg-black/60 text-white hover:text-rose-400 transition-colors text-[10px]"
        >
          <VideoOff className="w-3 h-3" />
        </button>
      </div>

      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-bold text-white/90 truncate max-w-[70px]">
        {playerName}
      </span>
    </div>
  );
};
