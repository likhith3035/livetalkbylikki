import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX, Radio, Loader2, Sparkles, Headphones } from "lucide-react";
import { toast } from "sonner";
import { gameWebRTC } from "../services/gameWebRTCService";
import { gameHaptics } from "../services/gameHapticsService";
import { gameAudio } from "../services/gameSoundService";

interface GameVoiceChatProps {
  roomCode: string;
  isHost: boolean;
  isOnline: boolean;
  className?: string;
}

export const GameVoiceChat: React.FC<GameVoiceChatProps> = ({
  roomCode,
  isHost,
  isOnline,
  className = "",
}) => {
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "connecting" | "connected" | "failed" | "listen-only">("idle");
  const [isMicAvailable, setIsMicAvailable] = useState(true);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isPushToTalk, setIsPushToTalk] = useState(true);
  const [isPttPressed, setIsPttPressed] = useState(false);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Voice Peer-to-Peer session
  useEffect(() => {
    if (!isOnline || !roomCode) {
      setVoiceStatus("idle");
      return;
    }

    let isMounted = true;

    async function initVoice() {
      try {
        await gameWebRTC.startVoiceDuel(roomCode, isHost, {
          onRemoteStream: (stream) => {
            if (remoteAudioRef.current && stream) {
              remoteAudioRef.current.srcObject = stream;
              remoteAudioRef.current.play().catch(() => {});
            }
          },
          onStatusChange: (status) => {
            if (isMounted) setVoiceStatus(status);
          },
          onMicAvailabilityChange: (available) => {
            if (isMounted) setIsMicAvailable(available);
          },
        });
      } catch {
        if (isMounted) setVoiceStatus("failed");
      }
    }

    initVoice();

    return () => {
      isMounted = false;
      gameWebRTC.stopVoiceDuel();
    };
  }, [roomCode, isHost, isOnline]);

  // Update speaker volume
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = isSpeakerMuted;
    }
  }, [isSpeakerMuted]);

  // Handle Push-To-Talk Keyboard (Spacebar when not typing)
  useEffect(() => {
    if (!isPushToTalk || voiceStatus !== "connected" || !isMicAvailable) return;

    const isBlockedElementActive = () => {
      const activeElement = document.activeElement;
      const activeTag = activeElement?.tagName?.toLowerCase();
      if (
        activeTag === "input" ||
        activeTag === "textarea" ||
        (activeElement as HTMLElement)?.isContentEditable
      ) {
        return true;
      }
      // If a modal or mini-game dialog (e.g. Chrome Dino) is currently open, don't hijack Space
      if (document.querySelector('[role="dialog"]') !== null) {
        return true;
      }
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isBlockedElementActive()) return;

      if (e.code === "Space" && !e.repeat && !isPttPressed) {
        e.preventDefault();
        setIsPttPressed(true);
        gameHaptics.ptt();
        gameWebRTC.setMicEnabled(true);
        setIsMicOn(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isBlockedElementActive()) return;

      if (e.code === "Space" && isPttPressed) {
        e.preventDefault();
        setIsPttPressed(false);
        gameHaptics.ptt();
        gameWebRTC.setMicEnabled(false);
        setIsMicOn(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPushToTalk, voiceStatus, isPttPressed, isMicAvailable]);

  // PTT Button Press / Release Handlers
  const handlePttStart = () => {
    if (voiceStatus !== "connected" || !isMicAvailable) return;
    setIsPttPressed(true);
    gameHaptics.ptt();
    gameWebRTC.setMicEnabled(true);
    setIsMicOn(true);
  };

  const handlePttEnd = () => {
    if (voiceStatus !== "connected" || !isMicAvailable) return;
    setIsPttPressed(false);
    gameHaptics.ptt();
    gameWebRTC.setMicEnabled(false);
    setIsMicOn(false);
  };

  // Open Mic Toggle Handler
  const handleToggleOpenMic = () => {
    if (!isMicAvailable) {
      toast.info("Microphone not detected. Operating in listen-only mode.");
      return;
    }
    gameHaptics.light();
    gameAudio.playClick();
    const next = !isMicOn;
    gameWebRTC.setMicEnabled(next);
    setIsMicOn(next);
    toast.info(next ? "Microphone Unmuted (Open Mic)" : "Microphone Muted");
  };

  // Toggle Mode (PTT vs Open Mic)
  const handleToggleMode = () => {
    gameHaptics.light();
    gameAudio.playClick();
    const nextMode = !isPushToTalk;
    setIsPushToTalk(nextMode);

    // Mute mic when switching modes
    gameWebRTC.setMicEnabled(false);
    setIsMicOn(false);
    setIsPttPressed(false);

    toast.info(nextMode ? "Switched to Push-To-Talk (Walkie-Talkie)" : "Switched to Open Mic Mode");
  };

  // Toggle Speaker
  const handleToggleSpeaker = () => {
    gameHaptics.light();
    gameAudio.playClick();
    setIsSpeakerMuted((prev) => !prev);
  };

  if (!isOnline) return null;

  return (
    <div
      className={`flex items-center gap-1.5 p-1 rounded-2xl bg-card/80 backdrop-blur-md border border-border/60 shadow-sm transition-all select-none ${className}`}
    >
      {/* Hidden Peer Audio Stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Voice Status Pill */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/60 text-[11px] font-bold">
        {voiceStatus === "connecting" ? (
          <>
            <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
            <span className="text-amber-400 hidden xs:inline">Voice...</span>
          </>
        ) : voiceStatus === "connected" && isMicAvailable ? (
          <>
            <span className="relative flex h-2 w-2">
              {isMicOn && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isMicOn ? "bg-emerald-400" : "bg-primary"
                }`}
              />
            </span>
            <span className="text-foreground hidden xs:inline">
              {isMicOn ? "Live" : "Voice Ready"}
            </span>
          </>
        ) : voiceStatus === "listen-only" || !isMicAvailable ? (
          <>
            <Headphones className="w-3 h-3 text-sky-400" />
            <span className="text-sky-400 hidden xs:inline">Listen Only</span>
          </>
        ) : (
          <>
            <Radio className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground hidden xs:inline">Voice</span>
          </>
        )}
      </div>

      {/* PTT / Mic Main Action Button */}
      {!isMicAvailable || voiceStatus === "listen-only" ? (
        <button
          type="button"
          onClick={() =>
            toast.info("Listen-only mode: No microphone detected on this device. You can still hear your opponent speak!")
          }
          title="No microphone detected. You can hear incoming opponent voice chat."
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-sky-500/10 hover:bg-sky-500/15 text-sky-400 border border-sky-500/20 transition-all cursor-pointer"
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>LISTEN ONLY</span>
        </button>
      ) : isPushToTalk ? (
        <button
          type="button"
          onPointerDown={handlePttStart}
          onPointerUp={handlePttEnd}
          onPointerLeave={handlePttEnd}
          onTouchStart={handlePttStart}
          onTouchEnd={handlePttEnd}
          disabled={voiceStatus !== "connected"}
          title="Hold to Talk (or hold Spacebar)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            isPttPressed
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-95 animate-pulse"
              : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
          }`}
        >
          <Mic className={`w-3.5 h-3.5 ${isPttPressed ? "animate-bounce" : ""}`} />
          <span>{isPttPressed ? "TRANSMITTING..." : "PUSH TO TALK"}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleToggleOpenMic}
          disabled={voiceStatus !== "connected"}
          title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            isMicOn
              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          <span>{isMicOn ? "MIC LIVE" : "MIC OFF"}</span>
        </button>
      )}

      {/* Mode Switcher (PTT vs Open Mic) - only show when mic is available */}
      {isMicAvailable && voiceStatus !== "listen-only" && (
        <button
          type="button"
          onClick={handleToggleMode}
          title={isPushToTalk ? "Switch to Open Mic" : "Switch to Push-To-Talk"}
          className="px-2 py-1.5 rounded-xl bg-muted/40 hover:bg-muted text-[10px] font-bold text-muted-foreground hover:text-foreground border border-border/40 transition-colors cursor-pointer"
        >
          {isPushToTalk ? "PTT" : "OPEN"}
        </button>
      )}

      {/* Peer Audio Speaker Toggle */}
      <button
        type="button"
        onClick={handleToggleSpeaker}
        title={isSpeakerMuted ? "Unmute Opponent Audio" : "Mute Opponent Audio"}
        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
          isSpeakerMuted
            ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
            : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
        }`}
      >
        {isSpeakerMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
