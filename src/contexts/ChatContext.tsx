import { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useChat, type ChatStatus, type Message } from "@/hooks/use-chat";
import { useVideoCall } from "@/hooks/use-video-call";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import type { ChatTheme } from "@/components/chat/ChatThemePicker";

interface InCallMessage {
  id: string;
  text: string;
  sender: "you" | "stranger";
  timestamp: Date;
}

interface ChatContextValue {
  // Chat state
  messages: Message[];
  status: ChatStatus;
  onlineCount: number;
  interests: string[];
  matchedInterests: string[];
  strangerTyping: boolean;
  strangerTypingText: string | undefined;
  autoReconnectCountdown: number | null;
  sessionId: string;
  roomChannel: ReturnType<typeof useChat>["roomChannel"];
  searchElapsed: number;
  disappearTimer: number | null;
  userName: string;
  setUserName: (n: string) => void;
  strangerName: string;

  // Chat actions
  setInterests: (i: string[]) => void;
  startChat: () => void;
  sendMessage: (text: string, imageUrl?: string, replyTo?: Message["replyTo"]) => void;
  sendTyping: (text?: string) => void;
  nextChat: () => void;
  stopChat: () => void;
  reactToMessage: (messageId: string, emoji: string) => void;
  blockStranger: () => void;
  createPrivateRoom: () => string;
  joinPrivateRoom: (code: string) => void;
  deleteMessage: (messageId: string) => void;
  pinMessage: (messageId: string) => void;
  setDisappearTimer: (t: number | null) => void;
  reportStranger: (reason: string) => void;
  stableId: string;

  // Video call state
  callStatus: ReturnType<typeof useVideoCall>["callStatus"];
  isAudioOnly: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  remoteIsScreenSharing: boolean;
  isBlurred: boolean;
  facingMode: "user" | "environment";
  remoteMuted: boolean;
  remoteCameraOff: boolean;
  remoteBlurred: boolean;
  supportsScreenShare: boolean;
  surpriseEffect: { type: string; id: number } | null;

  // Video call actions
  startCall: (audioOnly: boolean) => void;
  acceptCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  flipCamera: () => void;
  toggleScreenShare: () => void;
  toggleBlur: () => void;
  upgradeToVideo: () => void;
  sendSurprise: (type: string) => void;

  // In-call chat
  inCallMessages: InCallMessage[];
  sendInCallMessage: (text: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const useChatContext = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
};

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const { settings } = useSettings();
  const location = useLocation();
  const signalingHandlerRef = useRef<((event: string, payload: Record<string, unknown>) => void) | null>(null);
  const [inCallMessages, setInCallMessages] = useState<InCallMessage[]>([]);
  const prevMessageCountRef = useRef(0);

  const chatCallbacks = useMemo(() => ({
    soundEnabled: settings.soundEffects,
    notificationsEnabled: settings.notifications,
    autoReconnect: true,
    onSignaling: (event: string, payload: Record<string, unknown>) => {
      signalingHandlerRef.current?.(event, payload);
    },
  }), [settings.soundEffects, settings.notifications]);

  const chatHook = useChat(chatCallbacks);

  const {
    messages, status, onlineCount, interests, matchedInterests, strangerTyping, strangerTypingText,
    autoReconnectCountdown, sessionId, roomChannel, searchElapsed,
    setInterests, startChat, sendMessage, sendTyping, nextChat, stopChat,
    reactToMessage, blockStranger, createPrivateRoom, joinPrivateRoom,
    deleteMessage, pinMessage, disappearTimer, setDisappearTimer,
    sendSignalingEvent, reportStranger, stableId,
    userName, setUserName, strangerName,
  } = chatHook;

  const onCallEnded = useCallback(() => {
    console.log("ChatContext: Call ended");
    toast({ title: "📞 Call ended", description: "Video call session has closed." });
    setInCallMessages([]);
  }, [toast]);

