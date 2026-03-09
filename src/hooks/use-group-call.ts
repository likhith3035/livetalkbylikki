import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
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
            const pc = new RTCPeerConnection(ICE_SERVERS);
            pcRef.current[peerId] = pc;

            // Add local tracks to new peer
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => {
                    pc.addTrack(track, localStreamRef.current!);
                });
            }

            pc.ontrack = (event) => {
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
                if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
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

            // Ignore messages not specifically targeted to us (unless it's a general state update)
            if (targetId && targetId !== userId) return;

            try {
                if (offer) {
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
                console.error("Signaling error:", err);
            }
        },
        [userId, createPeerConnection]
    );

    const initializeCall = useCallback(async () => {
        try {
            // 1. Get Camera/Mic
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            setLocalStream(stream);

            // 2. Join Supabase Channel
            const channel = supabase.channel(`group_room:${roomId}`, {
                config: { presence: { key: userId } },
            });
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

                    // For every participant already in the room that we don't have a connection with, we create an offer.
                    // To prevent crossing offers, we only initiate if our ID > their ID lexicographically.
                    pIds.forEach(async (peerId) => {
                        if (peerId !== userId && !pcRef.current[peerId]) {
                            if (userId > peerId) {
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
                        await channel.track({ online_at: new Date().toISOString() });
                    }
                });

        } catch (err: any) {
            console.error(err);
            setError("Failed to access camera/microphone.");
        }
    }, [roomId, userId, maxMembers, createPeerConnection, handleSignaling, cleanupPeer, cleanupAll]);

    useEffect(() => {
        initializeCall();
        return cleanupAll;
    }, [initializeCall, cleanupAll]);

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleCamera = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOff(!videoTrack.enabled);
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
