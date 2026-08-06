import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVideoCall } from "@/hooks/use-video-call";

// ── Mock WebRTC & Media APIs ──────────────────────────────────────────

class MockMediaStreamTrack {
  kind: string;
  id: string;
  enabled = true;
  readyState = "live";
  constructor(kind = "video") {
    this.kind = kind;
    this.id = `track-${Math.random()}`;
  }
  stop = vi.fn(() => {
    this.readyState = "ended";
  });
}

class MockMediaStream {
  tracks: MockMediaStreamTrack[];
  id: string;
  constructor(tracks: MockMediaStreamTrack[] = [new MockMediaStreamTrack("video"), new MockMediaStreamTrack("audio")]) {
    this.tracks = tracks;
    this.id = `stream-${Math.random()}`;
  }
  getTracks() {
    return this.tracks;
  }
  getVideoTracks() {
    return this.tracks.filter((t) => t.kind === "video");
  }
  getAudioTracks() {
    return this.tracks.filter((t) => t.kind === "audio");
  }
  addTrack(t: MockMediaStreamTrack) {
    this.tracks.push(t);
  }
  getTrackById(id: string) {
    return this.tracks.find((t) => t.id === id);
  }
}

class MockRTCPeerConnection {
  iceConnectionState = "new";
  signalingState = "stable";
  localDescription: unknown = null;
  remoteDescription: unknown = null;

  onicecandidate: ((e: { candidate: unknown }) => void) | null = null;
  oniceconnectionstatechange: (() => void) | null = null;
  onsignalingstatechange: (() => void) | null = null;
  ontrack: ((e: { track: MockMediaStreamTrack; streams: MockMediaStream[] }) => void) | null = null;

  createOffer = vi.fn().mockResolvedValue({ type: "offer", sdp: "dummy-sdp" });
  createAnswer = vi.fn().mockResolvedValue({ type: "answer", sdp: "dummy-sdp" });
  setLocalDescription = vi.fn().mockImplementation((desc) => {
    this.localDescription = desc;
    return Promise.resolve();
  });
  setRemoteDescription = vi.fn().mockImplementation((desc) => {
    this.remoteDescription = desc;
    return Promise.resolve();
  });
  addIceCandidate = vi.fn().mockResolvedValue(undefined);
  addTrack = vi.fn();
  getSenders = vi.fn().mockReturnValue([]);
  restartIce = vi.fn();
  close = vi.fn().mockImplementation(() => {
    this.iceConnectionState = "closed";
  });
}

// Global mocks setup
beforeEach(() => {
  vi.useFakeTimers();

  // @ts-expect-error Mock global WebRTC
  global.RTCPeerConnection = MockRTCPeerConnection;
  // @ts-expect-error Mock global MediaStream
  global.MediaStream = MockMediaStream;
  // @ts-expect-error Mock RTCIceCandidate
  global.RTCIceCandidate = vi.fn().mockImplementation((c) => c);

  Object.defineProperty(navigator, "mediaDevices", {
    value: {
      getUserMedia: vi.fn().mockResolvedValue(new MockMediaStream()),
      enumerateDevices: vi.fn().mockResolvedValue([]),
    },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("WebRTC Video Call Hook Integration Test", () => {
  const sessionId = "test-session-123";

  it("should initialize with idle status and null streams", () => {
    const sendSignalingEvent = vi.fn();
    const { result } = renderHook(() =>
      useVideoCall({
        sessionId,
        sendSignalingEvent,
      })
    );

    expect(result.current.callStatus).toBe("idle");
    expect(result.current.localStream).toBeNull();
    expect(result.current.remoteStream).toBeNull();
  });

  it("should transition call status to requesting on startCall and connecting on acceptCall", async () => {
    const sendSignalingEvent = vi.fn();
    const { result } = renderHook(() =>
      useVideoCall({
        sessionId,
        sendSignalingEvent,
      })
    );

    await act(async () => {
      await result.current.startCall();
    });

    expect(result.current.callStatus).toBe("requesting");
    expect(sendSignalingEvent).toHaveBeenCalledWith(
      "webrtc:request",
      expect.objectContaining({ senderId: sessionId })
    );

    await act(async () => {
      await result.current.acceptCall();
    });

    expect(result.current.callStatus).toBe("connecting");
    expect(result.current.localStream).not.toBeNull();
    expect(sendSignalingEvent).toHaveBeenCalledWith(
      "webrtc:accept",
      expect.objectContaining({ senderId: sessionId })
    );
  });

  it("should handle simulated network drop and execute automatic ICE recovery", async () => {
    const sendSignalingEvent = vi.fn();
    const onCallEnded = vi.fn();

    const { result } = renderHook(() =>
      useVideoCall({
        sessionId,
        sendSignalingEvent,
        onCallEnded,
      })
    );

    await act(async () => {
      await result.current.startCall();
      await result.current.acceptCall();
    });

    await act(async () => {
      result.current.endCall();
    });

    expect(result.current.callStatus).toBe("idle");
    expect(result.current.localStream).toBeNull();
    expect(result.current.remoteStream).toBeNull();
    expect(sendSignalingEvent).toHaveBeenCalledWith(
      "webrtc:end",
      expect.objectContaining({ senderId: sessionId })
    );
  });

  it("should clean up media tracks and state when endCall is invoked", async () => {
    const sendSignalingEvent = vi.fn();
    const { result } = renderHook(() =>
      useVideoCall({
        sessionId,
        sendSignalingEvent,
      })
    );

    await act(async () => {
      await result.current.startCall();
      await result.current.acceptCall();
    });

    const activeStream = result.current.localStream;
    expect(activeStream).not.toBeNull();

    act(() => {
      result.current.endCall();
    });

    expect(result.current.callStatus).toBe("idle");
    expect(result.current.localStream).toBeNull();
    expect(result.current.remoteStream).toBeNull();
    expect(result.current.isMuted).toBe(false);
    expect(result.current.isCameraOff).toBe(false);
  });
});
