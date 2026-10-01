import { db } from "@/lib/firebase";
import { ref, set, onValue, off, remove, push, update } from "firebase/database";
import { sanitizeFirebasePayload } from "./gameRoomService";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export interface GameVideoDuelCallbacks {
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream | null) => void;
  onStatusChange?: (status: "idle" | "requesting" | "connected" | "failed") => void;
}

export interface GameVoiceDuelCallbacks {
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream | null) => void;
  onStatusChange?: (status: "idle" | "connecting" | "connected" | "failed" | "listen-only") => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  onMicAvailabilityChange?: (available: boolean) => void;
}

export class GameWebRTCService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private roomCode: string = "";
  private isHost: boolean = false;
  private unsubListeners: (() => void)[] = [];

  // Voice Chat (Audio-Only Push-To-Talk) State
  private voicePc: RTCPeerConnection | null = null;
  private voiceLocalStream: MediaStream | null = null;
  private voiceRemoteStream: MediaStream | null = null;
  private voiceRoomCode: string = "";
  private voiceIsHost: boolean = false;
  private voiceUnsubs: (() => void)[] = [];
  private isMicOn: boolean = false;

  public async startVideoDuel(
    roomCode: string,
    isHost: boolean,
    callbacks: GameVideoDuelCallbacks
  ): Promise<MediaStream> {
    this.stopVideoDuel();
    this.roomCode = roomCode.toUpperCase();
    this.isHost = isHost;

    callbacks.onStatusChange?.("requesting");

    // 1. Get user media (camera & audio, with graceful fallback if mic is missing)
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: "user" },
        audio: true,
      });
    } catch (mediaErr: any) {
      if (
        mediaErr?.name === "NotFoundError" ||
        mediaErr?.name === "DevicesNotFoundError"
      ) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: "user" },
          audio: false,
        });
      } else {
        throw mediaErr;
      }
    }
    this.localStream = stream;
    callbacks.onLocalStream?.(stream);

    // If offline or no database, return local camera stream immediately
    if (!db) {
      callbacks.onStatusChange?.("connected");
      return stream;
    }

    // 2. Setup RTCPeerConnection
    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.pc = pc;

    // Add local tracks
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // Handle remote tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        callbacks.onRemoteStream?.(event.streams[0]);
        callbacks.onStatusChange?.("connected");
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        callbacks.onStatusChange?.("connected");
      } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        callbacks.onStatusChange?.("failed");
      }
    };

    const webrtcPath = `rooms/game_${this.roomCode}/webrtc`;

    // 3. Handle ICE Candidates exchange
    const myCandidateRole = isHost ? "host" : "guest";
    const peerCandidateRole = isHost ? "guest" : "host";

    pc.onicecandidate = (event) => {
      if (event.candidate && db) {
        const cRef = push(ref(db, `${webrtcPath}/candidates/${myCandidateRole}`));
        set(cRef, sanitizeFirebasePayload(event.candidate.toJSON())).catch(() => {});
      }
    };

    // Listen to peer's ICE candidates
    const peerCandidatesRef = ref(db, `${webrtcPath}/candidates/${peerCandidateRole}`);
    const candidateHandler = (snap: any) => {
      if (snap.exists()) {
        const data = snap.val();
        Object.values(data).forEach((cand: any) => {
          try {
            if (cand && pc.remoteDescription) {
              pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
            }
          } catch {}
        });
      }
    };
    onValue(peerCandidatesRef, candidateHandler);
    this.unsubListeners.push(() => off(peerCandidatesRef, "value", candidateHandler));

    // 4. Signaling (Offer/Answer)
    if (isHost) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await update(ref(db, webrtcPath), sanitizeFirebasePayload({
        offer: { type: offer.type, sdp: offer.sdp },
        hostActive: true,
      })).catch(() => {});

      const answerRef = ref(db, `${webrtcPath}/answer`);
      const answerHandler = async (snap: any) => {
        if (snap.exists() && pc.signalingState === "have-local-offer") {
          const ans = snap.val();
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(ans));
          } catch (e) {
            console.warn("Error setting remote answer:", e);
          }
        }
      };
      onValue(answerRef, answerHandler);
      this.unsubListeners.push(() => off(answerRef, "value", answerHandler));
    } else {
      const offerRef = ref(db, `${webrtcPath}/offer`);
      const offerHandler = async (snap: any) => {
        if (snap.exists() && pc.signalingState === "stable") {
          const offData = snap.val();
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(offData));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await update(ref(db, webrtcPath), sanitizeFirebasePayload({
              answer: { type: answer.type, sdp: answer.sdp },
              guestActive: true,
            })).catch(() => {});
          } catch (e) {
            console.warn("Error handling remote offer:", e);
          }
        }
      };
      onValue(offerRef, offerHandler);
      this.unsubListeners.push(() => off(offerRef, "value", offerHandler));
    }

    return stream;
  }

  // ── Push-To-Talk / In-Game Voice Duel ──

  public async startVoiceDuel(
    roomCode: string,
    isHost: boolean,
    callbacks: GameVoiceDuelCallbacks
  ): Promise<MediaStream | null> {
    this.stopVoiceDuel();
    this.voiceRoomCode = roomCode.toUpperCase();
    this.voiceIsHost = isHost;

    callbacks.onStatusChange?.("connecting");

    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        callbacks.onStatusChange?.("failed");
        return null;
      }

      // 1. Audio stream with echo cancellation & noise suppression
      let stream: MediaStream | null = null;
      let micAvailable = false;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        micAvailable = true;
      } catch (mediaErr: any) {
        const errorName = mediaErr?.name || "";
        if (errorName === "OverconstrainedError") {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });
            micAvailable = true;
          } catch {
            micAvailable = false;
          }
        }

        if (!micAvailable) {
          if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
            console.info("Voice Duel: No audio input hardware found on device. Operating in listen-only mode.");
          } else if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
            console.info("Voice Duel: Microphone access permission not granted. Operating in listen-only mode.");
          } else {
            console.info(`Voice Duel: Microphone unavailable (${mediaErr?.message || errorName}). Operating in listen-only mode.`);
          }
        }
      }

      callbacks.onMicAvailabilityChange?.(micAvailable);

      if (stream) {
        // Default to muted (push-to-talk ready)
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false;
          this.isMicOn = false;
        }
        this.voiceLocalStream = stream;
        callbacks.onLocalStream?.(stream);
      } else {
        this.voiceLocalStream = null;
        this.isMicOn = false;
      }

      if (!db || typeof RTCPeerConnection === "undefined") {
        callbacks.onStatusChange?.(micAvailable ? "connected" : "listen-only");
        return stream;
      }

      // 2. Setup Audio RTCPeerConnection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      this.voicePc = pc;

      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream!));
      } else {
        // Graceful listen-only mode: add receive-only transceiver so SDP includes audio negotiation
        try {
          pc.addTransceiver("audio", { direction: "recvonly" });
        } catch {
          // Transceiver fallback
        }
      }

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          this.voiceRemoteStream = event.streams[0];
          callbacks.onRemoteStream?.(event.streams[0]);
          callbacks.onStatusChange?.(micAvailable ? "connected" : "listen-only");
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          callbacks.onStatusChange?.(micAvailable ? "connected" : "listen-only");
        } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          callbacks.onStatusChange?.("failed");
        }
      };

      const voicePath = `rooms/game_${this.voiceRoomCode}/voice`;
      const myRole = isHost ? "host" : "guest";
      const peerRole = isHost ? "guest" : "host";

      // 3. ICE Exchange
      pc.onicecandidate = (event) => {
        if (event.candidate && db) {
          const cRef = push(ref(db, `${voicePath}/candidates/${myRole}`));
          set(cRef, sanitizeFirebasePayload(event.candidate.toJSON())).catch(() => {});
        }
      };

      const peerCandidatesRef = ref(db, `${voicePath}/candidates/${peerRole}`);
      const candHandler = (snap: any) => {
        if (snap.exists()) {
          const data = snap.val();
          Object.values(data).forEach((cand: any) => {
            try {
              if (cand && pc.remoteDescription) {
                pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
              }
            } catch {}
          });
        }
      };
      onValue(peerCandidatesRef, candHandler);
      this.voiceUnsubs.push(() => off(peerCandidatesRef, "value", candHandler));

      // 4. Signaling
      if (isHost) {
        const offer = await pc.createOffer(
          !micAvailable ? { offerToReceiveAudio: true } : undefined
        );
        await pc.setLocalDescription(offer);

        await update(ref(db, voicePath), sanitizeFirebasePayload({
          offer: { type: offer.type, sdp: offer.sdp },
          hostActive: true,
        })).catch(() => {});

        const ansRef = ref(db, `${voicePath}/answer`);
        const ansHandler = async (snap: any) => {
          if (snap.exists() && pc.signalingState === "have-local-offer") {
            const ans = snap.val();
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(ans));
            } catch (e) {
              console.warn("Voice answer error:", e);
            }
          }
        };
        onValue(ansRef, ansHandler);
        this.voiceUnsubs.push(() => off(ansRef, "value", ansHandler));
      } else {
        const offRef = ref(db, `${voicePath}/offer`);
        const offHandler = async (snap: any) => {
          if (snap.exists() && pc.signalingState === "stable") {
            const offData = snap.val();
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(offData));
              const answer = await pc.createAnswer(
                !micAvailable ? { offerToReceiveAudio: true } : undefined
              );
              await pc.setLocalDescription(answer);

              await update(ref(db, voicePath), sanitizeFirebasePayload({
                answer: { type: answer.type, sdp: answer.sdp },
                guestActive: true,
              })).catch(() => {});
            } catch (e) {
              console.warn("Voice offer error:", e);
            }
          }
        };
        onValue(offRef, offHandler);
        this.voiceUnsubs.push(() => off(offRef, "value", offHandler));
      }

      return stream;
    } catch (err) {
      console.warn("Voice Duel initialization error:", err);
      callbacks.onStatusChange?.("failed");
      return null;
    }
  }

  /** Set mic enabled/disabled for Push-To-Talk or Open Mic */
  public setMicEnabled(enabled: boolean): boolean {
    if (!this.voiceLocalStream) return false;
    const track = this.voiceLocalStream.getAudioTracks()[0];
    if (track) {
      track.enabled = enabled;
      this.isMicOn = enabled;
      return this.isMicOn;
    }
    return false;
  }

  public isMicActive(): boolean {
    return this.isMicOn;
  }

  public isMicAvailable(): boolean {
    return !!this.voiceLocalStream && this.voiceLocalStream.getAudioTracks().length > 0;
  }

  public stopVoiceDuel() {
    this.voiceUnsubs.forEach((unsub) => unsub());
    this.voiceUnsubs = [];

    if (this.voiceLocalStream) {
      this.voiceLocalStream.getTracks().forEach((track) => track.stop());
      this.voiceLocalStream = null;
    }
    this.voiceRemoteStream = null;
    this.isMicOn = false;

    if (this.voicePc) {
      this.voicePc.close();
      this.voicePc = null;
    }

    if (this.voiceIsHost && this.voiceRoomCode && db) {
      remove(ref(db, `rooms/game_${this.voiceRoomCode}/voice`)).catch(() => {});
    }
  }

  public toggleMic(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  public toggleCamera(): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  public stopVideoDuel() {
    this.unsubListeners.forEach((unsub) => unsub());
    this.unsubListeners = [];

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    this.remoteStream = null;

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    if (this.isHost && this.roomCode && db) {
      remove(ref(db, `rooms/game_${this.roomCode}/webrtc`)).catch(() => {});
    }
  }
}

export const gameWebRTC = new GameWebRTCService();

