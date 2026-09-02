import React, { useState, useRef, useEffect } from "react";
import { Video, VideoOff, Mic, MicOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface GameMiniPIPProps {
  playerName: string;
}

export const GameMiniPIP: React.FC<GameMiniPIPProps> = ({ playerName }) => {
  const [isActive, setIsActive] = useState(false);
  const [hasMic, setHasMic] = useState(true);
  const [showMobileControls, setShowMobileControls] = useState(false);
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
    if (isActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isActive]);

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

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={isActive ? stopCamera : startCamera}
        className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition-all ${
          isActive
            ? "bg-primary/20 text-primary border border-primary/40 shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
        title={isActive ? "Turn off Face Cam" : "Turn on Face Cam"}
      >
        {isActive ? <Video className="w-3.5 h-3.5 text-primary animate-pulse" /> : <Video className="w-3.5 h-3.5" />}
      </Button>

      {/* Floating Mini Video Pip Window */}
      {isActive && (
        <motion.div
          drag
          dragMomentum={false}
          onClick={() => setShowMobileControls((prev) => !prev)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed top-20 right-3 sm:top-24 sm:right-6 z-50 w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-primary shadow-2xl bg-black flex items-center justify-center group cursor-grab active:cursor-grabbing touch-manipulation"
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />

          {/* Controls Bar */}
          <div
            className={`absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/85 via-black/50 to-transparent flex items-center justify-between transition-opacity ${
              showMobileControls ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMic();
              }}
              className="p-1 rounded-md bg-black/70 text-white hover:text-primary transition-colors text-[10px] cursor-pointer"
            >
              {hasMic ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3 text-rose-400" />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                stopCamera();
              }}
              className="p-1 rounded-md bg-black/70 text-white hover:text-rose-400 transition-colors text-[10px] cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-black/70 text-[8px] sm:text-[9px] font-bold text-white/90 truncate max-w-[55px] sm:max-w-[70px]">
            {playerName}
          </span>
        </motion.div>
      )}
    </>
  );
};
