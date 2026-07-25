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
  roomId: string | null;
  roomChannel: ReturnType<typeof useChat>["roomChannel"];
  searchElapsed: number;
  disappearTimer: number | null;
  userName: string;
  setUserName: (n: string) => void;
  strangerName: string;
  strangerAvatar: string;
  strangerMood: string;

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
  joinPrivateRoom: (code: string, isCreator?: boolean) => void;
  joinRoomById: (roomId: string) => void;
  deleteMessage: (messageId: string) => void;
  pinMessage: (messageId: string) => void;
  setDisappearTimer: (t: number | null) => void;
  reportStranger: (reason: string) => void;
  stableId: string;
  addMessage: ReturnType<typeof useChat>["addMessage"];
  privateRoomCode: string | null;
  sendSignalingEvent: ReturnType<typeof useChat>["sendSignalingEvent"];
  /** Wire the cross-device sync signaling handler so it receives Firebase events */
  registerCrossDeviceSignaling: (handler: (event: string, payload: Record<string, unknown>) => void) => void;

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
  stats: ReturnType<typeof useVideoCall>["stats"];
  audioOutput: ReturnType<typeof useVideoCall>["audioOutput"];
  toggleAudioOutput: ReturnType<typeof useVideoCall>["toggleAudioOutput"];
  isPiPActive: boolean;
  supportsPiP: boolean;

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
  togglePictureInPicture: (videoElement?: HTMLVideoElement | null) => void;

  // In-call chat
  inCallMessages: InCallMessage[];
  sendInCallMessage: (text: string) => void;

  // Protection state & actions
  localPrivacyModeActive: boolean;
  strangerPrivacyModeActive: boolean;
  privacyModeActive: boolean;
  privacyAlertActive: boolean;
  togglePrivacyMode: (val?: boolean) => void;
  sendPrivacyAlert: (type: string) => void;
  privacyLogs: string[];
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
    toast,
  }), [settings.soundEffects, settings.notifications, toast]);

  const chatHook = useChat(chatCallbacks);

  const {
    messages, status, onlineCount, interests, matchedInterests, strangerTyping, strangerTypingText,
    autoReconnectCountdown, sessionId, roomChannel, searchElapsed,
    setInterests, startChat, sendMessage, sendTyping, nextChat, stopChat,
    reactToMessage, blockStranger, createPrivateRoom, joinPrivateRoom, joinRoomById,
    deleteMessage, pinMessage, disappearTimer, setDisappearTimer,
    sendSignalingEvent, reportStranger, stableId,
    userName, setUserName, strangerName, strangerAvatar, strangerMood, addMessage,
    privateRoomCode, roomId,
  } = chatHook;

  const [localPrivacyModeActive, setLocalPrivacyModeActive] = useState(false);
  const [strangerPrivacyModeActive, setStrangerPrivacyModeActive] = useState(false);
  const [privacyAlertActive, setPrivacyAlertActive] = useState(false);
  const [privacyLogs, setPrivacyLogs] = useState<string[]>([]);
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const privacyModeActive = localPrivacyModeActive || strangerPrivacyModeActive;

  const togglePrivacyMode = useCallback((val?: boolean) => {
    const newVal = val !== undefined ? val : !localPrivacyModeActive;
    setLocalPrivacyModeActive(newVal);
    setPrivacyLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Local Privacy Mode ${newVal ? "Enabled" : "Disabled"}`]);
    
    // Add inline system message about active settings
    if (newVal) {
      addMessage("system", "🔒 Privacy Mode is active. Screenshots and screen recordings are discouraged and may trigger alerts.");
    } else {
      addMessage("system", "🔓 You disabled Privacy Mode.");
    }

    roomChannel?.send({
      type: "broadcast",
      event: "privacy_mode_change",
      payload: { senderId: sessionId, enabled: newVal }
    });
  }, [localPrivacyModeActive, roomChannel, sessionId, addMessage]);

  const sendPrivacyAlert = useCallback((type: string) => {
    setPrivacyLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Local capture detected: ${type}`]);
    
    // Set local alert active to trigger UI overlays/blurs
    setPrivacyAlertActive(true);
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    alertTimeoutRef.current = setTimeout(() => setPrivacyAlertActive(false), 3000);

    // Notify peer via signaling channel
    if (settings.notifyAlerts) {
      roomChannel?.send({
        type: "broadcast",
        event: "privacy_alert",
        payload: { senderId: sessionId, username: userName || "Stranger", type }
      });
    }
  }, [roomChannel, sessionId, userName, settings.notifyAlerts]);

  // Sync privacy mode events in real-time
  useEffect(() => {
    if (!roomChannel) {
      setLocalPrivacyModeActive(false);
      setStrangerPrivacyModeActive(false);
      setPrivacyAlertActive(false);
      setPrivacyLogs([]);
      return;
    }

    const onPrivacyModeChange = (payload: any) => {
      const data = payload.payload as { senderId: string; enabled: boolean };
      if (data.senderId !== sessionId) {
        setStrangerPrivacyModeActive(data.enabled);
        setPrivacyLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] peer Privacy Mode ${data.enabled ? "enabled" : "disabled"}`]);
        
        toast({
          title: data.enabled ? "🛡️ Privacy Mode Enabled" : "🛡️ Privacy Mode Disabled",
          description: data.enabled
            ? `${strangerName || "Stranger"} enabled Privacy Mode.`
            : `${strangerName || "Stranger"} disabled Privacy Mode.`,
        });

        // Appending warning/info system messages to chat history
        if (data.enabled) {
          addMessage("system", `🔒 Privacy Mode is active. Screenshots and screen recordings are discouraged and may trigger alerts.`);
        } else {
          addMessage("system", `🔓 ${strangerName || "Stranger"} disabled Privacy Mode.`);
        }
      }
    };

    const onPrivacyAlert = (payload: any) => {
      const data = payload.payload as { senderId: string; username: string; type: string };
      if (data.senderId !== sessionId) {
        setPrivacyLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Peer attempted screen capture: ${data.type}`]);
        
        // Show mutual warning modal
        setPrivacyAlertActive(true);
        if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
        alertTimeoutRef.current = setTimeout(() => setPrivacyAlertActive(false), 3000);

        addMessage("system", `⚠️ Possible screenshot or screen recording detected!`);

        toast({
          variant: "destructive",
          title: "⚠️ Privacy Alert",
          description: "Possible screenshot or screen recording detected",
        });
      }
    };

    roomChannel.on("broadcast", { event: "privacy_mode_change" }, onPrivacyModeChange);
    roomChannel.on("broadcast", { event: "privacy_alert" }, onPrivacyAlert);

    return () => {
      roomChannel.off?.("broadcast", { event: "privacy_mode_change" });
      roomChannel.off?.("broadcast", { event: "privacy_alert" });
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, [roomChannel, sessionId, strangerName, toast, addMessage]);

  useEffect(() => {
    if (status !== "connected") {
      setLocalPrivacyModeActive(false);
      setStrangerPrivacyModeActive(false);
      setPrivacyAlertActive(false);
      setPrivacyLogs([]);
    }
  }, [status]);

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
    isScreenSharing, remoteIsScreenSharing, isBlurred, isReconnecting, facingMode,
    remoteMuted, remoteCameraOff, remoteBlurred,
    startCall, acceptCall, declineCall, endCall,
    toggleMute, toggleCamera, flipCamera, toggleScreenShare, toggleBlur,
    upgradeToVideo,
    sendSurprise,
    surpriseEffect,
    handleSignalingEvent, cleanup,
    supportsScreenShare,
    stats,
    audioOutput,
    toggleAudioOutput,
    isPiPActive,
    togglePictureInPicture,
    supportsPiP,
  } = useVideoCall({ 
    sessionId, 
    sendSignalingEvent, 
    onCallEnded, 
    onCallUpgraded 
  });

  // Cross-device sync signaling handler — set from ChatPage via ref
  const crossDeviceSignalingRef = useRef<((event: string, payload: Record<string, unknown>) => void) | null>(null);

  // Signaling handler with error boundary — dispatches to video call AND cross-device sync
  const safeHandleSignaling = useCallback(async (event: string, payload: Record<string, unknown>) => {
    // Forward to cross-device sync handler first (non-throwing)
    try {
      crossDeviceSignalingRef.current?.(event, payload);
    } catch (err) {
      console.warn("[ChatContext] crossDevice signaling error:", err);
    }
    // Forward to video call handler
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
    const handleInCallChat = (payload: any) => {
      const data = payload.payload as { senderId: string; text: string };
      if (data.senderId !== sessionId) {
        setInCallMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          text: data.text,
          sender: "stranger",
          timestamp: new Date(),
        }]);
      }
    };
    roomChannel.on("broadcast", { event: "incall_chat" }, handleInCallChat);
    return () => {
      roomChannel.off?.("broadcast", { event: "incall_chat" });
    };
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
    autoReconnectCountdown, sessionId, roomId, roomChannel, searchElapsed, disappearTimer,
    setInterests, startChat, sendMessage, sendTyping, nextChat, stopChat,
    reactToMessage, blockStranger, createPrivateRoom, joinPrivateRoom, joinRoomById,
    deleteMessage, pinMessage, setDisappearTimer,
    privateRoomCode, sendSignalingEvent,
    callStatus, isAudioOnly, localStream, remoteStream, isMuted, isCameraOff,
    isScreenSharing, remoteIsScreenSharing, isBlurred, isReconnecting, facingMode,
    remoteMuted, remoteCameraOff, remoteBlurred,
    startCall, acceptCall, declineCall, endCall,
    toggleMute, toggleCamera, flipCamera, toggleScreenShare, toggleBlur,
    upgradeToVideo,
    sendSurprise,
    surpriseEffect,
    stats,
    audioOutput,
    toggleAudioOutput,
    isPiPActive,
    togglePictureInPicture,
    supportsPiP,
    inCallMessages, sendInCallMessage,
    supportsScreenShare,
    reportStranger, stableId,
    userName, setUserName, strangerName, strangerAvatar, strangerMood,
    localPrivacyModeActive,
    strangerPrivacyModeActive,
    privacyModeActive,
    privacyAlertActive,
    togglePrivacyMode,
    sendPrivacyAlert,
    privacyLogs,
    addMessage,
    registerCrossDeviceSignaling: (handler) => { crossDeviceSignalingRef.current = handler; },
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
