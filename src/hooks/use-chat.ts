import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Message {
  id: string;
  sender: "you" | "stranger" | "system";
  text: string;
  timestamp: Date;
}

type ChatStatus = "idle" | "searching" | "connected" | "disconnected";

// Generate a unique anonymous ID per session
const getSessionId = () => {
  let id = sessionStorage.getItem("echo_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("echo_session_id", id);
  }
  return id;
};

const sessionId = getSessionId();

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [onlineCount, setOnlineCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const roomChannelRef = useRef<RealtimeChannel | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);

  const addMessage = useCallback((sender: Message["sender"], text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), sender, text, timestamp: new Date() },
    ]);
  }, []);

  // Track online presence
  useEffect(() => {
    const channel = supabase.channel("online-users", {
      config: { presence: { key: sessionId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    presenceChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const leaveRoom = useCallback(() => {
    if (roomChannelRef.current) {
      roomChannelRef.current.unsubscribe();
      roomChannelRef.current = null;
    }
    roomIdRef.current = null;
  }, []);

  const joinRoom = useCallback(
    (roomId: string) => {
      leaveRoom();
      roomIdRef.current = roomId;

      const channel = supabase.channel(`room:${roomId}`);

      channel
        .on("broadcast", { event: "message" }, (payload) => {
          const data = payload.payload as { senderId: string; text: string };
          if (data.senderId !== sessionId) {
            addMessage("stranger", data.text);
          }
        })
        .on("broadcast", { event: "leave" }, (payload) => {
          const data = payload.payload as { senderId: string };
          if (data.senderId !== sessionId) {
            setStatus("disconnected");
            addMessage("system", "Stranger has disconnected.");
            leaveRoom();
          }
        })
        .subscribe();

      roomChannelRef.current = channel;
    },
    [addMessage, leaveRoom]
  );

  const startChat = useCallback(() => {
    setMessages([]);
    setStatus("searching");
    addMessage("system", "Looking for a stranger...");

    // Clean up previous matchmaking channel
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    // Use a matchmaking channel
    const matchChannel = supabase.channel("matchmaking", {
      config: { presence: { key: sessionId } },
    });

    matchChannel
      .on("presence", { event: "sync" }, () => {
        const state = matchChannel.presenceState();
        const waitingUsers = Object.keys(state).filter((id) => id !== sessionId);

        if (waitingUsers.length > 0) {
          // Sort to ensure both users agree on the same room
          const pair = [sessionId, waitingUsers[0]].sort();
          const roomId = `${pair[0]}_${pair[1]}`;

          // The "first" user in sorted order initiates the match
          if (pair[0] === sessionId) {
            // Broadcast match to the other user
            matchChannel.send({
              type: "broadcast",
              event: "matched",
              payload: { roomId, user1: pair[0], user2: pair[1] },
            });
          }

          // Both join the room
          joinRoom(roomId);
          setStatus("connected");
          setMessages([]);
          addMessage("system", "You are now connected with a stranger. Say hello!");
          matchChannel.unsubscribe();
          channelRef.current = null;
        }
      })
      .on("broadcast", { event: "matched" }, (payload) => {
        const data = payload.payload as { roomId: string; user1: string; user2: string };
        if (data.user1 === sessionId || data.user2 === sessionId) {
          joinRoom(data.roomId);
          setStatus("connected");
          setMessages([]);
          addMessage("system", "You are now connected with a stranger. Say hello!");
          matchChannel.unsubscribe();
          channelRef.current = null;
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await matchChannel.track({ waiting_since: new Date().toISOString() });
        }
      });

    channelRef.current = matchChannel;
  }, [addMessage, joinRoom]);

  const sendMessage = useCallback(
    (text: string) => {
      if (status !== "connected" || !text.trim() || !roomChannelRef.current) return;
      addMessage("you", text.trim());
      roomChannelRef.current.send({
        type: "broadcast",
        event: "message",
        payload: { senderId: sessionId, text: text.trim() },
      });
    },
    [status, addMessage]
  );

  const nextChat = useCallback(() => {
    if (roomChannelRef.current && roomIdRef.current) {
      roomChannelRef.current.send({
        type: "broadcast",
        event: "leave",
        payload: { senderId: sessionId },
      });
    }
    leaveRoom();
    startChat();
  }, [startChat, leaveRoom]);

  const stopChat = useCallback(() => {
    if (roomChannelRef.current && roomIdRef.current) {
      roomChannelRef.current.send({
        type: "broadcast",
        event: "leave",
        payload: { senderId: sessionId },
      });
    }
    leaveRoom();
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    setStatus("disconnected");
    addMessage("system", "You have disconnected.");
  }, [addMessage, leaveRoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) channelRef.current.unsubscribe();
      if (roomChannelRef.current) {
        roomChannelRef.current.send({
          type: "broadcast",
          event: "leave",
          payload: { senderId: sessionId },
        });
        roomChannelRef.current.unsubscribe();
      }
    };
  }, []);

  return { messages, status, onlineCount, startChat, sendMessage, nextChat, stopChat };
}
