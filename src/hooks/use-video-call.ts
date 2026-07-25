import { useState, useRef, useCallback, useEffect } from "react";
import { sounds } from "@/lib/sounds";
import { RENEGOTIATE_EVENT, handleRenegotiateOffer } from "@/features/cross-device-sync/webrtcRenegotiation";

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
    // Cloudflare TURN — free, no account needed
    {
      urls: "turn:turn.cloudflare.com:3478",
      username: "free",
      credential: "free",
    },
    {
      urls: "turn:turn.cloudflare.com:3478?transport=tcp",
      username: "free",
      credential: "free",
    },
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
      console.log("WebRTC: Received remote track", e.track.kind);
      // Add tracks to the existing stream instead of creating a new one each time
      e.streams[0]?.getTracks().forEach((track) => {
        if (!remote.getTrackById(track.id)) {
          remote.addTrack(track);
        }
      });
      // Force a React re-render by updating state with same object reference trick
      setRemoteStream((prev) => {
        if (prev === remote) {
          // Create a shallow copy to trigger re-render while preserving tracks
          return new MediaStream(remote.getTracks());
        }
        return remote;
      });
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
    } catch (err) {
      console.error("WebRTC: acceptCall failed:", err);
      setCallStatusSynced("idle");
      cleanup();
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
      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      oldVideoTrack?.stop();
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing },
        audio: false,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
      if (sender && newVideoTrack) await sender.replaceTrack(newVideoTrack);
      if (oldVideoTrack) localStreamRef.current.removeTrack(oldVideoTrack);
      localStreamRef.current.addTrack(newVideoTrack);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      setFacingMode(newFacing);
    } catch {
      // Camera flip not supported on this device
    }
  }, [facingMode]);

  const toggleScreenShare = useCallback(async () => {
    if (!pcRef.current) return;

    if (isScreenSharing) {
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
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
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
      } catch { /* user cancelled */ }
    }
  }, [isScreenSharing, facingMode, sessionId]);

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
          const isRenegotiation = !!payload.renegotiation;

          if (!pc && isRenegotiation) {
            try {
              setCallStatusSynced("connecting");
              const stream = await getMedia("user", isAudioOnlyRef.current);
              pc = createPeerConnection();
              stream.getTracks().forEach((track) => pc!.addTrack(track, stream));
            } catch (err) {
              console.error("WebRTC: renegotiation setup failed:", err);
              break;
            }
          }
          if (!pc) break;

          // Guard: only process offer if we're in a state that can receive one.
          // "stable" with a local description means we're the offer side (caller) — skip.
          // "have-remote-offer" means we already processed this offer — skip duplicate.
          const sigState = pc.signalingState;
          if (sigState === "have-local-offer" || sigState === "have-remote-offer") {
            console.warn(`WebRTC: Ignoring duplicate webrtc:offer in state "${sigState}"`);
            break;
          }

          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          // Now safe to drain buffered ICE candidates
          await drainPendingCandidates(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignalingEventRef.current("webrtc:answer", { senderId: sessionId, answer: pc.localDescription?.toJSON() });
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
