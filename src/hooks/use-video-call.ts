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
}

export function useVideoCall({ sessionId, channel, onCallEnded }: UseVideoCallOptions) {
  const [callStatus, setCallStatus] = useState<VideoCallStatus>("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
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
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
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

  const getMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const startCall = useCallback(async () => {
    if (!channelRef.current) return;
    setCallStatus("requesting");

    channelRef.current.send({
      type: "broadcast",
      event: "webrtc:request",
      payload: { senderId: sessionId },
    });
  }, [sessionId]);

  const acceptCall = useCallback(async () => {
    if (!channelRef.current) return;

    try {
      setCallStatus("connecting");
      const stream = await getMedia();
      const pc = createPeerConnection();

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Process any queued candidates
      for (const c of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      pendingCandidatesRef.current = [];

      channelRef.current.send({
        type: "broadcast",
        event: "webrtc:accept",
        payload: { senderId: sessionId },
      });
    } catch {
      setCallStatus("idle");
      cleanup();
    }
  }, [sessionId, getMedia, createPeerConnection, cleanup]);

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
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  }, []);

  // Handle signaling events
  const handleSignalingEvent = useCallback(
    async (event: string, payload: Record<string, unknown>) => {
      const senderId = payload.senderId as string;
      if (senderId === sessionId) return;

      switch (event) {
        case "webrtc:request":
          setCallStatus("incoming");
          break;

        case "webrtc:accept":
          try {
            setCallStatus("connecting");
            const stream = await getMedia();
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
    };
  }, []);

  return {
    callStatus,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
    handleSignalingEvent,
    cleanup,
  };
}
