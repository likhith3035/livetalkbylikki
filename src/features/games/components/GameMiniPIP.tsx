import React, { useState, useRef, useEffect } from "react";
import { Video, VideoOff, Mic, MicOff, X, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { gameWebRTC } from "../services/gameWebRTCService";
import { toast } from "sonner";

interface GameMiniPIPProps {
  playerName: string;
  opponentName?: string;
  roomCode?: string;
  isHost?: boolean;
  isOnlineMode?: boolean;
}

export const GameMiniPIP: React.FC<GameMiniPIPProps> = ({
  playerName,
  opponentName = "Opponent",
  roomCode,
  isHost = true,
  isOnlineMode = false,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [hasMic, setHasMic] = useState(true);
  const [hasVideo, setHasVideo] = useState(true);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "requesting" | "connected" | "failed">("idle");

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = async () => {
    try {
      if (isOnlineMode && roomCode) {
        toast.info("Starting Video Duel Cam...");
        const stream = await gameWebRTC.startVideoDuel(roomCode, isHost, {
          onLocalStream: (s) => setLocalStream(s),
          onRemoteStream: (s) => {
            setRemoteStream(s);
            toast.success(`${opponentName}'s Face Cam connected!`);
          },
          onStatusChange: (status) => setConnectionStatus(status),
        });
        setLocalStream(stream);
        setIsActive(true);
      } else {
        // Local/AI practice face cam
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: "user" },
          audio: true,
        });
        setLocalStream(stream);
        setIsActive(true);
      }
    } catch (err) {
      console.warn("Camera start error:", err);
      toast.error("Could not access camera/microphone.");
      setIsActive(false);
    }
  };

  const stopCamera = () => {
    if (isOnlineMode) {
      gameWebRTC.stopVideoDuel();
    } else if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsActive(false);
    setConnectionStatus("idle");
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isActive, remoteStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isActive]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const toggleMic = () => {
    if (isOnlineMode) {
      const state = gameWebRTC.toggleMic();
      setHasMic(state);
    } else if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setHasMic(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (isOnlineMode) {
      const state = gameWebRTC.toggleCamera();
      setHasVideo(state);
    } else if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setHasVideo(videoTrack.enabled);
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
        title={isActive ? "Turn off Video Duel Cam" : "Turn on Video Duel Cam"}
      >
        {isActive ? (
          <Video className="w-3.5 h-3.5 text-primary animate-pulse" />
        ) : (
          <Video className="w-3.5 h-3.5" />
        )}
      </Button>

      {/* Floating Video Duel PiP Window */}
      {isActive && (
        <motion.div
          drag
          dragMomentum={false}
          data-no-pull-refresh="true"
          data-pip-container="true"
          onTouchStartCapture={(e) => e.stopPropagation()}
          onTouchMoveCapture={(e) => e.stopPropagation()}
          onTouchEndCapture={(e) => e.stopPropagation()}
          onClick={() => setShowMobileControls((prev) => !prev)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`fixed z-50 rounded-2xl overflow-hidden border-2 shadow-2xl bg-black flex items-center justify-center group cursor-grab active:cursor-grabbing touch-none overscroll-none select-none transition-all duration-300 ${
            remoteStream
              ? "border-emerald-500 shadow-emerald-500/20"
              : "border-primary shadow-primary/20"
          } ${
            isExpanded
              ? "w-44 h-56 sm:w-60 sm:h-72 top-16 right-3 sm:top-20 sm:right-6"
              : "w-24 h-28 sm:w-36 sm:h-44 top-20 right-3 sm:top-24 sm:right-6"
          }`}
        >
          {/* Main Display: Opponent if available, otherwise Local */}
          {remoteStream ? (
            <div className="relative w-full h-full">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[9px] sm:text-[10px] font-black text-emerald-400 flex items-center gap-1 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                {opponentName}
              </span>

              {/* Sub Thumbnail: Self */}
              <div className="absolute bottom-6 right-1.5 w-8 h-10 sm:w-12 sm:h-16 rounded-lg overflow-hidden border border-white/50 shadow-md bg-zinc-900">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[8px] sm:text-[9px] font-bold text-white/90 truncate max-w-[80px]">
                {playerName} (You)
              </span>
              {isOnlineMode && (
                <span className="absolute bottom-6 left-1.5 px-1.5 py-0.5 rounded bg-amber-500/80 text-[8px] font-bold text-amber-950">
                  Waiting for {opponentName} cam...
                </span>
              )}
            </div>
          )}

          {/* Quick Interactive Control Bar */}
          <div
            className={`absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-between transition-opacity ${
              showMobileControls ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMic();
                }}
                className="p-1 rounded-md bg-black/70 text-white hover:text-primary transition-colors text-[10px] cursor-pointer"
                title={hasMic ? "Mute Microphone" : "Unmute Microphone"}
              >
                {hasMic ? <Mic className="w-3 h-3 text-white" /> : <MicOff className="w-3 h-3 text-rose-400" />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVideo();
                }}
                className="p-1 rounded-md bg-black/70 text-white hover:text-primary transition-colors text-[10px] cursor-pointer"
                title={hasVideo ? "Pause Video" : "Resume Video"}
              >
                {hasVideo ? <Video className="w-3 h-3 text-white" /> : <VideoOff className="w-3 h-3 text-rose-400" />}
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded((prev) => !prev);
                }}
                className="p-1 rounded-md bg-black/70 text-white hover:text-primary transition-colors text-[10px] cursor-pointer"
                title={isExpanded ? "Shrink PiP" : "Expand PiP"}
              >
                {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  stopCamera();
                }}
                className="p-1 rounded-md bg-black/70 text-white hover:text-rose-400 transition-colors text-[10px] cursor-pointer"
                title="Close Video Duel"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};
