import { useRef, useEffect } from "react";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VideoCallStatus } from "@/hooks/use-video-call";

interface VideoCallOverlayProps {
  callStatus: VideoCallStatus;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

const VideoCallOverlay = ({
  callStatus, localStream, remoteStream,
  isMuted, isCameraOff,
  onToggleMute, onToggleCamera, onEndCall, onAccept, onDecline,
}: VideoCallOverlayProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Incoming call prompt
  if (callStatus === "incoming") {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 backdrop-blur-lg animate-fade-in">
        <div className="flex flex-col items-center gap-6 rounded-2xl bg-card border border-border p-8 shadow-2xl max-w-xs w-full mx-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center animate-pulse">
              <Video className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-display font-semibold text-foreground">Incoming Video Call</p>
            <p className="text-sm text-muted-foreground">Stranger wants to video chat</p>
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
            <Video className="h-8 w-8 text-primary" />
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
          <p className="text-sm text-muted-foreground">Connecting video...</p>
        </div>
      </div>
    );
  }

  // Active call
  if (callStatus === "active") {
    return (
      <div className="fixed inset-0 z-[90] bg-background flex flex-col animate-fade-in">
        {/* Remote video (fullscreen) */}
        <div className="flex-1 relative bg-muted overflow-hidden">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <VideoOff className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}

          {/* Local video (PiP) */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-24 h-32 sm:w-36 sm:h-48 rounded-xl overflow-hidden border-2 border-border shadow-xl bg-muted">
            {localStream && !isCameraOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover mirror"
                style={{ transform: "scaleX(-1)" }}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-secondary">
                <VideoOff className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Status pill */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-sm border border-border px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-online animate-pulse" />
            <span className="text-xs font-medium text-foreground">Live</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 py-4 sm:py-6 bg-card border-t border-border safe-area-bottom">
          <button
            onClick={onToggleMute}
            className={cn(
              "flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full border transition-colors",
              isMuted
                ? "bg-destructive/20 border-destructive/30 text-destructive"
                : "bg-secondary border-border text-foreground hover:bg-secondary/80"
            )}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <button
            onClick={onToggleCamera}
            className={cn(
              "flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full border transition-colors",
              isCameraOff
                ? "bg-destructive/20 border-destructive/30 text-destructive"
                : "bg-secondary border-border text-foreground hover:bg-secondary/80"
            )}
          >
            {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </button>

          <button
            onClick={onEndCall}
            className="flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 transition-colors"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default VideoCallOverlay;
