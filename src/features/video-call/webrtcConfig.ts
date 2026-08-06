export type VideoCallStatus = "idle" | "requesting" | "incoming" | "connecting" | "active";

export interface WebRTCStats {
  rtt: number | null;
  resolution: string;
  fps: number;
  packetLoss: number;
  qualityGrade: "good" | "fair" | "poor";
  isDegraded: boolean;
}

export const getIceServers = (): RTCConfiguration => {
  const turnServers: RTCIceServer[] = [
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
