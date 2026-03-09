import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface GroupMessage {
  id: string;
  text: string;
  imageUrl?: string;
  sender: string; // sessionId
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
  reactions: Record<string, string[]>;
}

export interface GroupRoom {
  id: string;
  name: string;
  topic: string;
  maxMembers: number;
  isPublic: boolean;
  creatorId: string;
  creatorName: string;
  memberCount: number;
  createdAt: Date;
}

export interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  joinedAt: Date;
}

interface UseGroupChatOptions {
  soundEnabled?: boolean;
}

const getSessionId = (): string => {
  let id = sessionStorage.getItem("echo_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("echo_session_id", id);
  }
  return id;
};

const getProfile = () => {
  try {
    const raw = localStorage.getItem("echo_profile");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { nickname: "Anonymous", avatar: "" };
};

export function useGroupChat(_options?: UseGroupChatOptions) {
  const sessionId = getSessionId();
  const profile = getProfile();
  const myName = profile.nickname || "Anonymous";
  const myAvatar = profile.avatar || "";

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [currentRoom, setCurrentRoom] = useState<GroupRoom | null>(null);
  const [publicRooms, setPublicRooms] = useState<GroupRoom[]>([]);
  const [status, setStatus] = useState<"idle" | "connected">("idle");

  const roomChannelRef = useRef<RealtimeChannel | null>(null);
  const lobbyChannelRef = useRef<RealtimeChannel | null>(null);

  // Join the lobby to discover public rooms
  const joinLobby = useCallback(() => {
    if (lobbyChannelRef.current) return;

    const channel = supabase.channel("group-lobby", {
      config: { presence: { key: sessionId } },
    });

    channel.on("broadcast", { event: "room_announce" }, (payload) => {
      const room = payload.payload as GroupRoom & { action: string };
      setPublicRooms((prev) => {
        if (room.action === "remove") return prev.filter((r) => r.id !== room.id);
        const existing = prev.findIndex((r) => r.id === room.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...room };
          return updated;
        }
        return [...prev, room];
      });
    });

    channel.subscribe();
    lobbyChannelRef.current = channel;

    // Request existing rooms
    setTimeout(() => {
      channel.send({ type: "broadcast", event: "request_rooms", payload: {} });
    }, 500);
  }, [sessionId]);

  // Announce room to lobby
  const announceRoom = useCallback((room: GroupRoom, action: "add" | "update" | "remove") => {
    lobbyChannelRef.current?.send({
      type: "broadcast",
      event: "room_announce",
      payload: { ...room, action },
    });
  }, []);

  // Create a group room
  const createRoom = useCallback((name: string, topic: string, maxMembers: number, isPublic: boolean): string => {
    const code = Array.from({ length: 6 }, () =>
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 31)]
    ).join("");

    const room: GroupRoom = {
      id: code,
      name: name || `${myName}'s Room`,
      topic: topic || "General",
      maxMembers: Math.max(2, Math.min(50, maxMembers)),
      isPublic,
      creatorId: sessionId,
      creatorName: myName,
      memberCount: 0,
      createdAt: new Date(),
    };

    joinRoom(code, room);
    return code;
  }, [sessionId, myName]);

  // Join a group room
  const joinRoom = useCallback((code: string, roomInfo?: GroupRoom) => {
    // Leave existing room
    if (roomChannelRef.current) {
      roomChannelRef.current.unsubscribe();
      roomChannelRef.current = null;
    }

    const channelName = `group-room-${code.toUpperCase()}`;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: sessionId } },
    });

    // Listen for messages
    channel.on("broadcast", { event: "group_msg" }, (payload) => {
      const data = payload.payload as {
        id: string; text: string; imageUrl?: string;
        senderId: string; senderName: string; senderAvatar?: string;
      };
      if (data.senderId === sessionId) return;
      setMessages((prev) => [...prev, {
        id: data.id,
        text: data.text,
        imageUrl: data.imageUrl,
        sender: data.senderId,
        senderName: data.senderName,
        senderAvatar: data.senderAvatar,
        timestamp: new Date(),
        reactions: {},
      }]);
    });

    // Listen for reactions
    channel.on("broadcast", { event: "group_react" }, (payload) => {
      const { messageId, emoji, senderId } = payload.payload as {
        messageId: string; emoji: string; senderId: string;
      };
      if (senderId === sessionId) return;
      setMessages((prev) => prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = { ...m.reactions };
        const users = reactions[emoji] ? [...reactions[emoji]] : [];
        if (users.includes(senderId)) {
          reactions[emoji] = users.filter((u) => u !== senderId);
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji] = [...users, senderId];
        }
        return { ...m, reactions };
      }));
    });

    // Listen for room info updates
    channel.on("broadcast", { event: "room_info" }, (payload) => {
      const info = payload.payload as GroupRoom;
      setCurrentRoom(info);
    });

    // System messages
    channel.on("broadcast", { event: "group_system" }, (payload) => {
      const { text } = payload.payload as { text: string };
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        text,
        sender: "system",
        senderName: "System",
        timestamp: new Date(),
        reactions: {},
      }]);
    });

    // Track presence for members
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const memberList: GroupMember[] = Object.values(state).flat().map((p: any) => ({
        id: p.sessionId,
        name: p.name,
        avatar: p.avatar,
        joinedAt: new Date(p.joinedAt),
      }));
      setMembers(memberList);

      // Update room member count
      setCurrentRoom((prev) => prev ? { ...prev, memberCount: memberList.length } : prev);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          sessionId,
          name: myName,
          avatar: myAvatar,
          joinedAt: new Date().toISOString(),
        });

        const defaultRoom: GroupRoom = roomInfo || {
          id: code.toUpperCase(),
          name: `Room ${code.toUpperCase()}`,
          topic: "General",
          maxMembers: 20,
          isPublic: false,
          creatorId: sessionId,
          creatorName: myName,
          memberCount: 1,
          createdAt: new Date(),
        };

        setCurrentRoom(defaultRoom);
        setStatus("connected");
        setMessages([]);

        // Announce join
        channel.send({
          type: "broadcast",
          event: "group_system",
          payload: { text: `${myName} joined the room` },
        });

        // If creator and public, announce to lobby
        if (roomInfo?.isPublic) {
          announceRoom(defaultRoom, "add");
        }

        // Broadcast room info for new joiners
        if (roomInfo) {
          channel.send({
            type: "broadcast",
            event: "room_info",
            payload: defaultRoom,
          });
        }
      }
    });

    roomChannelRef.current = channel;
  }, [sessionId, myName, myAvatar, announceRoom]);

  // Send a message
  const sendMessage = useCallback((text: string, imageUrl?: string) => {
    if (!roomChannelRef.current || (!text.trim() && !imageUrl)) return;

    const msg: GroupMessage = {
      id: crypto.randomUUID(),
      text: text.trim(),
      imageUrl,
      sender: sessionId,
      senderName: myName,
      senderAvatar: myAvatar,
      timestamp: new Date(),
      reactions: {},
    };

    setMessages((prev) => [...prev, msg]);

    roomChannelRef.current.send({
      type: "broadcast",
      event: "group_msg",
      payload: {
        id: msg.id,
        text: msg.text,
        imageUrl: msg.imageUrl,
        senderId: sessionId,
        senderName: myName,
        senderAvatar: myAvatar,
      },
    });
  }, [sessionId, myName, myAvatar]);

  // React to a message
  const reactToMessage = useCallback((messageId: string, emoji: string) => {
    setMessages((prev) => prev.map((m) => {
      if (m.id !== messageId) return m;
      const reactions = { ...m.reactions };
      const users = reactions[emoji] ? [...reactions[emoji]] : [];
      if (users.includes(sessionId)) {
        reactions[emoji] = users.filter((u) => u !== sessionId);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...users, sessionId];
      }
      return { ...m, reactions };
    }));

    roomChannelRef.current?.send({
      type: "broadcast",
      event: "group_react",
      payload: { messageId, emoji, senderId: sessionId },
    });
  }, [sessionId]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (roomChannelRef.current) {
      roomChannelRef.current.send({
        type: "broadcast",
        event: "group_system",
        payload: { text: `${myName} left the room` },
      });

      if (currentRoom?.isPublic && currentRoom.creatorId === sessionId) {
        announceRoom(currentRoom, "remove");
      }

      roomChannelRef.current.unsubscribe();
      roomChannelRef.current = null;
    }
    setMessages([]);
    setMembers([]);
    setCurrentRoom(null);
    setStatus("idle");
  }, [myName, currentRoom, sessionId, announceRoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      roomChannelRef.current?.unsubscribe();
      lobbyChannelRef.current?.unsubscribe();
    };
  }, []);

  return {
    sessionId,
    myName,
    messages,
    members,
    currentRoom,
    publicRooms,
    status,
    createRoom,
    joinRoom,
    joinLobby,
    sendMessage,
    reactToMessage,
    leaveRoom,
  };
}
