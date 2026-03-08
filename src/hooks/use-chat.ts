import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useOnlineCount } from "./use-online-count";
import { sounds } from "@/lib/sounds";
import { sendNotification } from "@/lib/notifications";

const getProfile = () => {
  try {
    const raw = localStorage.getItem("lchat.profile");
    if (raw) return JSON.parse(raw) as { nickname: string; avatar: string };
  } catch {}
  return { nickname: "", avatar: "😀" };
};

export interface Message {
  id: string;
  sender: "you" | "stranger" | "system";
  text: string;
  imageUrl?: string;
  timestamp: Date;
  reactions: Record<string, string[]>;
  senderNickname?: string;
  senderAvatar?: string;
  read?: boolean;
  replyTo?: { id: string; text: string; sender: string };
  deleted?: boolean;
  pinned?: boolean;
  disappearAt?: number; // unix ms when message auto-deletes
}

export type ChatStatus = "idle" | "searching" | "connected" | "disconnected";

interface ChatCallbacks {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoReconnect: boolean;
  onSignaling?: (event: string, payload: Record<string, unknown>) => void;
}

const getSessionId = () => {
  let id = sessionStorage.getItem("echo_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("echo_session_id", id);
  }
  return id;
};

const sessionId = getSessionId();

const getBlockedIds = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem("echo.blocked") || "[]");
  } catch { return []; }
};

const addBlockedId = (id: string) => {
  const blocked = getBlockedIds();
  if (!blocked.includes(id)) {
    blocked.push(id);
    localStorage.setItem("echo.blocked", JSON.stringify(blocked));
  }
};

