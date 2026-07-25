import { useState, useRef, useCallback, useEffect } from "react";
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Phone, X,
  Monitor, MonitorOff, SwitchCamera, Sparkles, MessageSquare, Send,
  PictureInPicture2, Clock, Shield, Hand, Camera, Signal, Smile,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VideoCallStatus } from "@/hooks/use-video-call";
import { useChatContext } from "@/contexts/ChatContext";
import { useSettings } from "@/contexts/SettingsContext";
import { CameraFilterSelector, VIDEO_FILTERS, type VideoFilter } from "@/components/video/CameraFilterSelector";

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
  onSendSurprise?: (type: string) => void;
  surpriseEffect?: { type: string; id: number } | null;
  onSendInCallMessage?: (text: string) => void;
  inCallMessages?: InCallMessage[];
  supportsScreenShare?: boolean;
  strangerTyping?: boolean;
  /** Called when user sends a quick emoji reaction */
  onSendReaction?: (emoji: string) => void;
  /** Incoming reaction from stranger */
  incomingReaction?: { emoji: string; id: number } | null;
  /** Called when user raises their hand */
  onRaiseHand?: () => void;
  /** True when stranger has raised their hand */
  strangerHandRaised?: boolean;
  /** WebRTC statistics */
  stats?: {
    rtt: number | null;
    resolution: string;
    fps: number;
    packetLoss: number;
    qualityGrade: "good" | "fair" | "poor";
    isDegraded: boolean;
  };
  isPiPActive?: boolean;
  onTogglePiP?: () => void;
  supportsPiP?: boolean;
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
  onSendSurprise,
  surpriseEffect,
  onSendInCallMessage, inCallMessages = [],
  supportsScreenShare = false,
  strangerTyping = false,
  onSendReaction,
  incomingReaction,
  onRaiseHand,
  strangerHandRaised = false,
  stats,
  isPiPActive = false,
  onTogglePiP,
  supportsPiP = true,
}: VideoCallOverlayProps) => {
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [showControls, setShowControls] = useState(true);
  const [showSurpriseMenu, setShowSurpriseMenu] = useState(false);
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string }[]>([]);
  const [callQuality, setCallQuality] = useState<"good" | "fair" | "poor" | "unknown">("unknown");
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<VideoFilter>(VIDEO_FILTERS[0]);
  const qualityIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { settings } = useSettings();
  const { privacyModeActive, privacyAlertActive, userName, strangerName, sessionId, isReconnecting } = useChatContext();
  const [tabFocused, setTabFocused] = useState(true);

  // Monitor focus/blur for screen-recording tab protection
  useEffect(() => {
    if (!privacyModeActive || !settings.protectionEnabled) {
      setTabFocused(true);
      return;
    }
    const handleFocus = () => setTabFocused(true);
    const handleBlur = () => setTabFocused(false);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    setTabFocused(document.hasFocus());
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [privacyModeActive, settings.protectionEnabled]);
  const [callDuration, setCallDuration] = useState(0);
  const [isPiP, setIsPiP] = useState(false);
  const [isLocalMain, setIsLocalMain] = useState(false); // WhatsApp-style swap
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
      node.play().catch(() => { });
    }
  }, [localStream]);

  const remoteVideoRef = useCallback((node: HTMLVideoElement | null) => {
    remoteVideoElRef.current = node;
    if (node && remoteStream && node.srcObject !== remoteStream) {
      node.srcObject = remoteStream;
      node.play().catch(() => { });
    }
  }, [remoteStream]);

  // Also update when streams change (element already mounted)
  useEffect(() => {
    const el = localVideoElRef.current;
    if (el && localStream && el.srcObject !== localStream) {
      el.srcObject = localStream;
      el.play().catch(() => { });
    }
  }, [localStream]);

  useEffect(() => {
    const el = remoteVideoElRef.current;
    if (el && remoteStream && el.srcObject !== remoteStream) {
      el.srcObject = remoteStream;
      el.play().catch(() => { });
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

  // Auto-hide controls after 4s — cleanup on unmount too
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

  // ── New: floating emoji reactions ──────────────────────────────────────────
  const addFloatingReaction = useCallback((emoji: string) => {
    const id = Date.now() + Math.random();
    setFloatingReactions((prev) => [...prev, { id, emoji }]);
    setTimeout(() => setFloatingReactions((prev) => prev.filter((r) => r.id !== id)), 2200);
  }, []);

  // Show incoming reaction from stranger
  useEffect(() => {
    if (incomingReaction) addFloatingReaction(incomingReaction.emoji);
  }, [incomingReaction, addFloatingReaction]);

  const handleSendReaction = (emoji: string) => {
    addFloatingReaction(emoji);
    onSendReaction?.(emoji);
    setShowReactionBar(false);
  };

  // ── New: raise hand ────────────────────────────────────────────────────────
  const handleRaiseHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    onRaiseHand?.();
  };

  // ── New: call quality monitor (WebRTC stats) ───────────────────────────────
  useEffect(() => {
    if (callStatus !== "active") {
      setCallQuality("unknown");
      return;
    }
    const checkQuality = async () => {
      try {
        // Access pcRef via RTCPeerConnection.getStats — we use remoteStream as a proxy
        // since we don't have direct pc access here. Use connection state heuristic instead.
        const connections = Array.from((navigator as any).mediaDevices?.enumerateDevices?.() || []);
        void connections; // unused — use RTCPeerConnection global stats if available

        // Heuristic: check remote video track stats via getStats on a video element
        const videoEl = document.querySelector("video[autoplay]:not([muted])") as HTMLVideoElement | null;
        if (videoEl?.srcObject instanceof MediaStream) {
          const track = (videoEl.srcObject as MediaStream).getVideoTracks()[0];
          if (track) {
            // Use track readyState as quality proxy
            setCallQuality(track.readyState === "live" ? "good" : "fair");
          }
        }
      } catch { setCallQuality("unknown"); }
    };
    checkQuality();
    qualityIntervalRef.current = setInterval(checkQuality, 5000);
    return () => { if (qualityIntervalRef.current) clearInterval(qualityIntervalRef.current); };
  }, [callStatus]);

  // ── New: snapshot capture ──────────────────────────────────────────────────
  const captureSnapshot = useCallback(() => {
    const videoEl = remoteVideoElRef.current;
    if (!videoEl || !remoteStream) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoEl.videoWidth || 640;
      canvas.height = videoEl.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL("image/jpeg", 0.85);
      setSnapshotUrl(url);
      setShowSnapshot(true);
      // Auto-close after 4s
      setTimeout(() => setShowSnapshot(false), 4000);
    } catch { /* canvas tainted or not available */ }
  }, [remoteStream]);

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
        className="fixed inset-0 lg:left-[220px] z-[90] bg-background flex flex-col animate-fade-in"
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
            <div className="h-full w-full">
              {isLocalMain ? (
                localStream && !isCameraOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                      "h-full w-full object-cover",
                      (isBlurred || !tabFocused || privacyAlertActive) && "video-blur"
                    )}
                    style={{
                      transform: [
                        facingMode === "user" && !isScreenSharing ? "scaleX(-1)" : "",
                        isBlurred ? "scale(1.15)" : "",
                      ].filter(Boolean).join(" ") || "none",
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <VideoOff className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )
              ) : (
                remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={cn(
                      "h-full w-full",
                      remoteIsScreenSharing ? "object-contain" : "object-cover",
                      (remoteBlurred || !tabFocused || privacyAlertActive) && "video-blur"
                    )}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <VideoOff className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30" />
                  </div>
                )
              )}
            </div>
          )}

          {/* Surprise Reactions Overlay */}
          <AnimatePresence>
            {surpriseEffect && (
              <SurpriseReactionOverlay key={surpriseEffect.id} type={surpriseEffect.type} />
            )}
          </AnimatePresence>

          {/* Remote state indicators */}
          {(remoteMuted || remoteCameraOff || remoteBlurred) && !isLocalMain && (
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
          {!isAudioOnly && remoteIsScreenSharing && !isLocalMain && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
              <div className="flex items-center gap-1.5 rounded-full bg-primary/90 text-primary-foreground px-3 py-1 text-xs font-medium shadow-lg">
                <Monitor className="h-3.5 w-3.5" />
                Stranger is sharing screen
              </div>
            </div>
          )}



          {/* Screen blurred mask */}
          {!tabFocused && privacyModeActive && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl flex flex-col items-center justify-center gap-3 z-[25] select-none pointer-events-auto">
              <Shield className="h-10 w-10 text-primary animate-pulse" />
              <p className="text-sm font-bold text-foreground tracking-widest uppercase">Protected Content</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Screen capture protections are active</p>
            </div>
          )}

          {/* Draggable PiP video - only for video calls */}
          {!isAudioOnly && (
            <motion.div
              drag
              dragMomentum={false}
              dragElastic={0.08}
              dragConstraints={{
                top: 0,
                left: typeof window !== "undefined" ? -window.innerWidth + 140 : -250,
                right: 0,
                bottom: typeof window !== "undefined" ? window.innerHeight - 200 : 400,
              }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-20 h-28 xs:w-24 xs:h-32 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border-2 border-primary/40 shadow-2xl bg-muted z-20 cursor-grab active:cursor-grabbing touch-none ring-1 ring-white/10"
              onClick={(e) => { e.stopPropagation(); setIsLocalMain(!isLocalMain); }}
              whileDrag={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onDoubleClick={(e) => { e.stopPropagation(); onFlipCamera(); }}
            >
              {!isLocalMain ? (
                localStream && !isCameraOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                      "h-full w-full",
                      isScreenSharing ? "object-contain bg-black" : "object-cover",
                      (isBlurred || !tabFocused || privacyAlertActive) && "video-blur"
                    )}
                    style={{
                      transform: [
                        facingMode === "user" && !isScreenSharing ? "scaleX(-1)" : "",
                        isBlurred ? "scale(1.15)" : "",
                      ].filter(Boolean).join(" ") || "none",
                      filter: activeFilter.cssFilter !== "none" ? activeFilter.cssFilter : undefined,
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-secondary">
                    <VideoOff className="h-6 w-6 text-muted-foreground" />
                  </div>
                )
              ) : (
                remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={cn(
                      "h-full w-full object-cover",
                      remoteIsScreenSharing && "object-contain bg-black",
                      (!tabFocused || privacyAlertActive) && "video-blur"
                    )}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-secondary">
                    <VideoOff className="h-6 w-6 text-muted-foreground" />
                  </div>
                )
              )}
              {((!isLocalMain && isScreenSharing) || (isLocalMain && remoteIsScreenSharing)) && (
                <div className="absolute bottom-1 left-1 right-1 flex items-center justify-center">
                  <span className="text-[9px] bg-primary/80 text-primary-foreground rounded px-1.5 py-0.5 font-medium">
                    Screen
                  </span>
                </div>
              )}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full bg-black/20 backdrop-blur-md">
                  <PictureInPicture2 className="h-3 w-3 text-white" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Floating emoji reactions ── */}
          <div className="absolute inset-0 pointer-events-none z-[105] overflow-hidden">
            <AnimatePresence>
              {floatingReactions.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: "85%", x: `${20 + Math.random() * 60}%`, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 1, 0], y: "10%", scale: [0.5, 1.4, 1.2, 0.8] }}
                  transition={{ duration: 2.0, ease: "easeOut" }}
                  className="absolute text-4xl drop-shadow-lg"
                >
                  {r.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ── Stranger hand raised indicator ── */}
          <AnimatePresence>
            {strangerHandRaised && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: "-50%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%" }}
                exit={{ opacity: 0, scale: 0.8, x: "-50%" }}
                className="absolute top-16 left-1/2 z-30 flex items-center gap-2 bg-amber-500/90 text-white px-4 py-2 rounded-full shadow-xl text-sm font-bold"
              >
                <span className="text-lg">🖐️</span> Stranger raised their hand
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Your hand raised indicator ── */}
          <AnimatePresence>
            {handRaised && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: [1, 1.1, 1] }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute bottom-36 left-4 z-30 flex items-center gap-2 bg-amber-500/80 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg"
              >
                🖐️ Hand raised
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Snapshot preview ── */}
          <AnimatePresence>
            {showSnapshot && snapshotUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute bottom-36 right-4 z-40 w-32 h-20 rounded-xl overflow-hidden border-2 border-white/40 shadow-2xl"
                onClick={() => setShowSnapshot(false)}
              >
                <img src={snapshotUrl} alt="snapshot" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Camera className="h-4 w-4 text-white drop-shadow" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status pill with timer + quality */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-sm border border-border px-3 py-1.5 z-10"
              >
                <span className={cn("h-2 w-2 rounded-full animate-pulse", isReconnecting ? "bg-amber-400" : "bg-online")} />
                <span className="text-xs font-medium text-foreground">
                  {isReconnecting ? "Reconnecting..." : "Live"}
                </span>
                {isReconnecting && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-extrabold animate-pulse">
                    <Zap className="h-3 w-3" /> P2P ICE Restart
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground tabular-nums flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(callDuration)}
                </span>
                {/* Quality dots & WebRTC stats */}
                {stats ? (
                  <div className="flex items-center gap-1.5 ml-1 border-l border-border/40 pl-2 text-[10px] font-mono">
                    <span className={cn("font-bold flex items-center gap-0.5", stats.qualityGrade === "good" ? "text-emerald-400" : stats.qualityGrade === "fair" ? "text-amber-400" : "text-rose-400")}>
                      <Signal className="h-3 w-3" />
                      {stats.rtt !== null ? `${stats.rtt}ms` : "P2P"}
                    </span>
                    <span className="text-[9px] bg-secondary/80 text-foreground px-1 rounded font-sans uppercase font-bold">{stats.resolution}</span>
                    <span className="text-[9px] text-muted-foreground opacity-80">{stats.fps}fps</span>
                    {stats.packetLoss > 0 && (
                      <span className="text-[9px] text-rose-400 font-bold">{stats.packetLoss}% loss</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-end gap-[2px] ml-1">
                    {[1, 2, 3].map((bar) => (
                      <div
                        key={bar}
                        className={cn(
                          "w-[3px] rounded-full transition-colors",
                          bar === 1 ? "h-1.5" : bar === 2 ? "h-2.5" : "h-3.5",
                          callQuality === "good" ? "bg-green-400" :
                          callQuality === "fair" ? (bar <= 2 ? "bg-amber-400" : "bg-muted-foreground/30") :
                          callQuality === "poor" ? (bar <= 1 ? "bg-destructive" : "bg-muted-foreground/30") :
                          "bg-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                )}
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

        {/* Typing indicator in video call */}
        <AnimatePresence>
          {strangerTyping && !showChat && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-[120px] left-4 z-30 flex items-center gap-2 bg-card/80 backdrop-blur-md border border-border/50 px-3 py-2 rounded-full shadow-lg pointer-events-none"
            >
              <div className="flex gap-0.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">Stranger is typing...</span>
            </motion.div>
          )}
        </AnimatePresence>

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
                {isAudioOnly && onUpgradeToVideo && (
                  <ControlButton
                    onClick={onUpgradeToVideo}
                    active={false}
                    icon={<Video className="h-4 w-4" />}
                    label="Video"
                    small
                  />
                )}
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
                      onClick={() => setIsLocalMain(!isLocalMain)}
                      active={isLocalMain}
                      icon={<PictureInPicture2 className="h-4 w-4 rotate-180" />}
                      label="Swap"
                      small
                    />
                    {supportsScreenShare && (
                      <ControlButton
                        onClick={onToggleScreenShare}
                        active={isScreenSharing}
                        icon={isScreenSharing ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                        label={isScreenSharing ? "Stop" : "Share"}
                        small
                      />
                    )}
                    <ControlButton
                      onClick={onToggleBlur}
                      active={isBlurred}
                      icon={<Sparkles className="h-4 w-4" />}
                      label="Blur"
                      small
                    />
                  </>
                )}
                <div className="relative">
                  <ControlButton
                    onClick={() => {
                        setShowSurpriseMenu(!showSurpriseMenu);
                        if (!showSurpriseMenu) setShowChat(false);
                    }}
                    active={showSurpriseMenu}
                    icon={<Sparkles className={cn("h-4 w-4", showSurpriseMenu && "animate-pulse")} />}
                    label="Surprise"
                    small
                  />
                  
                  {/* Surprise Menu: Adaptive positioning */}
                  <AnimatePresence>
                    {showSurpriseMenu && (
                      <>
                        {/* Mobile Overlay Backdrop */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-[60] bg-background/40 backdrop-blur-md sm:hidden"
                          onClick={() => setShowSurpriseMenu(false)}
                        />
                        
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10, x: "-50%" }}
                          animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                          exit={{ opacity: 0, scale: 0.9, y: 10, x: "-50%" }}
                          className={cn(
                            "fixed sm:absolute z-[70] flex gap-3 rounded-2xl bg-card border border-border p-3 shadow-2xl transition-all",
                            "bottom-1/2 left-1/2 -translate-y-1/2 sm:bottom-14 sm:translate-y-0 min-w-[200px] justify-around"
                          )}
                        >
                          {[
                            { type: "love", icon: "❤️", label: "Hearts" },
                            { type: "fire", icon: "🔥", label: "Fire" },
                            { type: "party", icon: "🎉", label: "Burst" },
                            { type: "star", icon: "⭐", label: "Sparkle" },
                          ].map((item) => (
                            <button
                              key={item.type}
                              onClick={() => {
                                  onSendSurprise?.(item.type);
                                  setShowSurpriseMenu(false);
                              }}
                              className="flex flex-col items-center gap-1 group"
                            >
                              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-secondary group-hover:bg-primary/20 text-2xl transition-all group-hover:scale-110 active:scale-95">
                                {item.icon}
                              </div>
                              <span className="text-[9px] font-medium text-muted-foreground">{item.label}</span>
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <ControlButton
                  onClick={() => {
                      setShowChat(!showChat);
                      if (!showChat) setShowSurpriseMenu(false);
                  }}
                  active={showChat}
                  icon={<MessageSquare className="h-4 w-4" />}
                  label="Chat"
                  small
                />
                {/* ── Reaction bar button ── */}
                <div className="relative">
                  <ControlButton
                    onClick={() => {
                      setShowReactionBar(!showReactionBar);
                      setShowSurpriseMenu(false);
                    }}
                    active={showReactionBar}
                    icon={<Smile className="h-4 w-4" />}
                    label="React"
                    small
                  />
                  <AnimatePresence>
                    {showReactionBar && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.9 }}
                        className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-2 bg-card border border-border rounded-2xl p-2 shadow-2xl z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {["👍", "❤️", "😂", "😮", "🔥", "👏", "🥳", "💯"].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleSendReaction(emoji)}
                            className="text-xl hover:scale-125 active:scale-95 transition-transform w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* ── Raise hand ── */}
                <ControlButton
                  onClick={handleRaiseHand}
                  active={handRaised}
                  icon={<Hand className={cn("h-4 w-4", handRaised && "animate-bounce")} />}
                  label="Hand"
                  small
                />
                {/* ── Snapshot ── */}
                {!isAudioOnly && (
                  <ControlButton
                    onClick={captureSnapshot}
                    active={false}
                    icon={<Camera className="h-4 w-4" />}
                    label="Snap"
                    small
                  />
                )}
                {!isAudioOnly && supportsPiP && (
                  <ControlButton
                    onClick={() => {
                      if (onTogglePiP) onTogglePiP();
                      else togglePiP();
                    }}
                    active={isPiPActive || isPiP}
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

// --- Surprise Reaction Components ---

const SurpriseReactionOverlay = ({ type }: { type: string }) => {
  const getEmoji = () => {
    switch (type) {
      case "love": return "❤️";
      case "fire": return "🔥";
      case "party": return "🎉";
      case "star": return "⭐";
      default: return "✨";
    }
  };

  // Reduced to 12 particles (was 25) — stable positions, no Math.random() in render
  const PARTICLE_DATA = [
    { x: "15%", y: "80%", dx: "25%", dy: "-15%", rot: 120, dur: 2.2, delay: 0 },
    { x: "30%", y: "85%", dx: "60%", dy: "-5%",  rot: -90, dur: 2.5, delay: 0.08 },
    { x: "50%", y: "90%", dx: "40%", dy: "-20%", rot: 200, dur: 2.0, delay: 0.15 },
    { x: "70%", y: "80%", dx: "20%", dy: "-10%", rot: -150,dur: 2.3, delay: 0.05 },
    { x: "85%", y: "75%", dx: "10%", dy: "-25%", rot: 80,  dur: 2.1, delay: 0.12 },
    { x: "20%", y: "60%", dx: "70%", dy: "-30%", rot: -60, dur: 2.4, delay: 0.2 },
    { x: "40%", y: "70%", dx: "55%", dy: "-8%",  rot: 300, dur: 1.9, delay: 0.1 },
    { x: "60%", y: "65%", dx: "30%", dy: "-35%", rot: -200,dur: 2.6, delay: 0.18 },
    { x: "75%", y: "55%", dx: "15%", dy: "-40%", rot: 140, dur: 2.0, delay: 0.07 },
    { x: "10%", y: "50%", dx: "80%", dy: "-15%", rot: -100,dur: 2.3, delay: 0.25 },
    { x: "45%", y: "45%", dx: "50%", dy: "-45%", rot: 250, dur: 1.8, delay: 0.03 },
    { x: "90%", y: "60%", dx: "5%",  dy: "-20%", rot: -180,dur: 2.2, delay: 0.14 },
  ];

  return (
    <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
      {PARTICLE_DATA.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, x: p.x, y: p.y, rotate: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.3, 1, 0.5], x: p.dx, y: p.dy, rotate: p.rot }}
          transition={{ duration: p.dur, delay: p.delay, ease: "easeOut" }}
          className="absolute text-3xl drop-shadow-md"
        >
          {getEmoji()}
        </motion.div>
      ))}

      {/* Background flash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.12, 0] }}
        transition={{ duration: 0.6 }}
        className={cn(
          "absolute inset-0",
          type === "love" && "bg-rose-500",
          type === "fire" && "bg-orange-600",
          type === "party" && "bg-emerald-500",
          type === "star" && "bg-amber-400"
        )}
      />
    </div>
  );
};

export default VideoCallOverlay;
