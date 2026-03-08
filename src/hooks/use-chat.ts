import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useOnlineCount } from "./use-online-count";

interface Message {
  id: string;
  sender: "you" | "stranger" | "system";
  text: string;
  timestamp: Date;
}

type ChatStatus = "idle" | "searching" | "connected" | "disconnected";

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
  const onlineCount = useOnlineCount();
  const [interests, setInterests] = useState<string[]>([]);
  const [matchedInterests, setMatchedInterests] = useState<string[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const roomChannelRef = useRef<RealtimeChannel | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const interestsRef = useRef<string[]>([]);

  useEffect(() => {
    interestsRef.current = interests;
  }, [interests]);

  const addMessage = useCallback((sender: Message["sender"], text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), sender, text, timestamp: new Date() },
    ]);
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
    setMatchedInterests([]);
    setStatus("searching");
    addMessage("system", "Looking for a stranger...");

    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    const matchChannel = supabase.channel("matchmaking", {
      config: { presence: { key: sessionId } },
    });

    const findMatch = () => {
      const state = matchChannel.presenceState();
      const myInterests = interestsRef.current;
      const waitingUsers = Object.keys(state).filter((id) => id !== sessionId);

      if (waitingUsers.length === 0) return;

      type Candidate = { id: string; shared: string[]; score: number };
      const candidates: Candidate[] = waitingUsers.map((uid) => {
        const presenceData = state[uid]?.[0] as { interests?: string[] } | undefined;
        const theirInterests: string[] = presenceData?.interests || [];
        const shared = myInterests.filter((i) => theirInterests.includes(i));
        return { id: uid, shared, score: shared.length };
      });

      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0];

      const pair = [sessionId, best.id].sort();
      const roomId = `${pair[0]}_${pair[1]}`;

      if (pair[0] === sessionId) {
        matchChannel.send({
          type: "broadcast",
          event: "matched",
          payload: { roomId, user1: pair[0], user2: pair[1], sharedInterests: best.shared },
        });
      }

      joinRoom(roomId);
      setStatus("connected");
      setMessages([]);
      setMatchedInterests(best.shared);

      if (best.shared.length > 0) {
        addMessage("system", `Matched! You both like: ${best.shared.join(", ")}`);
      } else {
        addMessage("system", "You are now connected with a stranger. Say hello!");
      }
      matchChannel.unsubscribe();
      channelRef.current = null;
    };

    matchChannel
      .on("presence", { event: "sync" }, findMatch)
      .on("broadcast", { event: "matched" }, (payload) => {
        const data = payload.payload as { roomId: string; user1: string; user2: string; sharedInterests: string[] };
        if (data.user1 === sessionId || data.user2 === sessionId) {
          joinRoom(data.roomId);
          setStatus("connected");
          setMessages([]);
          setMatchedInterests(data.sharedInterests || []);

          if (data.sharedInterests?.length > 0) {
            addMessage("system", `Matched! You both like: ${data.sharedInterests.join(", ")}`);
          } else {
            addMessage("system", "You are now connected with a stranger. Say hello!");
          }
          matchChannel.unsubscribe();
          channelRef.current = null;
        }
      })
      .subscribe(async (s) => {
        if (s === "SUBSCRIBED") {
          await matchChannel.track({
            waiting_since: new Date().toISOString(),
            interests: interestsRef.current,
          });
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
    setMatchedInterests([]);
    addMessage("system", "You have disconnected.");
  }, [addMessage, leaveRoom]);

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

  return {
    messages, status, onlineCount, interests, matchedInterests,
    setInterests, startChat, sendMessage, nextChat, stopChat,
  };
}