export function useChat(callbacks?: ChatCallbacks) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const onlineCount = useOnlineCount();
  const [interests, setInterests] = useState<string[]>([]);
  const [matchedInterests, setMatchedInterests] = useState<string[]>([]);
  const [strangerTyping, setStrangerTyping] = useState(false);
  const [strangerTypingText, setStrangerTypingText] = useState("");
  const [autoReconnectCountdown, setAutoReconnectCountdown] = useState<number | null>(null);
  const [searchElapsed, setSearchElapsed] = useState(0);
  const [privateRoomCode, setPrivateRoomCode] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const roomChannelRef = useRef<RealtimeChannel | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const strangerIdRef = useRef<string | null>(null);
  const interestsRef = useRef<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const matchedGuardRef = useRef(false);
  const callbacksRef = useRef(callbacks);
  const disappearTimerRef = useRef<number | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const [disappearTimer, setDisappearTimer] = useState<number | null>(null);

  useEffect(() => { callbacksRef.current = callbacks; }, [callbacks]);
  useEffect(() => { interestsRef.current = interests; }, [interests]);
  useEffect(() => { disappearTimerRef.current = disappearTimer; }, [disappearTimer]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearInterval(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    setAutoReconnectCountdown(null);
  }, []);

  const playSoundIfEnabled = useCallback((sound: keyof typeof sounds) => {
    if (callbacksRef.current?.soundEnabled) sounds[sound]();
  }, []);

  const notifyIfEnabled = useCallback((title: string, body: string) => {
    if (callbacksRef.current?.notificationsEnabled) sendNotification(title, body);
  }, []);

  const addMessage = useCallback((sender: Message["sender"], text: string, imageUrl?: string, senderNickname?: string, senderAvatar?: string, existingId?: string, replyTo?: Message["replyTo"]) => {
    const id = existingId || crypto.randomUUID();
    const dt = disappearTimerRef.current;
    const disappearAt = dt && sender !== "system" ? Date.now() + dt * 1000 : undefined;
    setMessages((prev) => [
      ...prev,
      { id, sender, text, imageUrl, timestamp: new Date(), reactions: {}, senderNickname, senderAvatar, read: false, replyTo, disappearAt },
    ]);
    return id;
  }, []);

  const leaveRoom = useCallback(() => {
    if (roomChannelRef.current) {
      roomChannelRef.current.unsubscribe();
      roomChannelRef.current = null;
    }
    roomIdRef.current = null;
    strangerIdRef.current = null;
    setStrangerTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, []);

  const joinRoom = useCallback(
    (roomId: string, strangerId: string) => {
      leaveRoom();
      roomIdRef.current = roomId;
      strangerIdRef.current = strangerId;

      const channel = supabase.channel(`room:${roomId}`);

      channel
        .on("broadcast", { event: "message" }, (payload) => {
          const data = payload.payload as { senderId: string; messageId: string; text: string; imageUrl?: string; nickname?: string; avatar?: string; replyTo?: Message["replyTo"] };
          if (data.senderId !== sessionId) {
            setStrangerTyping(false);
            addMessage("stranger", data.text, data.imageUrl, data.nickname, data.avatar, data.messageId, data.replyTo);
            playSoundIfEnabled("messageReceived");
            notifyIfEnabled("L Chat", data.imageUrl ? "📷 Image" : data.text.slice(0, 100));
            // Send read receipt
            channel.send({ type: "broadcast", event: "read", payload: { senderId: sessionId, messageId: data.messageId } });
          }
        })
        .on("broadcast", { event: "read" }, (payload) => {
          const data = payload.payload as { senderId: string; messageId: string };
          if (data.senderId !== sessionId) {
            setMessages((prev) => prev.map((msg) => msg.id === data.messageId ? { ...msg, read: true } : msg));
          }
        })
        .on("broadcast", { event: "typing" }, (payload) => {
          const data = payload.payload as { senderId: string; text?: string };
          if (data.senderId !== sessionId) {
            setStrangerTyping(true);
            setStrangerTypingText(data.text || "");
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              setStrangerTyping(false);
              setStrangerTypingText("");
            }, 3000);
          }
        })
        .on("broadcast", { event: "reaction" }, (payload) => {
          const data = payload.payload as { senderId: string; messageId: string; emoji: string };
          if (data.senderId !== sessionId) {
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id !== data.messageId) return msg;
                const reactions = { ...msg.reactions };
                const senders = reactions[data.emoji] || [];
                if (senders.includes(data.senderId)) {
                  reactions[data.emoji] = senders.filter((s) => s !== data.senderId);
                } else {
                  reactions[data.emoji] = [...senders, data.senderId];
                }
                return { ...msg, reactions };
              })
            );
          }
        })
        .on("broadcast", { event: "leave" }, (payload) => {
          const data = payload.payload as { senderId: string };
          if (data.senderId !== sessionId) {
            setStatus("disconnected");
            addMessage("system", "Stranger has disconnected.");
            playSoundIfEnabled("disconnected");
            notifyIfEnabled("L Chat", "Stranger has disconnected.");
            leaveRoom();
          }
        })
        .on("broadcast", { event: "delete_msg" }, (payload) => {
          const data = payload.payload as { senderId: string; messageId: string };
          if (data.senderId !== sessionId) {
            setMessages((prev) => prev.map((msg) =>
              msg.id === data.messageId ? { ...msg, deleted: true, text: "🚫 This message was deleted", imageUrl: undefined } : msg
            ));
          }
        })
        .on("broadcast", { event: "pin_msg" }, (payload) => {
          const data = payload.payload as { senderId: string; messageId: string; pinned: boolean };
          if (data.senderId !== sessionId) {
            setMessages((prev) => prev.map((msg) =>
              msg.id === data.messageId ? { ...msg, pinned: data.pinned } : msg
            ));
          }
        });

      // WebRTC signaling events
      const webrtcEvents = ["webrtc:request", "webrtc:accept", "webrtc:decline", "webrtc:offer", "webrtc:answer", "webrtc:ice", "webrtc:end", "webrtc:screenshare", "webrtc:state"];
      webrtcEvents.forEach((evt) => {
        channel.on("broadcast", { event: evt }, (payload) => {
          callbacksRef.current?.onSignaling?.(evt, payload.payload as Record<string, unknown>);
        });
      });

      channel.subscribe();

      roomChannelRef.current = channel;
    },
    [addMessage, leaveRoom, playSoundIfEnabled, notifyIfEnabled]
  );

  const sendTyping = useCallback((text?: string) => {
    roomChannelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { senderId: sessionId, text: text?.slice(0, 50) },
    });
  }, []);

  const reactToMessage = useCallback((messageId: string, emoji: string) => {
    // Local update
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const reactions = { ...msg.reactions };
        const senders = reactions[emoji] || [];
        if (senders.includes(sessionId)) {
          reactions[emoji] = senders.filter((s) => s !== sessionId);
        } else {
          reactions[emoji] = [...senders, sessionId];
        }
        return { ...msg, reactions };
      })
    );
    // Broadcast
    roomChannelRef.current?.send({
      type: "broadcast",
      event: "reaction",
      payload: { senderId: sessionId, messageId, emoji },
    });
  }, []);

  const startChat = useCallback(() => {
    clearReconnectTimer();
    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    matchedGuardRef.current = false;
    setMessages([]);
    setMatchedInterests([]);
    setStrangerTyping(false);
    setStatus("searching");
    setSearchElapsed(0);
    addMessage("system", "Looking for a stranger...");

    // Track search time
    const startTime = Date.now();
    searchTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setSearchElapsed(elapsed);
      if (elapsed === 10) {
        addMessage("system", "Still searching... hang tight!");
      } else if (elapsed === 30) {
        addMessage("system", "Taking a bit longer than usual. Try sharing the link to get more people online!");
      }
    }, 1000);

    if (channelRef.current) channelRef.current.unsubscribe();

    const blocked = getBlockedIds();
    const matchChannel = supabase.channel("matchmaking", {
      config: { presence: { key: sessionId } },
    });

    const handleMatched = (roomId: string, strangerId: string, sharedInterests: string[]) => {
      // Guard: prevent double-match
      if (matchedGuardRef.current) return;
      matchedGuardRef.current = true;

      if (blocked.includes(strangerId)) {
        matchedGuardRef.current = false;
        return;
      }

      joinRoom(roomId, strangerId);
      setStatus("connected");
      setMessages([]);
      setMatchedInterests(sharedInterests);
      playSoundIfEnabled("connected");

      if (sharedInterests.length > 0) {
        addMessage("system", `Matched! You both like: ${sharedInterests.join(", ")}`);
      } else {
        addMessage("system", "You are now connected with a stranger. Say hello!");
      }
      notifyIfEnabled("L Chat", "Connected with a stranger!");
      if (searchTimerRef.current) { clearInterval(searchTimerRef.current); searchTimerRef.current = null; }
      setSearchElapsed(0);

      // Delay unsubscribe to ensure broadcast is delivered
      setTimeout(() => {
        matchChannel.unsubscribe();
        channelRef.current = null;
      }, 500);
    };

    const findMatch = () => {
      if (matchedGuardRef.current) return;

      const state = matchChannel.presenceState();
      const myInterests = interestsRef.current;
      const waitingUsers = Object.keys(state).filter(
        (id) => id !== sessionId && !blocked.includes(id)
      );

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

      // Only the lexicographically first user initiates
      if (pair[0] === sessionId) {
        matchChannel.send({
          type: "broadcast",
          event: "matched",
          payload: { roomId, user1: pair[0], user2: pair[1], sharedInterests: best.shared },
        });
        handleMatched(roomId, best.id, best.shared);
      }
      // pair[1] waits for the broadcast instead of joining directly
    };

    matchChannel
      .on("presence", { event: "sync" }, findMatch)
      .on("broadcast", { event: "matched" }, (payload) => {
        const data = payload.payload as { roomId: string; user1: string; user2: string; sharedInterests: string[] };
        if (data.user1 === sessionId || data.user2 === sessionId) {
          const strangerId = data.user1 === sessionId ? data.user2 : data.user1;
          handleMatched(data.roomId, strangerId, data.sharedInterests || []);
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
  }, [addMessage, joinRoom, playSoundIfEnabled, notifyIfEnabled, clearReconnectTimer]);

  const sendMessage = useCallback(
    (text: string, imageUrl?: string, replyTo?: Message["replyTo"]) => {
      if (status !== "connected" || (!text.trim() && !imageUrl) || !roomChannelRef.current) return;
      const p = getProfile();
      const messageId = crypto.randomUUID();
      addMessage("you", text.trim(), imageUrl, p.nickname, p.avatar, messageId, replyTo);
      playSoundIfEnabled("messageSent");
      roomChannelRef.current.send({
        type: "broadcast",
        event: "message",
        payload: { senderId: sessionId, messageId, text: text.trim(), imageUrl, nickname: p.nickname, avatar: p.avatar, replyTo },
      });
    },
    [status, addMessage, playSoundIfEnabled]
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

  const blockStranger = useCallback(() => {
    if (strangerIdRef.current) {
      addBlockedId(strangerIdRef.current);
    }
    stopChat();
  }, [stopChat]);

  // Private room: join by code (works for both creator and joiner)
  const joinPrivateRoom = useCallback((code: string) => {
    clearReconnectTimer();
    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    matchedGuardRef.current = false;
    setMessages([]);
    setMatchedInterests([]);
    setStrangerTyping(false);
    setStatus("searching");
    setSearchElapsed(0);
    setPrivateRoomCode(code);
    addMessage("system", `Joining room ${code}... Waiting for your friend.`);

    if (channelRef.current) channelRef.current.unsubscribe();

    const privateChannel = supabase.channel(`private:${code}`, {
      config: { presence: { key: sessionId } },
    });

    const handleMatch = (roomId: string, strangerId: string) => {
      if (matchedGuardRef.current) return;
      matchedGuardRef.current = true;
      joinRoom(roomId, strangerId);
      setStatus("connected");
      setMessages([]);
      addMessage("system", "Connected! Say hello! 👋");
      playSoundIfEnabled("connected");
      notifyIfEnabled("L Chat", "Your friend joined!");
      if (searchTimerRef.current) { clearInterval(searchTimerRef.current); searchTimerRef.current = null; }
      setSearchElapsed(0);
      setTimeout(() => {
        privateChannel.unsubscribe();
        channelRef.current = null;
      }, 500);
    };

    const tryMatch = () => {
      if (matchedGuardRef.current) return;
      const state = privateChannel.presenceState();
      const userIds = Object.keys(state).filter((id) => id !== sessionId);
      if (userIds.length === 0) return;

      const strangerId = userIds[0];
      const privateRoomId = `private_${code}`;
      const pair = [sessionId, strangerId].sort();

      // Only the lexicographically first user broadcasts the match
      if (pair[0] === sessionId) {
        privateChannel.send({
          type: "broadcast",
          event: "room_matched",
          payload: { roomId: privateRoomId, creator: sessionId, joiner: strangerId },
        });
        handleMatch(privateRoomId, strangerId);
      }
    };

    privateChannel
      .on("presence", { event: "sync" }, tryMatch)
      .on("broadcast", { event: "room_matched" }, (payload) => {
        const data = payload.payload as { roomId: string; creator: string; joiner: string };
        if (data.joiner === sessionId || data.creator === sessionId) {
          const strangerId = data.creator === sessionId ? data.joiner : data.creator;
          handleMatch(data.roomId, strangerId);
        }
      })
      .subscribe(async (s) => {
        if (s === "SUBSCRIBED") {
          await privateChannel.track({ joined_at: new Date().toISOString() });
        }
      });

    channelRef.current = privateChannel;
  }, [addMessage, joinRoom, playSoundIfEnabled, notifyIfEnabled, clearReconnectTimer]);

  // Private room: create (generates code then uses joinPrivateRoom)
  const createPrivateRoom = useCallback((): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    joinPrivateRoom(code);
    return code;
  }, [joinPrivateRoom]);

  // Auto-reconnect countdown (only for random chat, not private rooms)
  useEffect(() => {
    if (status === "disconnected" && callbacksRef.current?.autoReconnect && !privateRoomCode) {
      let count = 5;
      setAutoReconnectCountdown(count);
      reconnectTimerRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearReconnectTimer();
          startChat();
        } else {
          setAutoReconnectCountdown(count);
        }
      }, 1000);
    } else {
      clearReconnectTimer();
    }
    return () => clearReconnectTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (reconnectTimerRef.current) clearInterval(reconnectTimerRef.current);
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    };
  }, []);

  // Delete for everyone
  const deleteMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.map((msg) =>
      msg.id === messageId ? { ...msg, deleted: true, text: "🚫 This message was deleted", imageUrl: undefined } : msg
    ));
    roomChannelRef.current?.send({
      type: "broadcast",
      event: "delete_msg",
      payload: { senderId: sessionId, messageId },
    });
  }, []);

  // Pin/unpin message
  const pinMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.map((msg) =>
      msg.id === messageId ? { ...msg, pinned: !msg.pinned } : msg
    ));
    const msg = messagesRef.current?.find((m) => m.id === messageId);
    roomChannelRef.current?.send({
      type: "broadcast",
      event: "pin_msg",
      payload: { senderId: sessionId, messageId, pinned: !(msg?.pinned) },
    });
  }, []);

  // (disappearTimer and messagesRef moved to top of hook)

  // Auto-delete expired disappearing messages
  useEffect(() => {
    if (!disappearTimer) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setMessages((prev) => prev.filter((msg) => {
        if (msg.sender === "system") return true;
        if (!msg.disappearAt) return true;
        return msg.disappearAt > now;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [disappearTimer]);

  return {
    messages, status, onlineCount, interests, matchedInterests, strangerTyping, strangerTypingText,
    autoReconnectCountdown, sessionId, searchElapsed, privateRoomCode,
    roomChannel: roomChannelRef.current,
    setInterests, startChat, sendMessage, sendTyping, nextChat, stopChat,
    reactToMessage, blockStranger, createPrivateRoom, joinPrivateRoom,
    deleteMessage, pinMessage, disappearTimer, setDisappearTimer,
  };
}
