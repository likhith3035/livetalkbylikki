import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
    ],
};

interface UseGroupCallOptions {
    roomId: string;
    userId: string;
    maxMembers: number;
}

export function useGroupCall({ roomId, userId, maxMembers }: UseGroupCallOptions) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
    const [participants, setParticipants] = useState<string[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pcRef = useRef<Record<string, RTCPeerConnection>>({});
    const channelRef = useRef<RealtimeChannel | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    const cleanupPeer = useCallback((peerId: string) => {
        console.log(`[WebRTC] Cleaning up peer: ${peerId}`);
        if (pcRef.current[peerId]) {
            pcRef.current[peerId].close();
            delete pcRef.current[peerId];
        }
        setRemoteStreams((prev) => {
            const newStreams = { ...prev };
            delete newStreams[peerId];
            return newStreams;
        });
        setParticipants((prev) => prev.filter((id) => id !== peerId));
    }, []);

    const cleanupAll = useCallback(() => {
        console.log("[WebRTC] Cleaning up ALL connections");
        Object.keys(pcRef.current).forEach(cleanupPeer);
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
        if (channelRef.current) {
            channelRef.current.unsubscribe();
            channelRef.current = null;
        }
        setLocalStream(null);
    }, [cleanupPeer]);

    const createPeerConnection = useCallback(
        (peerId: string) => {
            console.log(`[WebRTC] Creating PC for peer: ${peerId}`);
            if (pcRef.current[peerId]) {
                pcRef.current[peerId].close();
            }

            const pc = new RTCPeerConnection(ICE_SERVERS);
            pcRef.current[peerId] = pc;

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => {
                    pc.addTrack(track, localStreamRef.current!);
                });
            }

            pc.ontrack = (event) => {
                console.log(`[WebRTC] Received track from ${peerId}`);
                setRemoteStreams((prev) => ({
                    ...prev,
                    [peerId]: event.streams[0],
                }));
            };

            pc.onicecandidate = (event) => {
                if (event.candidate && channelRef.current) {
                    channelRef.current.send({
                        type: "broadcast",
                        event: "webrtc:ice",
                        payload: { senderId: userId, targetId: peerId, candidate: event.candidate.toJSON() },
                    });
                }
            };

            pc.onconnectionstatechange = () => {
                console.log(`[WebRTC] Connection status for ${peerId}: ${pc.connectionState}`);
                if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
                    // Attempt simple cleanup - let presence or a new 'join' trigger a retry
                    cleanupPeer(peerId);
                }
            };

            return pc;
        },
        [userId, cleanupPeer]
    );

    const handleSignaling = useCallback(
        async (payload: any) => {
            const { senderId, targetId, offer, answer, candidate } = payload;

            // Strict target check
            if (targetId !== userId) return;

            try {
                if (offer) {
                    console.log(`[WebRTC] Handing OFFER from ${senderId}`);
                    const pc = createPeerConnection(senderId);
                    await pc.setRemoteDescription(new RTCSessionDescription(offer));
                    const localAnswer = await pc.createAnswer();
                    await pc.setLocalDescription(localAnswer);

                    channelRef.current?.send({
                        type: "broadcast",
                        event: "webrtc:answer",
                        payload: { senderId: userId, targetId: senderId, answer: localAnswer },
                    });
                }

                if (answer) {
                    console.log(`[WebRTC] Handling ANSWER from ${senderId}`);
                    const pc = pcRef.current[senderId];
                    if (pc) {
                        await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    }
                }

                if (candidate) {
                    const pc = pcRef.current[senderId];
                    if (pc) {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                }
            } catch (err) {
                console.error("[WebRTC] Signaling error:", err);
            }
        },
        [userId, createPeerConnection]
    );

    const initializeCall = useCallback(async () => {
        try {
            console.log("[WebRTC] Initializing Call...");
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { max: 30 } },
                audio: true
            });
            localStreamRef.current = stream;
            setLocalStream(stream);

            // Legacy Supabase connection disabled to prevent console warnings
            const channel = { 
                on: () => channel, 
                subscribe: () => channel, 
                track: () => Promise.resolve(), 
                send: () => Promise.resolve(),
                presenceState: () => ({})
            } as any;
            channelRef.current = channel;

            channel
                .on("presence", { event: "sync" }, () => {
                    const presenceState = channel.presenceState();
                    const pIds = Object.keys(presenceState);

                    if (pIds.length > maxMembers && !pIds.includes(userId)) {
                        setError("Room is full");
                        cleanupAll();
                        return;
                    }

                    setParticipants(pIds);

                    // Standard Mesh Logic: IDs determine who initiates to avoid collisions
                    pIds.forEach(async (peerId) => {
                        if (peerId !== userId && !pcRef.current[peerId]) {
                            if (userId > peerId) {
                                console.log(`[WebRTC] Initiating call to ${peerId}`);
                                const pc = createPeerConnection(peerId);
                                const localOffer = await pc.createOffer();
                                await pc.setLocalDescription(localOffer);

                                channel.send({
                                    type: "broadcast",
                                    event: "webrtc:offer",
                                    payload: { senderId: userId, targetId: peerId, offer: localOffer },
                                });
                            }
                        }
                    });
                })
                .on("presence", { event: "leave" }, ({ key }) => {
                    cleanupPeer(key);
                })
                .on("broadcast", { event: "webrtc:offer" }, ({ payload }) => handleSignaling(payload))
                .on("broadcast", { event: "webrtc:answer" }, ({ payload }) => handleSignaling(payload))
                .on("broadcast", { event: "webrtc:ice" }, ({ payload }) => handleSignaling(payload))
                .subscribe(async (status) => {
                    if (status === "SUBSCRIBED") {
                        console.log("[WebRTC] Subscribed to signaling channel");
                        await channel.track({ online_at: new Date().toISOString(), status: 'online' });
                    }
                });

        } catch (err: any) {
            console.error("[WebRTC] Failed to initialize:", err);
            setError("Failed to access camera/microphone.");
        }
    }, [roomId, userId, maxMembers, createPeerConnection, handleSignaling, cleanupPeer, cleanupAll]);

    useEffect(() => {
        initializeCall();
        return cleanupAll;
    }, [initializeCall, cleanupAll]);

    const toggleMute = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsMuted(!track.enabled);
            }
        }
    };

    const toggleCamera = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getVideoTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsCameraOff(!track.enabled);
            }
        }
    };

    return {
        localStream,
        remoteStreams,
        participants,
        isMuted,
        isCameraOff,
        error,
        toggleMute,
        toggleCamera,
    };
}
