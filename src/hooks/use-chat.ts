import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useOnlineCount } from "./use-online-count";
import { sounds, haptics } from "@/lib/sounds";
import { sendNotification, type NotificationType } from "@/lib/notifications";
import { useFirebaseMatchmaking } from "./use-firebase-matchmaking";
import { useFirebaseSignaling } from "./use-firebase-signaling";
import { useSafety } from "./use-safety";

const getProfile = () => {
  try {
    const raw = localStorage.getItem("lchat.profile");
    if (raw) return JSON.parse(raw) as { nickname: string; avatar: string };
  } catch { }
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
  disappearAt?: number;
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

const getStableId = () => {
  let id = localStorage.getItem("echo_stable_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("echo_stable_id", id);
  }
  return id;
};

const stableId = getStableId();

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
  const { checkProfanity, reportUser, isBanned, handleViolation } = useSafety();
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
  const strangerStableIdRef = useRef<string | null>(null);
  const interestsRef = useRef<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const matchedGuardRef = useRef(false);
  const callbacksRef = useRef(callbacks);
  const disappearTimerRef = useRef<number | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const [disappearTimer, setDisappearTimer] = useState<number | null>(null);

  const stopSearchRef = useRef<() => void>(() => {});

  useEffect(() => { callbacksRef.current = callbacks; }, [callbacks]);
  useEffect(() => { interestsRef.current = interests; }, [interests]);
  useEffect(() => { disappearTimerRef.current = disappearTimer; }, [disappearTimer]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const playSoundIfEnabled = useCallback((sound: keyof typeof sounds) => {
    if (callbacksRef.current?.soundEnabled) sounds[sound]();
  }, []);

  const notifyIfEnabled = useCallback((title: string, body: string, type: NotificationType = "general") => {
    if (callbacksRef.current?.notificationsEnabled) sendNotification(title, body, type);
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
    stopSearchRef.current?.();
  }, []);

  const joinRoom = useCallback(
    (roomId: string, strangerId: string, sharedInterests: string[] = []) => {
      leaveRoom();
      roomIdRef.current = roomId;
      strangerIdRef.current = strangerId;
      setStatus("connected");
      setMessages([]);
      setMatchedInterests(sharedInterests);
      playSoundIfEnabled("connected");
      if (callbacksRef.current?.soundEnabled) haptics.vibrate([100, 50, 100]);

      if (sharedInterests.length > 0) {
        addMessage("system", `Matched! You both like: ${sharedInterests.join(", ")}`);
      } else {
        addMessage("system", "You are now connected with a stranger. Say hello!");
      }
      notifyIfEnabled("L Chat", "Connected with a stranger!", "connected");
      if (searchTimerRef.current) { clearInterval(searchTimerRef.current); searchTimerRef.current = null; }
      setSearchElapsed(0);

      const channel = supabase.channel(`room:${roomId}`);
      channel
        .on("broadcast", { event: "message" }, (payload) => {
          const data = payload.payload as { senderId: string; messageId: string; text: string; imageUrl?: string; nickname?: string; avatar?: string; replyTo?: Message["replyTo"] };
          if (data.senderId !== sessionId) {
            setStrangerTyping(false);
            addMessage("stranger", data.text, data.imageUrl, data.nickname, data.avatar, data.messageId, data.replyTo);
            playSoundIfEnabled("messageReceived");
            if (callbacksRef.current?.soundEnabled) haptics.vibrate(50);
            notifyIfEnabled("L Chat", data.imageUrl ? "📷 Image" : data.text.slice(0, 100), "message");
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
            notifyIfEnabled("L Chat", "Stranger has disconnected.", "disconnected");
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

      channel.subscribe();
      roomChannelRef.current = channel;
    },
    [addMessage, leaveRoom, playSoundIfEnabled, notifyIfEnabled]
  );

  const onMatched = useCallback((roomId: string, strangerId: string, strangerStableId: string, sharedInterests: string[]) => {
    strangerStableIdRef.current = strangerStableId;
    joinRoom(roomId, strangerId, sharedInterests);
  }, [joinRoom]);

  const { startSearch: startFirebaseSearch, stopSearch: stopFirebaseSearch } = useFirebaseMatchmaking({
    sessionId,
    stableId,
    interests,
    onMatched
  });

  useEffect(() => {
    stopSearchRef.current = stopFirebaseSearch;
  }, [stopFirebaseSearch]);

  const { sendEvent: sendFirebaseSignalingEvent } = useFirebaseSignaling({
    sessionId,
    roomId: roomIdRef.current,
    onEvent: (event, payload) => {
      callbacksRef.current?.onSignaling?.(event, payload);
    }
  });

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearInterval(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    setAutoReconnectCountdown(null);
  }, []);

  const sendTyping = useCallback((text?: string) => {
    roomChannelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { senderId: sessionId, text: text?.slice(0, 50) },
    });
  }, []);

  const reactToMessage = useCallback((messageId: string, emoji: string) => {
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
    roomChannelRef.current?.send({
      type: "broadcast",
      event: "reaction",
      payload: { senderId: sessionId, messageId, emoji },
    });
  }, []);

  const startChat = useCallback((code: string | null = null) => {
    if (isBanned(stableId)) {
      addMessage("system", "Access Denied: Your account has been globally blacklisted for community guideline violations.");
      setStatus("disconnected");
      return;
    }
    clearReconnectTimer();
    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    matchedGuardRef.current = false;
    setMessages([]);
    setMatchedInterests([]);
    setStrangerTyping(false);
    setStatus("searching");
    setSearchElapsed(0);
    addMessage("system", code ? `Joining room ${code} (via Firebase)...` : "Looking for a stranger (using Firebase Lobby)...");
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
    startFirebaseSearch(code);
  }, [addMessage, clearReconnectTimer, startFirebaseSearch, isBanned]);

  const sendMessage = useCallback(
    (text: string, imageUrl?: string, replyTo?: Message["replyTo"]) => {
      if (status !== "connected" || (!text.trim() && !imageUrl) || !roomChannelRef.current) return;
      if (text && checkProfanity(text)) {
        addMessage("system", "Blocked: Please maintain a friendly environment. Profanity is not allowed.");
        handleViolation(stableId); // Track violation for auto-ban
        return;
      }
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
    [status, addMessage, playSoundIfEnabled, checkProfanity]
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

  const reportStranger = useCallback((reason: string) => {
    if (strangerStableIdRef.current) {
      reportUser(strangerStableIdRef.current, reason, stableId);
    }
  }, [reportUser]);

  const joinPrivateRoom = useCallback((code: string) => {
    setPrivateRoomCode(code);
    startChat(code); 
  }, [startChat]);

  const createPrivateRoom = useCallback((): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    joinPrivateRoom(code);
    return code;
  }, [joinPrivateRoom]);

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
  }, [status, startChat, privateRoomCode, clearReconnectTimer]);

  useEffect(() => {
    return () => {
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
      stopSearchRef.current?.();
    };
  }, []);

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
    autoReconnectCountdown, sessionId, stableId, searchElapsed, privateRoomCode,
    roomChannel: roomChannelRef.current,
    setInterests, startChat, sendMessage, sendTyping, nextChat, stopChat,
    reactToMessage, blockStranger, createPrivateRoom, joinPrivateRoom,
    deleteMessage, pinMessage, disappearTimer, setDisappearTimer,
    sendSignalingEvent: sendFirebaseSignalingEvent, reportStranger
  };
}
