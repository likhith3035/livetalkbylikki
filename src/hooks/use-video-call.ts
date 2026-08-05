import { useState, useRef, useCallback, useEffect } from "react";
import { sounds } from "@/lib/sounds";
import { RENEGOTIATE_EVENT, handleRenegotiateOffer } from "@/features/cross-device-sync/webrtcRenegotiation";
import { useToast } from "@/hooks/use-toast";

export type VideoCallStatus = "idle" | "requesting" | "incoming" | "connecting" | "active";

export interface WebRTCStats {
  rtt: number | null;
  resolution: string;
  fps: number;
  packetLoss: number;
  qualityGrade: "good" | "fair" | "poor";
  isDegraded: boolean;
}

const getIceServers = (): RTCConfiguration => {
  // Free public TURN servers — these relay traffic when direct P2P fails (symmetric NAT, mobile networks)
  // Using Open Relay (metered.ca) free tier + Cloudflare TURN public credentials
  const turnServers: RTCIceServer[] = [
    // Open Relay Project — free public TURN
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ];

  const stunServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ];

  // Allow overriding via env var (e.g. your own Twilio/Coturn credentials)
  try {
    const customServers = import.meta.env.VITE_ICE_SERVERS;
    if (customServers) {
      const parsed = JSON.parse(customServers);
      if (Array.isArray(parsed)) {
        console.log("WebRTC: Using custom ICE servers from environment");
        return { iceServers: [...parsed, ...stunServers] };
      }
    }
  } catch (e) {
    console.error("WebRTC: Failed to parse VITE_ICE_SERVERS", e);
  }

  return { iceServers: [...stunServers, ...turnServers] };
};

const ICE_CONFIG = getIceServers();

interface UseVideoCallOptions {
  sessionId: string;
  sendSignalingEvent: (event: string, payload: any) => void;
  onCallEnded?: () => void;
  onCallUpgraded?: () => void;
}