  const onCallUpgraded = useCallback(() => {
    console.log("ChatContext: Call upgraded to video");
    toast({ title: "🎥 Upgraded to video", description: "The call has been upgraded to video." });
  }, [toast]);

  const {
    callStatus, isAudioOnly, localStream, remoteStream, isMuted, isCameraOff,
    isScreenSharing, remoteIsScreenSharing, isBlurred, facingMode,
    remoteMuted, remoteCameraOff, remoteBlurred,
    startCall, acceptCall, declineCall, endCall,
    toggleMute, toggleCamera, flipCamera, toggleScreenShare, toggleBlur,
    upgradeToVideo,
    handleSignalingEvent, cleanup,
    supportsScreenShare,
  } = useVideoCall({ 
    sessionId, 
    sendSignalingEvent, 
    onCallEnded, 
    onCallUpgraded 
  });

  // Signaling handler with error boundary
  const safeHandleSignaling = useCallback(async (event: string, payload: Record<string, unknown>) => {
    try {
      await handleSignalingEvent(event, payload);
    } catch (error) {
      console.error(`ChatContext: Signaling error for event ${event}:`, error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to establish video connection. Please try again.",
      });
      cleanup();
    }
  }, [handleSignalingEvent, cleanup, toast]);

  // Handle in-call chat messages via the room channel (Supabase)
  useEffect(() => {
    if (!roomChannel) return;
    roomChannel.on("broadcast", { event: "incall_chat" }, (payload) => {
      const data = payload.payload as { senderId: string; text: string };
      if (data.senderId !== sessionId) {
        setInCallMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          text: data.text,
          sender: "stranger",
          timestamp: new Date(),
        }]);
      }
    });
  }, [roomChannel, sessionId]);

  const sendInCallMessage = useCallback((text: string) => {
    if (!roomChannel) return;
    setInCallMessages((prev) => [...prev, {
      id: crypto.randomUUID(),
      text,
      sender: "you",
      timestamp: new Date(),
    }]);
    roomChannel.send({
      type: "broadcast",
      event: "incall_chat",
      payload: { senderId: sessionId, text },
    });
  }, [roomChannel, sessionId]);

  useEffect(() => {
    signalingHandlerRef.current = safeHandleSignaling;
  }, [safeHandleSignaling]);

  useEffect(() => {
    if (status !== "connected" && callStatus !== "idle") {
      cleanup();
      setInCallMessages([]);
    }
  }, [status, callStatus, cleanup]);

  // Show toast notification when stranger sends a message and user is NOT on /chat page
  useEffect(() => {
    if (location.pathname === "/chat") {
      prevMessageCountRef.current = messages.length;
      return;
    }

    if (messages.length > prevMessageCountRef.current && status === "connected") {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.sender === "stranger") {
        toast({
          title: "💬 New message from Stranger",
          description: lastMsg.text?.slice(0, 80) || "📷 Sent an image",
        });
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, location.pathname, status, toast]);

  const value: ChatContextValue = {
    messages, status, onlineCount, interests, matchedInterests, strangerTyping, strangerTypingText,
    autoReconnectCountdown, sessionId, roomChannel, searchElapsed, disappearTimer,
    setInterests, startChat, sendMessage, sendTyping, nextChat, stopChat,
    reactToMessage, blockStranger, createPrivateRoom, joinPrivateRoom,
    deleteMessage, pinMessage, setDisappearTimer,
    callStatus, isAudioOnly, localStream, remoteStream, isMuted, isCameraOff,
    isScreenSharing, remoteIsScreenSharing, isBlurred, facingMode,
    remoteMuted, remoteCameraOff, remoteBlurred,
    startCall, acceptCall, declineCall, endCall,
    toggleMute, toggleCamera, flipCamera, toggleScreenShare, toggleBlur,
    upgradeToVideo,
    sendSurprise,
    surpriseEffect,
    inCallMessages, sendInCallMessage,
    supportsScreenShare,
    reportStranger, stableId,
    userName, setUserName, strangerName,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
