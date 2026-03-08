import { useState, useRef, useCallback, useEffect } from "react";
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Phone, X,
  Monitor, MonitorOff, SwitchCamera, Sparkles, MessageSquare, Send,
  PictureInPicture2, Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VideoCallStatus } from "@/hooks/use-video-call";

interface InCallMessage {
  id: string;
  text: string;
  sender: "you" | "stranger";
  timestamp: Date;
}

interface VideoCallOverlayProps {
  callStatus: VideoCallStatus;
  isAudioOnly?: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  remoteIsScreenSharing: boolean;
  isBlurred: boolean;
  facingMode: "user" | "environment";
  remoteMuted?: boolean;
  remoteCameraOff?: boolean;
  remoteBlurred?: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onFlipCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleBlur: () => void;
  onUpgradeToVideo?: () => void;
  onSendInCallMessage?: (text: string) => void;
  inCallMessages?: InCallMessage[];
}

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const VideoCallOverlay = ({
  callStatus, isAudioOnly = false, localStream, remoteStream,
  isMuted, isCameraOff, isScreenSharing, remoteIsScreenSharing, isBlurred, facingMode,
  remoteMuted, remoteCameraOff, remoteBlurred,
  onToggleMute, onToggleCamera, onEndCall, onAccept, onDecline,
  onFlipCamera, onToggleScreenShare, onToggleBlur,
  onUpgradeToVideo,
  onSendInCallMessage, inCallMessages = [],
}: VideoCallOverlayProps) => {
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [showControls, setShowControls] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isPiP, setIsPiP] = useState(false);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const localVideoElRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoElRef = useRef<HTMLVideoElement | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ref callbacks — assign stream immediately when element mounts
  const localVideoRef = useCallback((node: HTMLVideoElement | null) => {
    localVideoElRef.current = node;
    if (node && localStream && node.srcObject !== localStream) {
      node.srcObject = localStream;
      node.play().catch(() => {});
    }
  }, [localStream]);

  const remoteVideoRef = useCallback((node: HTMLVideoElement | null) => {
    remoteVideoElRef.current = node;
    if (node && remoteStream && node.srcObject !== remoteStream) {
      node.srcObject = remoteStream;
      node.play().catch(() => {});
    }
  }, [remoteStream]);

  // Also update when streams change (element already mounted)
  useEffect(() => {
    const el = localVideoElRef.current;
    if (el && localStream && el.srcObject !== localStream) {
      el.srcObject = localStream;
      el.play().catch(() => {});
    }
  }, [localStream]);

  useEffect(() => {
    const el = remoteVideoElRef.current;
    if (el && remoteStream && el.srcObject !== remoteStream) {
      el.srcObject = remoteStream;
      el.play().catch(() => {});
    }
  }, [remoteStream]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === "active") {
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      setCallDuration(0);
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [callStatus]);

  // Auto-hide controls after 4s
  useEffect(() => {
    if (callStatus !== "active") return;
    const resetTimer = () => {
      setShowControls(true);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 4000);
    };
    resetTimer();
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [callStatus]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [inCallMessages]);

  // Listen for PiP exit
  useEffect(() => {
    const handlePiPExit = () => setIsPiP(false);
    document.addEventListener("leavepictureinpicture", handlePiPExit);
    return () => document.removeEventListener("leavepictureinpicture", handlePiPExit);
  }, []);

  const handleTapScreen = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 4000);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    onSendInCallMessage?.(chatInput.trim());
    setChatInput("");
  };

  // Browser Picture-in-Picture
  const togglePiP = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else if (remoteVideoElRef.current) {
        await remoteVideoElRef.current.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch {
      // PiP not supported or denied
    }
  }, []);

  // Incoming call prompt
  if (callStatus === "incoming") {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 backdrop-blur-lg animate-fade-in">
        <div className="flex flex-col items-center gap-6 rounded-2xl bg-card border border-border p-8 shadow-2xl max-w-xs w-full mx-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center animate-pulse">
              {isAudioOnly ? <Phone className="h-8 w-8 text-primary" /> : <Video className="h-8 w-8 text-primary" />}
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-display font-semibold text-foreground">
              Incoming {isAudioOnly ? "Audio" : "Video"} Call
            </p>
            <p className="text-sm text-muted-foreground">
              Stranger wants to {isAudioOnly ? "voice" : "video"} chat
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={onDecline}
              variant="danger"
              size="lg"
              className="rounded-full h-14 w-14 p-0"
            >
              <X className="h-6 w-6" />
            </Button>
            <Button
              onClick={onAccept}
              variant="glow"
              size="lg"
              className="rounded-full h-14 w-14 p-0 bg-online hover:bg-online/90 shadow-[0_0_25px_hsl(var(--online)/0.4)]"
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Requesting call
  if (callStatus === "requesting") {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 backdrop-blur-lg animate-fade-in">
        <div className="flex flex-col items-center gap-6 rounded-2xl bg-card border border-border p-8 shadow-2xl max-w-xs w-full mx-4">
          <div className="h-20 w-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center animate-pulse">
            {isAudioOnly ? <Phone className="h-8 w-8 text-primary" /> : <Video className="h-8 w-8 text-primary" />}
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-display font-semibold text-foreground">Calling...</p>
            <p className="text-sm text-muted-foreground">Waiting for stranger to accept</p>
          </div>
          <Button onClick={onEndCall} variant="danger" className="rounded-full h-12 px-6 gap-2">
            <PhoneOff className="h-5 w-5" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Connecting
  if (callStatus === "connecting") {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/90 backdrop-blur-lg animate-fade-in">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Connecting {isAudioOnly ? "audio" : "video"}...</p>
        </div>
      </div>
    );
  }

  // Active call
  if (callStatus === "active") {
    return (
      <div
        className="fixed inset-0 z-[90] bg-background flex flex-col animate-fade-in"
        style={{ height: "100dvh" }}
        onClick={handleTapScreen}
      >
        {/* Remote video/audio area */}
        <div className={cn(
          "flex-1 relative overflow-hidden min-h-0",
          isAudioOnly ? "bg-gradient-to-b from-card to-background" : remoteIsScreenSharing ? "bg-black" : "bg-muted"
        )}>
          {isAudioOnly ? (
            <div className="flex h-full items-center justify-center flex-col gap-4">
              <div className="h-24 w-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                <Phone className="h-10 w-10 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Audio Call</p>
              {remoteStream && (
                <audio ref={(el) => { if (el && remoteStream) el.srcObject = remoteStream; }} autoPlay />
              )}
            </div>
          ) : (
            <>
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={cn(
                    "h-full w-full",
                    remoteIsScreenSharing ? "object-contain" : "object-cover"
                  )}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <VideoOff className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30" />
                </div>
              )}
            </>
          )}

          {/* Remote state indicators */}
          {(remoteMuted || remoteCameraOff || remoteBlurred) && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
              {remoteMuted && (
                <div className="flex items-center gap-1 rounded-full bg-card/80 backdrop-blur-sm border border-border px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                  <MicOff className="h-3 w-3" /> Muted
                </div>
              )}
              {!isAudioOnly && remoteCameraOff && (
                <div className="flex items-center gap-1 rounded-full bg-card/80 backdrop-blur-sm border border-border px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                  <VideoOff className="h-3 w-3" /> Camera Off
                </div>
              )}
              {!isAudioOnly && remoteBlurred && (
                <div className="flex items-center gap-1 rounded-full bg-card/80 backdrop-blur-sm border border-border px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                  <Sparkles className="h-3 w-3" /> Blurred
                </div>
              )}
            </div>
          )}

          {/* Screen share indicator on remote */}
          {!isAudioOnly && remoteIsScreenSharing && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
              <div className="flex items-center gap-1.5 rounded-full bg-primary/90 text-primary-foreground px-3 py-1 text-xs font-medium shadow-lg">
                <Monitor className="h-3.5 w-3.5" />
                Stranger is sharing screen
              </div>
            </div>
          )}

          {/* Draggable Local video (PiP) - only for video calls */}
          {!isAudioOnly && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.1}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-24 h-32 xs:w-28 xs:h-36 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border-2 border-primary/40 shadow-2xl bg-muted z-20 cursor-grab active:cursor-grabbing touch-none"
            onClick={(e) => e.stopPropagation()}
            whileDrag={{ scale: 1.05 }}
            onDoubleClick={(e) => { e.stopPropagation(); onFlipCamera(); }}
          >
            {localStream && !isCameraOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "h-full w-full",
                  isScreenSharing ? "object-contain bg-black" : "object-cover",
                  isBlurred && "video-blur"
                )}
                style={{
                  transform: [
                    facingMode === "user" && !isScreenSharing ? "scaleX(-1)" : "",
                    isBlurred ? "scale(1.15)" : "",
                  ].filter(Boolean).join(" ") || "none",
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-secondary">
                <VideoOff className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            {isScreenSharing && (
              <div className="absolute bottom-1 left-1 right-1 flex items-center justify-center">
                <span className="text-[9px] bg-primary/80 text-primary-foreground rounded px-1.5 py-0.5 font-medium">
                  Screen
                </span>
              </div>
            )}
          </motion.div>
          )}

          {/* Status pill with timer */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-sm border border-border px-3 py-1.5 z-10"
              >
                <span className="h-2 w-2 rounded-full bg-online animate-pulse" />
                <span className="text-xs font-medium text-foreground">Live</span>
                <span className="text-[10px] text-muted-foreground tabular-nums flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(callDuration)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* In-call chat overlay */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute bottom-4 left-3 right-3 sm:left-4 sm:right-4 z-30 max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Messages */}
                <div className="max-h-40 overflow-y-auto mb-2 space-y-1 scrollbar-thin">
                  {inCallMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "text-xs px-2.5 py-1.5 rounded-lg max-w-[80%] w-fit",
                        msg.sender === "you"
                          ? "ml-auto bg-primary/80 text-primary-foreground"
                          : "bg-card/80 backdrop-blur-sm text-foreground border border-border/50"
                      )}
                    >
                      {msg.text}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                {/* Input */}
                <div className="flex gap-1.5">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring/50"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim()}
                    className="rounded-lg bg-primary px-2.5 py-2 text-primary-foreground disabled:opacity-40"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-card border-t border-border safe-area-bottom px-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top row: extra controls */}
              <div className="flex items-center justify-center gap-2.5 sm:gap-3 pt-3 pb-1 flex-wrap">
                {!isAudioOnly && (
                  <>
                    <ControlButton
                      onClick={onFlipCamera}
                      active={false}
                      icon={<SwitchCamera className="h-4 w-4" />}
                      label="Flip"
                      small
                    />
                    <ControlButton
                      onClick={onToggleScreenShare}
                      active={isScreenSharing}
                      icon={isScreenSharing ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                      label={isScreenSharing ? "Stop" : "Share"}
                      small
                    />
                    <ControlButton
                      onClick={onToggleBlur}
                      active={isBlurred}
                      icon={<Sparkles className="h-4 w-4" />}
                      label="Blur"
                      small
                    />
                  </>
                )}
                <ControlButton
                  onClick={() => setShowChat(!showChat)}
                  active={showChat}
                  icon={<MessageSquare className="h-4 w-4" />}
                  label="Chat"
                  small
                />
                {!isAudioOnly && (
                  <ControlButton
                    onClick={togglePiP}
                    active={isPiP}
                    icon={<PictureInPicture2 className="h-4 w-4" />}
                    label="PiP"
                    small
                  />
                )}
              </div>

              {/* Main row */}
              <div className="flex items-center justify-center gap-5 py-3 sm:py-4">
                <ControlButton
                  onClick={onToggleMute}
                  active={isMuted}
                  icon={isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                />
                {!isAudioOnly && (
                  <ControlButton
                    onClick={onToggleCamera}
                    active={isCameraOff}
                    icon={isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  />
                )}
                <button
                  onClick={onEndCall}
                  className="flex items-center justify-center h-14 w-14 rounded-full bg-destructive text-destructive-foreground shadow-lg active:bg-destructive/90 transition-colors"
                >
                  <PhoneOff className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
};

// Helper control button
const ControlButton = ({
  onClick, active, icon, label, small,
}: {
  onClick: () => void;
  active: boolean;
  icon: React.ReactNode;
  label?: string;
  small?: boolean;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center rounded-full border transition-colors",
      small ? "h-10 w-10" : "h-14 w-14",
      active
        ? "bg-primary/20 border-primary/30 text-primary"
        : "bg-secondary border-border text-foreground active:bg-secondary/80"
    )}
    title={label}
  >
    {icon}
    {label && small && (
      <span className="text-[8px] mt-0.5 font-medium leading-none opacity-70">{label}</span>
    )}
  </button>
);

export default VideoCallOverlay;
