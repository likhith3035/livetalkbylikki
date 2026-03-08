import { useState, useRef, useCallback, useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type VideoCallStatus = "idle" | "requesting" | "incoming" | "connecting" | "active";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

interface UseVideoCallOptions {
  sessionId: string;
  channel: RealtimeChannel | null;
  onCallEnded?: () => void;
  onCallUpgraded?: () => void;
}

export function useVideoCall({ sessionId, channel, onCallEnded, onCallUpgraded }: UseVideoCallOptions) {
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

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const channelRef = useRef(channel);

  useEffect(() => {
    channelRef.current = channel;
  }, [channel]);

  const cleanup = useCallback(() => {
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
    setIsAudioOnly(false);
    setFacingMode("user");
    setRemoteMuted(false);
    setRemoteCameraOff(false);
    setRemoteBlurred(false);
    pendingCandidatesRef.current = [];
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    const remote = new MediaStream();
    setRemoteStream(remote);

    pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach((track) => remote.addTrack(track));
      setRemoteStream(new MediaStream(remote.getTracks()));
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "webrtc:ice",
          payload: { senderId: sessionId, candidate: e.candidate.toJSON() },
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setCallStatus("active");
      }
      if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "closed") {
        endCall();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [sessionId]);

  const getMedia = useCallback(async (facing: "user" | "environment" = "user", audioOnly = false) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: audioOnly ? false : { facingMode: facing },
      audio: true,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const startCall = useCallback(async (audioOnly = false) => {
    if (!channelRef.current) return;
    setCallStatus("requesting");
    setIsAudioOnly(audioOnly);
    channelRef.current.send({
      type: "broadcast",
      event: "webrtc:request",
      payload: { senderId: sessionId, audioOnly },
    });
  }, [sessionId]);

  const acceptCall = useCallback(async () => {
    if (!channelRef.current) return;
    try {
      setCallStatus("connecting");
      const stream = await getMedia("user", isAudioOnly);
      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      for (const c of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      pendingCandidatesRef.current = [];

      channelRef.current.send({
        type: "broadcast",
        event: "webrtc:accept",
        payload: { senderId: sessionId, audioOnly: isAudioOnly },
      });
    } catch {
      setCallStatus("idle");
      cleanup();
    }
  }, [sessionId, isAudioOnly, getMedia, createPeerConnection, cleanup]);

  const declineCall = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "webrtc:decline",
        payload: { senderId: sessionId },
      });
    }
    setCallStatus("idle");
  }, [sessionId]);

  const endCall = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "webrtc:end",
        payload: { senderId: sessionId },
      });
    }
    cleanup();
    setCallStatus("idle");
    onCallEnded?.();
  }, [sessionId, cleanup, onCallEnded]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const muted = !audioTrack.enabled;
        setIsMuted(muted);
        channelRef.current?.send({
          type: "broadcast",
          event: "webrtc:state",
          payload: { senderId: sessionId, key: "muted", value: muted },
        });
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
        channelRef.current?.send({
          type: "broadcast",
          event: "webrtc:state",
          payload: { senderId: sessionId, key: "cameraOff", value: off },
        });
      }
    }
  }, [sessionId]);

  // Flip camera (front/back)
  const flipCamera = useCallback(async () => {
    if (!localStreamRef.current || !pcRef.current) return;
    const newFacing = facingMode === "user" ? "environment" : "user";
    try {
      // Stop old video track
      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      oldVideoTrack?.stop();

      // Get new stream with flipped camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing },
        audio: false,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];

      // Replace track in peer connection
      const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
      if (sender && newVideoTrack) {
        await sender.replaceTrack(newVideoTrack);
      }

      // Update local stream
      if (oldVideoTrack) {
        localStreamRef.current.removeTrack(oldVideoTrack);
      }
      localStreamRef.current.addTrack(newVideoTrack);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      setFacingMode(newFacing);
    } catch {
      // Camera flip not supported
    }
  }, [facingMode]);

  // Screen sharing
  const toggleScreenShare = useCallback(async () => {
    if (!pcRef.current) return;

    if (isScreenSharing) {
      // Stop screen sharing, restore camera
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      const cameraTrack = cameraStream.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
      if (sender && cameraTrack) {
        await sender.replaceTrack(cameraTrack);
      }
      // Update local stream
      const oldVideoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (oldVideoTrack && localStreamRef.current) {
        localStreamRef.current.removeTrack(oldVideoTrack);
      }
      localStreamRef.current?.addTrack(cameraTrack);
      setLocalStream(new MediaStream(localStreamRef.current?.getTracks() || []));
      setIsScreenSharing(false);
      // Notify remote
      channelRef.current?.send({
        type: "broadcast",
        event: "webrtc:screenshare",
        payload: { senderId: sessionId, sharing: false },
      });
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender && screenTrack) {
          await sender.replaceTrack(screenTrack);
        }

        // When user stops sharing via browser UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        // Update local stream for preview
        const oldVideoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (oldVideoTrack && localStreamRef.current) {
          localStreamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        localStreamRef.current?.addTrack(screenTrack);
        setLocalStream(new MediaStream(localStreamRef.current?.getTracks() || []));
        setIsScreenSharing(true);
        // Notify remote
        channelRef.current?.send({
          type: "broadcast",
          event: "webrtc:screenshare",
          payload: { senderId: sessionId, sharing: true },
        });
      } catch {
        // User cancelled screen share picker
      }
    }
  }, [isScreenSharing, facingMode]);

  // Upgrade audio call to video
  const upgradeToVideo = useCallback(async () => {
    if (!pcRef.current || !localStreamRef.current) return;
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      const videoTrack = videoStream.getVideoTracks()[0];
      // Add video track to peer connection
      pcRef.current.addTrack(videoTrack, localStreamRef.current);
      localStreamRef.current.addTrack(videoTrack);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      setIsAudioOnly(false);
      onCallUpgraded?.();
      channelRef.current?.send({
        type: "broadcast",
        event: "webrtc:upgrade-video",
        payload: { senderId: sessionId },
      });
    } catch {
      // Camera access denied
    }
  }, [sessionId]);

  // Background blur toggle
  const toggleBlur = useCallback(() => {
    setIsBlurred((prev) => {
      const next = !prev;
      channelRef.current?.send({
        type: "broadcast",
        event: "webrtc:state",
        payload: { senderId: sessionId, key: "blurred", value: next },
      });
      return next;
    });
  }, [sessionId]);

  // Handle signaling events
  const handleSignalingEvent = useCallback(
    async (event: string, payload: Record<string, unknown>) => {
      const senderId = payload.senderId as string;
      if (senderId === sessionId) return;

      switch (event) {
        case "webrtc:request": {
          const reqAudioOnly = payload.audioOnly as boolean | undefined;
          if (reqAudioOnly) setIsAudioOnly(true);
          setCallStatus("incoming");
          break;
        }

        case "webrtc:accept": {
          const accAudioOnly = payload.audioOnly as boolean | undefined;
          if (accAudioOnly) setIsAudioOnly(true);
          try {
            setCallStatus("connecting");
            const stream = await getMedia("user", isAudioOnly || !!accAudioOnly);
            const pc = createPeerConnection();
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            channelRef.current?.send({
              type: "broadcast",
              event: "webrtc:offer",
              payload: { senderId: sessionId, offer: pc.localDescription?.toJSON() },
            });
          } catch {
            setCallStatus("idle");
            cleanup();
          }
          break;
        }

        case "webrtc:decline":
          setCallStatus("idle");
          cleanup();
          break;

        case "webrtc:offer": {
          const pc = pcRef.current;
          if (!pc) break;
          const offer = payload.offer as RTCSessionDescriptionInit;
          await pc.setRemoteDescription(new RTCSessionDescription(offer));

          for (const c of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidatesRef.current = [];

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          channelRef.current?.send({
            type: "broadcast",
            event: "webrtc:answer",
            payload: { senderId: sessionId, answer: pc.localDescription?.toJSON() },
          });
          break;
        }

        case "webrtc:answer": {
          const pc = pcRef.current;
          if (!pc) break;
          const answer = payload.answer as RTCSessionDescriptionInit;
          await pc.setRemoteDescription(new RTCSessionDescription(answer));

          for (const c of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidatesRef.current = [];
          break;
        }

        case "webrtc:ice": {
          const candidate = payload.candidate as RTCIceCandidateInit;
          const pc = pcRef.current;
          if (pc?.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            pendingCandidatesRef.current.push(candidate);
          }
          break;
        }

        case "webrtc:screenshare": {
          const sharing = payload.sharing as boolean;
          setRemoteIsScreenSharing(sharing);
          break;
        }

        case "webrtc:state": {
          const key = payload.key as string;
          const value = payload.value as boolean;
          if (key === "muted") setRemoteMuted(value);
          else if (key === "cameraOff") setRemoteCameraOff(value);
          else if (key === "blurred") setRemoteBlurred(value);
          break;
        }

        case "webrtc:upgrade-video": {
          // Remote upgraded to video — add local video track too
          setIsAudioOnly(false);
          try {
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            const videoTrack = videoStream.getVideoTracks()[0];
            if (pcRef.current && localStreamRef.current) {
              pcRef.current.addTrack(videoTrack, localStreamRef.current);
              localStreamRef.current.addTrack(videoTrack);
              setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
            }
          } catch {
            // Camera not available on remote side
          }
          break;
        }

        case "webrtc:end":
          cleanup();
          setCallStatus("idle");
          onCallEnded?.();
          break;
      }
    },
    [sessionId, getMedia, createPeerConnection, cleanup, onCallEnded]
  );

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
    facingMode,
    remoteMuted,
    remoteCameraOff,
    remoteBlurred,
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
    handleSignalingEvent,
    cleanup,
  };
}
