import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Message } from "./use-chat"; // Reusing Message type if available, or redefining

export interface GroupMessage {
    id: string;
    text: string;
    sender: "you" | "stranger";
    timestamp: Date;
    senderId?: string;
    senderNickname?: string;
}

interface UseGroupChatOptions {
    roomId: string;
    userId: string;
    userNickname: string;
    maxMembers: number;
}

export function useGroupChat({ roomId, userId, userNickname, maxMembers }: UseGroupChatOptions) {
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [participants, setParticipants] = useState<Record<string, { name: string }>>({});
    const [error, setError] = useState<string | null>(null);

    const channelRef = useRef<RealtimeChannel | null>(null);

    const cleanupAll = useCallback(() => {
        if (channelRef.current) {
            channelRef.current.unsubscribe();
            channelRef.current = null;
        }
    }, []);

    const initializeChat = useCallback(async () => {
        try {
            const channel = supabase.channel(`group_chat:${roomId}`, {
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

                    const newParticipants: Record<string, { name: string }> = {};
                    for (const id in presenceState) {
                        // Assuming presence state includes the user name
                        const state = presenceState[id][0] as any;
                        newParticipants[id] = { name: state?.name || "Anonymous" };
                    }
                    setParticipants(newParticipants);
                })
                .on("broadcast", { event: "chat:message" }, ({ payload }) => {
                    if (payload.senderId !== userId) {
                        setMessages(prev => [...prev, {
                            id: payload.id,
                            text: payload.text,
                            sender: "stranger",
                            timestamp: new Date(),
                            senderId: payload.senderId,
                            senderNickname: payload.senderNickname
                        }]);
                    }
                })
                .subscribe(async (status) => {
                    if (status === "SUBSCRIBED") {
                        await channel.track({ online_at: new Date().toISOString(), status: 'online', nickname: userNickname });
                    }
                });

        } catch (err: any) {
            console.error("[GroupChat] Failed to initialize:", err);
            setError("Failed to connect to chat room.");
        }
    }, [roomId, userId, userNickname, maxMembers, cleanupAll]);

    useEffect(() => {
        initializeChat();
        return cleanupAll;
    }, [initializeChat, cleanupAll]);

    const sendMessage = useCallback((text: string) => {
        if (!text.trim() || !channelRef.current) return;

        const messageId = Math.random().toString(36).substring(2, 10);
        const newMessage: GroupMessage = {
            id: messageId,
            text,
            sender: "you",
            timestamp: new Date(),
            senderId: userId,
            senderNickname: userNickname
        };

        setMessages(prev => [...prev, newMessage]);

        channelRef.current.send({
            type: "broadcast",
            event: "chat:message",
            payload: {
                id: messageId,
                text,
                senderId: userId,
                senderNickname: userNickname
            }
        });
    }, [userId, userNickname]);

    return {
        messages,
        participants,
        error,
        sendMessage,
    };
}