export function useVideoCall({ sessionId, sendSignalingEvent, onCallEnded, onCallUpgraded }: UseVideoCallOptions) {
  const [callStatus, setCallStatus] = useState<VideoCallStatus>("idle");
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteIsScreenSharing, setRemoteIsScreenSharing] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
  const [remoteBlurred, setRemoteBlurred] = useState(false);
  const [surpriseEffect, setSurpriseEffect] = useState<{ type: string; id: number } | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [stats, setStats] = useState<WebRTCStats>({
    rtt: null,
    resolution: "HD",
    fps: 30,
    packetLoss: 0,
    qualityGrade: "good",
    isDegraded: false,
  });
  const [isPiPActive, setIsPiPActive] = useState(false);
  const { toast } = useToast();

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const sendSignalingEventRef = useRef(sendSignalingEvent);
  // Keep a ref for callStatus so callbacks capture the latest value without stale closures
  const callStatusRef = useRef<VideoCallStatus>("idle");
  // Keep a ref for isAudioOnly so async handlers always read the latest value
  const isAudioOnlyRef = useRef(false);
  // Ref for toggleScreenShare to avoid stale closure in onended
  const toggleScreenShareRef = useRef<() => void>(() => {});

  useEffect(() => { sendSignalingEventRef.current = sendSignalingEvent; }, [sendSignalingEvent]);

  // Keep refs in sync with state
  const setCallStatusSynced = useCallback((status: VideoCallStatus) => {
    callStatusRef.current = status;
    setCallStatus(status);
  }, []);

  const setIsAudioOnlySynced = useCallback((val: boolean) => {
    isAudioOnlyRef.current = val;
    setIsAudioOnly(val);
  }, []);

  const [audioOutput, setAudioOutput] = useState<"speaker" | "earpiece" | "bluetooth">("speaker");

  const toggleAudioOutput = useCallback(async (audioElement?: HTMLAudioElement | null) => {
    const outputs: ("speaker" | "earpiece" | "bluetooth")[] = ["speaker", "earpiece", "bluetooth"];
    const nextIndex = (outputs.indexOf(audioOutput) + 1) % outputs.length;
    const nextOutput = outputs[nextIndex];

    setAudioOutput(nextOutput);

    if (audioElement && typeof (audioElement as any).setSinkId === "function") {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter((d) => d.kind === "audiooutput");
        if (audioDevices.length > 0) {
          const targetDevice = audioDevices.find((d) =>
            nextOutput === "speaker"
              ? d.label.toLowerCase().includes("speaker")
              : nextOutput === "bluetooth"
              ? d.label.toLowerCase().includes("bluetooth") || d.label.toLowerCase().includes("headset")
              : true
          ) || audioDevices[0];

          await (audioElement as any).setSinkId(targetDevice.deviceId);
        }
      } catch (err) {
        console.warn("WebRTC: setSinkId error", err);
      }
    }

    toast({
      title: `Audio Output: ${nextOutput.toUpperCase()}`,
      description: `Routing audio to ${nextOutput === "speaker" ? "Phone Speaker" : nextOutput === "earpiece" ? "Earpiece" : "Bluetooth Headset"}`,
    });
  }, [audioOutput, toast]);

  const cleanup = useCallback(() => {
    console.log("WebRTC: Cleaning up call...");
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setRemoteIsScreenSharing(false);
    setIsBlurred(false);
    setIsReconnecting(false);
    setIsAudioOnlySynced(false);
    setFacingMode("user");
    setRemoteMuted(false);
    setRemoteCameraOff(false);
    setRemoteBlurred(false);
    pendingCandidatesRef.current = [];
  }, [setIsAudioOnlySynced]);



  // Drain buffered ICE candidates — safe to call multiple times
  const drainPendingCandidates = useCallback(async (pc: RTCPeerConnection) => {
    if (!pc.remoteDescription || pendingCandidatesRef.current.length === 0) return;
    const candidates = [...pendingCandidatesRef.current];
    pendingCandidatesRef.current = [];
    for (const c of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (err) {
        console.warn("WebRTC: Failed to add buffered ICE candidate:", err);
      }
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    console.log("WebRTC: Creating PeerConnection...", ICE_CONFIG);
    const pc = new RTCPeerConnection(ICE_CONFIG);
    // Use a single stable MediaStream for remote tracks — no new object on every track
    const remote = new MediaStream();
    setRemoteStream(remote);

    pc.ontrack = (e) => {
      console.log("WebRTC: Received remote track", e.track?.kind);
      if (e.streams && e.streams[0]) {
        e.streams[0].getTracks().forEach((track) => {
          if (!remote.getTrackById(track.id)) {
            remote.addTrack(track);
          }
        });
      } else if (e.track) {
        if (!remote.getTrackById(e.track.id)) {
          remote.addTrack(e.track);
        }
      }
      setRemoteStream(new MediaStream(remote.getTracks()));
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log("WebRTC: Sending ICE candidate");
        sendSignalingEventRef.current("webrtc:ice", { senderId: sessionId, candidate: e.candidate.toJSON() });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("WebRTC: ICE Connection State:", pc.iceConnectionState);
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setCallStatusSynced("active");
        setIsReconnecting(false);
      }
      if (pc.iceConnectionState === "disconnected") {
        console.warn("WebRTC: ICE disconnected — attempting automatic recovery");
        setIsReconnecting(true);
        setTimeout(() => {
          if (
            pcRef.current === pc &&
            pc.iceConnectionState !== "connected" &&
            pc.iceConnectionState !== "completed"
          ) {
            try {
              pc.restartIce();
              handleRenegotiateOffer(pc, sendSignalingEventRef.current, sessionId);
              console.log("WebRTC: Automatic ICE restart & renegotiation triggered");
            } catch (err) {
              console.warn("WebRTC: ICE restart trigger error:", err);
            }
          }
        }, 2000);
      }
      if (pc.iceConnectionState === "failed") {
        console.warn("WebRTC: ICE failed — attempting ICE restart before giving up");
        setIsReconnecting(true);
        // Try ICE restart once — this re-gathers candidates using TURN if STUN failed
        if (pc.signalingState === "stable" || pc.signalingState === "have-local-offer") {
          try {
            pc.restartIce();
            handleRenegotiateOffer(pc, sendSignalingEventRef.current, sessionId);
            console.log("WebRTC: ICE restart triggered");
            // Give it 8 seconds to recover
            setTimeout(() => {
              if (pcRef.current === pc &&
                  pc.iceConnectionState !== "connected" &&
                  pc.iceConnectionState !== "completed") {
                console.warn("WebRTC: ICE restart failed — ending call");
                sendSignalingEventRef.current("webrtc:end", { senderId: sessionId });
                cleanup();
                setCallStatusSynced("idle");
                setIsReconnecting(false);
                onCallEnded?.();
              }
            }, 8000);
            return;
          } catch {
            // restartIce not supported — fall through to end call
          }
        }
        sendSignalingEventRef.current("webrtc:end", { senderId: sessionId });
        cleanup();
        setCallStatusSynced("idle");
        setIsReconnecting(false);
        onCallEnded?.();
      }
    };

    pc.onsignalingstatechange = () => {
      console.log("WebRTC: Signaling State:", pc.signalingState);
    };

    pcRef.current = pc;
    return pc;
  }, [sessionId, cleanup, setCallStatusSynced, onCallEnded]);

  const getMedia = useCallback(async (facing: "user" | "environment" = "user", audioOnly = false) => {
    const videoConstraints: (MediaTrackConstraints | boolean)[] = [
      { facingMode: { exact: facing } },
      { facingMode: facing },
      { facingMode: "user" },
      true,
    ];

    let lastError: unknown;

    if (audioOnly) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
      } catch (err) {
        console.error("WebRTC: Audio-only getUserMedia failed:", err);
        throw err;
      }
    }

    for (const videoConstraint of videoConstraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraint,
          audio: true,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        console.log("WebRTC: getUserMedia succeeded with constraint:", videoConstraint);
        return stream;
      } catch (err) {
        console.warn("WebRTC: getUserMedia failed with constraint:", videoConstraint, err);
        lastError = err;
      }
    }

    // All video attempts failed — fall back to audio-only
    try {
      console.warn("WebRTC: All video constraints failed, falling back to audio-only");
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsAudioOnlySynced(true);
      return stream;
    } catch (err) {
      console.error("WebRTC: All getUserMedia attempts failed:", lastError);
      throw lastError;
    }
  }, [setIsAudioOnlySynced]);

  const supportsScreenShare = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);

  const startCall = useCallback(async (audioOnly = false) => {
    setCallStatusSynced("requesting");
    setIsAudioOnlySynced(audioOnly);
    sendSignalingEventRef.current("webrtc:request", { senderId: sessionId, audioOnly });
  }, [sessionId, setCallStatusSynced, setIsAudioOnlySynced]);

  const acceptCall = useCallback(async () => {
    try {
      setCallStatusSynced("connecting");
      // Read isAudioOnly from ref to get the latest value set by webrtc:request handler
      const audioOnly = isAudioOnlyRef.current;
      const stream = await getMedia("user", audioOnly);
      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      // DO NOT drain pendingCandidatesRef here — remote description not set yet.
      // Candidates will be drained in webrtc:offer handler after setRemoteDescription.
      sendSignalingEventRef.current("webrtc:accept", { senderId: sessionId, audioOnly });
    } catch (err: any) {
      console.error("WebRTC: acceptCall failed:", err);
      setCallStatusSynced("idle");
      cleanup();
      toast({
        variant: "destructive",
        title: "Call Access Denied",
        description: err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError"
          ? "Microphone or Camera permission was denied in your browser settings."
          : typeof window !== "undefined" && !window.isSecureContext
          ? "Calls require HTTPS. Please access the site over HTTPS."
          : err?.message || "Could not access microphone or camera. Check if another app is using it.",
      });
    }
  }, [sessionId, getMedia, createPeerConnection, cleanup, setCallStatusSynced]);

  const declineCall = useCallback(() => {
    sendSignalingEventRef.current("webrtc:decline", { senderId: sessionId });
    setCallStatusSynced("idle");
  }, [sessionId, setCallStatusSynced]);

  const endCall = useCallback(() => {
    sendSignalingEventRef.current("webrtc:end", { senderId: sessionId });
    cleanup();
    setCallStatusSynced("idle");
    onCallEnded?.();
  }, [sessionId, cleanup, onCallEnded, setCallStatusSynced]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const muted = !audioTrack.enabled;
        setIsMuted(muted);
        sendSignalingEventRef.current("webrtc:state", { senderId: sessionId, key: "muted", value: muted });
      }
    }
  }, [sessionId]);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const off = !videoTrack.enabled;
        setIsCameraOff(off);
        sendSignalingEventRef.current("webrtc:state", { senderId: sessionId, key: "cameraOff", value: off });
      }
    }
  }, [sessionId]);

  const flipCamera = useCallback(async () => {
    if (!localStreamRef.current || !pcRef.current) return;
    const newFacing = facingMode === "user" ? "environment" : "user";
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: newFacing } },
        audio: false,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
      if (sender && newVideoTrack) await sender.replaceTrack(newVideoTrack);
      if (oldVideoTrack) {
        localStreamRef.current.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
      }
      localStreamRef.current.addTrack(newVideoTrack);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      setFacingMode(newFacing);
    } catch {
      // Camera flip not supported on this device
    }
  }, [facingMode]);

  // Native Android Custom Call Notification & Action Listener (Mute, Camera, End Call, Accept, Decline)
  useEffect(() => {
    const isNativeAndroid =
      typeof window !== "undefined" &&
      (window as any).Capacitor?.isNativePlatform?.() &&
      (window as any).Capacitor?.getPlatform?.() === "android";

    if (!isNativeAndroid) return;

    let actionListener: { remove: () => void } | null = null;

    if (callStatus === "incoming") {
      import("@/plugins/call-service").then(async ({ default: CallService }) => {
        CallService.startIncomingCallService({ strangerName: "Stranger" }).catch(() => {});

        actionListener = await CallService.addListener("callAction", (data) => {
          if (data.action === "acceptCall") {
            acceptCall();
          } else if (data.action === "declineCall") {
            declineCall();
          }
        });
      });
    } else if (callStatus === "active") {
      import("@/plugins/call-service").then(async ({ default: CallService }) => {
        CallService.startCallService({ strangerName: "Stranger" }).catch(() => {});

        actionListener = await CallService.addListener("callAction", (data) => {
          if (data.action === "toggleMute") {
            toggleMute();
          } else if (data.action === "toggleCamera") {
            toggleCamera();
          } else if (data.action === "endCall") {
            endCall();
          }
        });
      });
    } else {
      import("@/plugins/call-service").then(({ default: CallService }) => {
        CallService.stopCallService().catch(() => {});
      });
    }

    return () => {
      if (actionListener) actionListener.remove();
    };
  }, [callStatus, toggleMute, toggleCamera, endCall, acceptCall, declineCall]);

  const screenCaptureListenerRef = useRef<{ remove: () => void } | null>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const toggleScreenShare = useCallback(async () => {
    if (!pcRef.current) return;

    if (isScreenSharing) {
      // === STOP SCREEN SHARING ===
      // Clean up native screen capture listener if active
      if (screenCaptureListenerRef.current) {
        try {
          screenCaptureListenerRef.current.remove();
          const ScreenCapture = (await import("@/plugins/screen-capture")).default;
          await ScreenCapture.stopCapture();
        } catch { /* already stopped */ }
        screenCaptureListenerRef.current = null;
      }
      if (screenCanvasRef.current) {
        screenCanvasRef.current.remove();
        screenCanvasRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
        const cameraTrack = cameraStream.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender && cameraTrack) await sender.replaceTrack(cameraTrack);
        const oldVideoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (oldVideoTrack && localStreamRef.current) localStreamRef.current.removeTrack(oldVideoTrack);
        localStreamRef.current?.addTrack(cameraTrack);
        setLocalStream(new MediaStream(localStreamRef.current?.getTracks() || []));
      } catch { /* camera not available */ }
      setIsScreenSharing(false);
      sendSignalingEventRef.current("webrtc:screenshare", { senderId: sessionId, sharing: false });
    } else {
      // === START SCREEN SHARING ===
      const isNativeAndroid =
        typeof window !== "undefined" &&
        (window as any).Capacitor?.isNativePlatform?.() &&
        (window as any).Capacitor?.getPlatform?.() === "android";

      try {
        let screenStream: MediaStream;

        if (isNativeAndroid) {
          // ──── NATIVE ANDROID: Use MediaProjection plugin ────
          const ScreenCapture = (await import("@/plugins/screen-capture")).default;

          toast({ title: "Starting Screen Capture...", description: "Approve the Android permission prompt." });

          const result = await ScreenCapture.startCapture();

          // Create an offscreen canvas to receive native frames
          const canvas = document.createElement("canvas");
          canvas.width = result.width || 720;
          canvas.height = result.height || 1280;
          canvas.style.display = "none";
          document.body.appendChild(canvas);
          screenCanvasRef.current = canvas;
          const ctx = canvas.getContext("2d")!;

          // Listen for native frames and draw them to canvas
          const listener = await ScreenCapture.addListener("frame", (data) => {
            const img = new Image();
            img.onload = () => {
              if (canvas.width !== data.width || canvas.height !== data.height) {
                canvas.width = data.width;
                canvas.height = data.height;
              }
              ctx.drawImage(img, 0, 0);
            };
            img.src = `data:image/jpeg;base64,${data.frame}`;
          });
          screenCaptureListenerRef.current = listener;

          // captureStream() creates a live MediaStream from the canvas
          screenStream = (canvas as any).captureStream(8) as MediaStream;

          toast({ title: "Screen Sharing Active", description: "Your screen is now being shared in the call." });
        } else if (navigator.mediaDevices?.getDisplayMedia) {
          // ──── DESKTOP: Use standard getDisplayMedia ────
          screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        } else {
          // ──── FALLBACK: Rear camera document share ────
          toast({
            title: "Switching to Document Share",
            description: "Using rear camera for live document/screen share on mobile.",
          });
          screenStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
          });
        }

        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender && screenTrack) await sender.replaceTrack(screenTrack);
        // Use ref so onended always calls the latest version — avoids stale closure
        screenTrack.onended = () => { toggleScreenShareRef.current(); };
        const oldVideoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (oldVideoTrack && localStreamRef.current) {
          localStreamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        localStreamRef.current?.addTrack(screenTrack);
        setLocalStream(new MediaStream(localStreamRef.current?.getTracks() || []));
        setIsScreenSharing(true);
        sendSignalingEventRef.current("webrtc:screenshare", { senderId: sessionId, sharing: true });
      } catch (err: any) {
        // Clean up if native capture started but something else failed
        if (screenCaptureListenerRef.current) {
          try {
            screenCaptureListenerRef.current.remove();
            const ScreenCapture = (await import("@/plugins/screen-capture")).default;
            await ScreenCapture.stopCapture();
          } catch { /* ignore */ }
          screenCaptureListenerRef.current = null;
        }
        if (screenCanvasRef.current) {
          screenCanvasRef.current.remove();
          screenCanvasRef.current = null;
        }
        if (err.name !== "NotAllowedError" && err.name !== "AbortError") {
          toast({
            title: "Screen Share Failed",
            description: err.message || "Could not start screen sharing.",
            variant: "destructive",
          });
        }
      }
    }
  }, [isScreenSharing, facingMode, sessionId, toast]);

  // Keep the ref pointing to the latest version
  useEffect(() => { toggleScreenShareRef.current = toggleScreenShare; }, [toggleScreenShare]);

  const upgradeToVideo = useCallback(async () => {
    if (!pcRef.current || !localStreamRef.current) return;
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      const videoTrack = videoStream.getVideoTracks()[0];
      pcRef.current.addTrack(videoTrack, localStreamRef.current);
      localStreamRef.current.addTrack(videoTrack);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      setIsAudioOnlySynced(false);
      onCallUpgraded?.();
      sendSignalingEventRef.current("webrtc:upgrade-video", { senderId: sessionId });
      // Trigger WebRTC renegotiation so remote peer sees new video track
      await handleRenegotiateOffer(pcRef.current, sendSignalingEventRef.current, sessionId);
    } catch { /* camera access denied */ }
  }, [sessionId, onCallUpgraded, setIsAudioOnlySynced]);

  const toggleBlur = useCallback(() => {
    setIsBlurred((prev) => {
      const next = !prev;
      sendSignalingEventRef.current("webrtc:state", { senderId: sessionId, key: "blurred", value: next });
      return next;
    });
  }, [sessionId]);

  const sendSurprise = useCallback((type: string) => {
    setSurpriseEffect({ type, id: Date.now() });
    sounds.surprise();
    sendSignalingEventRef.current("webrtc:surprise", { senderId: sessionId, type });
  }, [sessionId]);

  // Handle signaling events — all mutable values accessed via refs to avoid stale closures
  const handleSignalingEvent = useCallback(
    async (event: string, payload: Record<string, unknown>) => {
      const senderId = payload.senderId as string;
      if (senderId === sessionId) return;

      switch (event) {
        case "webrtc:request": {
          const reqAudioOnly = payload.audioOnly as boolean | undefined;
          if (reqAudioOnly) setIsAudioOnlySynced(true);
          setCallStatusSynced("incoming");
          break;
        }

        case "webrtc:accept": {
          // Use the payload value directly — don't rely on state which may be stale
          const accAudioOnly = !!(payload.audioOnly as boolean | undefined);
          // Sync state + ref together
          if (accAudioOnly) setIsAudioOnlySynced(true);
          const effectiveAudioOnly = isAudioOnlyRef.current || accAudioOnly;
          try {
            setCallStatusSynced("connecting");
            const stream = await getMedia("user", effectiveAudioOnly);
            const pc = createPeerConnection();
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            // Drain any early ICE candidates from callee that arrived before we had a PC
            await drainPendingCandidates(pc);
            sendSignalingEventRef.current("webrtc:offer", { senderId: sessionId, offer: pc.localDescription?.toJSON() });
          } catch (err) {
            console.error("WebRTC: webrtc:accept handler failed:", err);
            setCallStatusSynced("idle");
            cleanup();
          }
          break;
        }

        case "webrtc:decline":
          setCallStatusSynced("idle");
          cleanup();
          break;

        case "webrtc:offer": {
          let pc = pcRef.current;
          const offer = payload.offer as RTCSessionDescriptionInit;

          if (!pc) {
            try {
              setCallStatusSynced("connecting");
              const stream = await getMedia("user", isAudioOnlyRef.current);
              pc = createPeerConnection();
              stream.getTracks().forEach((track) => pc!.addTrack(track, stream));
            } catch (err) {
              console.error("WebRTC: offer setup failed:", err);
              break;
            }
          }
          if (!pc) break;

          const offerSenderId = (payload.senderId as string) || "";
          const isOfferCollision =
            pc.signalingState !== "stable" &&
            (pc.signalingState === "have-local-offer" || !!payload.renegotiation);

          // Polite peer pattern: smaller sessionId is polite
          const isPolite = sessionId.localeCompare(offerSenderId) < 0;

          if (isOfferCollision) {
            if (!isPolite) {
              console.warn(`WebRTC: Impolite peer ignoring offer collision in state "${pc.signalingState}"`);
              break;
            }
            try {
              console.log("WebRTC: Polite peer rolling back local offer to resolve collision");
              await pc.setLocalDescription({ type: "rollback" });
            } catch (err) {
              console.warn("WebRTC: Rollback error during collision:", err);
            }
          }

          try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            await drainPendingCandidates(pc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignalingEventRef.current("webrtc:answer", { senderId: sessionId, answer: pc.localDescription?.toJSON() });
          } catch (err) {
            console.error("WebRTC: Failed processing remote offer:", err);
          }
          break;
        }

        case "webrtc:answer": {
          const pc = pcRef.current;
          if (!pc) break;
          // Guard: only set remote answer if we're expecting one
          if (pc.signalingState !== "have-local-offer") {
            console.warn(`WebRTC: Ignoring duplicate webrtc:answer in state "${pc.signalingState}"`);
            break;
          }
          const answer = payload.answer as RTCSessionDescriptionInit;
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          // Drain after setRemoteDescription
          await drainPendingCandidates(pc);
          break;
        }

        case "webrtc:ice": {
          const candidate = payload.candidate as RTCIceCandidateInit;
          const pc = pcRef.current;
          if (pc?.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.warn("WebRTC: addIceCandidate failed:", err);
            }
          } else {
            // Buffer until remote description is set
            pendingCandidatesRef.current.push(candidate);
          }
          break;
        }

        case "webrtc:screenshare":
          setRemoteIsScreenSharing(payload.sharing as boolean);
          break;

        case "webrtc:state": {
          const key = payload.key as string;
          const value = payload.value as boolean;
          if (key === "muted") setRemoteMuted(value);
          else if (key === "cameraOff") setRemoteCameraOff(value);
          else if (key === "blurred") setRemoteBlurred(value);
          break;
        }

        case "webrtc:upgrade-video": {
          setIsAudioOnlySynced(false);
          onCallUpgraded?.();
          try {
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            const videoTrack = videoStream.getVideoTracks()[0];
            if (pcRef.current && localStreamRef.current) {
              pcRef.current.addTrack(videoTrack, localStreamRef.current);
              localStreamRef.current.addTrack(videoTrack);
              setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
              await handleRenegotiateOffer(pcRef.current, sendSignalingEventRef.current, sessionId);
            }
          } catch { /* camera not available */ }
          break;
        }

        case RENEGOTIATE_EVENT:
        case "webrtc:renegotiate": {
          const pc = pcRef.current;
          // Use ref to read latest callStatus — avoids stale closure
          const cs = callStatusRef.current;
          if (pc && (cs === "active" || cs === "connecting")) {
            try {
              await handleRenegotiateOffer(pc, sendSignalingEventRef.current, sessionId);
            } catch (err) {
              console.error("WebRTC: renegotiation failed:", err);
            }
          }
          break;
        }

        case "webrtc:end":
          cleanup();
          setCallStatusSynced("idle");
          onCallEnded?.();
          break;

        case "webrtc:surprise": {
          const type = payload.type as string;
          setSurpriseEffect({ type, id: Date.now() });
          sounds.surprise();
          break;
        }
      }
    },
    // Only truly stable deps — mutable values accessed via refs
    [sessionId, getMedia, createPeerConnection, cleanup, drainPendingCandidates,
     onCallEnded, onCallUpgraded, setCallStatusSynced, setIsAudioOnlySynced]
  );

  // Picture-in-Picture helper
  const togglePictureInPicture = useCallback(async (videoElement?: HTMLVideoElement | null) => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else if (videoElement && document.pictureInPictureEnabled) {
        await videoElement.requestPictureInPicture();
        setIsPiPActive(true);
        videoElement.addEventListener("leavepictureinpicture", () => {
          setIsPiPActive(false);
        }, { once: true });
      }
    } catch (e) {
      console.warn("WebRTC: PiP toggle error", e);
    }
  }, []);

  // WebRTC Stats Polling Loop
  useEffect(() => {
    if (callStatus !== "active" || !pcRef.current) return;

    let prevPacketsLost = 0;
    let prevPacketsReceived = 0;

    const interval = setInterval(async () => {
      const pc = pcRef.current;
      if (!pc) return;

      try {
        const statsReport = await pc.getStats();
        let currentRtt: number | null = null;
        let currentFps = 30;
        let currentRes = "720p";
        let lossPercentage = 0;

        statsReport.forEach((report) => {
          if (report.type === "candidate-pair" && (report.state === "succeeded" || report.nominated)) {
            if (typeof report.currentRoundTripTime === "number") {
              currentRtt = Math.round(report.currentRoundTripTime * 1000);
            }
          }
          if (report.type === "inbound-rtp" && report.kind === "video") {
            if (typeof report.framesPerSecond === "number") {
              currentFps = Math.round(report.framesPerSecond);
            }
            if (report.frameWidth && report.frameHeight) {
              const h = report.frameHeight;
              currentRes = h >= 1080 ? "1080p" : h >= 720 ? "720p" : h >= 480 ? "480p" : "360p";
            }
            const lost = report.packetsLost || 0;
            const recv = report.packetsReceived || 0;
            const deltaLost = lost - prevPacketsLost;
            const deltaRecv = recv - prevPacketsReceived;
            prevPacketsLost = lost;
            prevPacketsReceived = recv;

            const total = deltaLost + deltaRecv;
            if (total > 0) {
              lossPercentage = Math.min(100, Math.max(0, Math.round((deltaLost / total) * 100)));
            }
          }
        });

        const rttVal = currentRtt ?? 45;
        const grade: "good" | "fair" | "poor" = (lossPercentage > 15 || rttVal > 300) ? "poor" : (lossPercentage > 5 || rttVal > 150) ? "fair" : "good";

        setStats({
          rtt: currentRtt,
          resolution: currentRes,
          fps: currentFps,
          packetLoss: lossPercentage,
          qualityGrade: grade,
          isDegraded: grade === "poor",
        });
      } catch (err) {
        // Silently handle stat errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [callStatus]);

  // 15-second safety timer for "connecting" or "requesting" status
  useEffect(() => {
    if (callStatus !== "connecting" && callStatus !== "requesting") return;

    const timeout = setTimeout(() => {
      if (callStatusRef.current === "connecting" || callStatusRef.current === "requesting") {
        console.warn("WebRTC: Connection timed out after 15s — resetting to idle");
        sendSignalingEventRef.current("webrtc:end", { senderId: sessionId });
        cleanup();
        setCallStatusSynced("idle");
        toast({
          variant: "destructive",
          title: "Call Connection Timed Out",
          description: "Could not establish media connection. Please try calling again.",
        });
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [callStatus, cleanup, setCallStatusSynced, sessionId, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pcRef.current) pcRef.current.close();
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return {
    callStatus,
    isAudioOnly,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    remoteIsScreenSharing,
    isBlurred,
    isReconnecting,
    facingMode,
    remoteMuted,
    remoteCameraOff,
    remoteBlurred,
    stats,
    audioOutput,
    toggleAudioOutput,
    isPiPActive,
    togglePictureInPicture,
    supportsPiP: typeof document !== "undefined" && !!document.pictureInPictureEnabled,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
    flipCamera,
    toggleScreenShare,
    toggleBlur,
    upgradeToVideo,
    sendSurprise,
    surpriseEffect,
    handleSignalingEvent,
    cleanup,
    supportsScreenShare,
  };
}
