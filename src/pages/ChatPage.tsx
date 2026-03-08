import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ChatStatusBar from "@/components/chat/ChatStatusBar";
import ChatMessageList from "@/components/chat/ChatMessageList";
import ChatInput from "@/components/chat/ChatInput";
import InterestBar from "@/components/chat/InterestBar";
import VideoCallOverlay from "@/components/chat/VideoCallOverlay";
import MatchCelebration from "@/components/chat/MatchCelebration";
import ChatWallpaper from "@/components/chat/ChatWallpaper";
import { useChat } from "@/hooks/use-chat";
import { useVideoCall } from "@/hooks/use-video-call";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

interface InCallMessage {
  id: string;
  text: string;
  sender: "you" | "stranger";
  timestamp: Date;
}

const ChatPage = () => {
  const { toast } = useToast();
  const { settings } = useSettings();
  const signalingHandlerRef = useRef<((event: string, payload: Record<string, unknown>) => void) | null>(null);
  const [inCallMessages, setInCallMessages] = useState<InCallMessage[]>([]);

  const chatCallbacks = useMemo(() => ({
    soundEnabled: settings.soundEffects,
    notificationsEnabled: settings.notifications,
    autoReconnect: true,
    onSignaling: (event: string, payload: Record<string, unknown>) => {
      signalingHandlerRef.current?.(event, payload);
    },
  }), [settings.soundEffects, settings.notifications]);

  const {
    messages, status, onlineCount, interests, matchedInterests, strangerTyping,
    autoReconnectCountdown, sessionId, roomChannel, searchElapsed,
    setInterests, startChat, sendMessage, sendTyping, nextChat, stopChat,
    reactToMessage, blockStranger, createPrivateRoom, joinPrivateRoom,
  } = useChat(chatCallbacks);

  const onCallEnded = useCallback(() => {
    toast({ title: "📞 Call ended", description: "Video call has ended." });
    setInCallMessages([]);
  }, [toast]);

  const {
    callStatus, localStream, remoteStream, isMuted, isCameraOff,
    isScreenSharing, remoteIsScreenSharing, isBlurred, facingMode,
    startCall, acceptCall, declineCall, endCall,
    toggleMute, toggleCamera, flipCamera, toggleScreenShare, toggleBlur,
    handleSignalingEvent, cleanup,
  } = useVideoCall({ sessionId, channel: roomChannel, onCallEnded });

  // Handle in-call chat messages via the room channel
  useEffect(() => {
    if (!roomChannel) return;
    const handler = roomChannel.on("broadcast", { event: "incall_chat" }, (payload) => {
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
    return () => {
      // Channel cleanup handled by useChat
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
    signalingHandlerRef.current = handleSignalingEvent;
  }, [handleSignalingEvent]);

  useEffect(() => {
    if (status !== "connected" && callStatus !== "idle") {
      cleanup();
      setInCallMessages([]);
    }
  }, [status, callStatus, cleanup]);

  // Auto-join private room from URL
  const joinedRoomRef = useRef(false);
  useEffect(() => {
    if (joinedRoomRef.current) return;
    const pendingCode = sessionStorage.getItem("echo_join_room");
    if (pendingCode && status === "idle") {
      joinedRoomRef.current = true;
      sessionStorage.removeItem("echo_join_room");
      joinPrivateRoom(pendingCode);
    }
  }, [status, joinPrivateRoom]);

  const prevStatusRef = useRef(status);
  const [showInterests, setShowInterests] = useState(true);
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);

  useEffect(() => {
    if (status === "connected" && prevStatusRef.current !== "connected") {
      setShowMatchCelebration(true);
      setTimeout(() => setShowMatchCelebration(false), 2500);
    }
    prevStatusRef.current = status;
  }, [status]);

  const handleStart = useCallback(() => {
    setShowInterests(false);
    startChat();
  }, [startChat]);

  useKeyboardShortcuts({ status, onStart: handleStart, onNext: nextChat, onStop: stopChat });

  const handleImageUpload = (url: string) => {
    sendMessage("", url);
  };

  const handleCreateRoom = (): string => {
    setShowInterests(false);
    return createPrivateRoom();
  };

  const handleJoinRoom = (code: string) => {
    setShowInterests(false);
    joinPrivateRoom(code);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative z-0">
      <ChatWallpaper />
      <div className="lg:hidden">
        <Header onlineCount={onlineCount} />
      </div>

      <ChatStatusBar
        status={status}
        matchedInterests={matchedInterests}
        autoReconnectCountdown={autoReconnectCountdown}
        searchElapsed={searchElapsed}
        messages={messages}
        onToggleInterests={() => setShowInterests(!showInterests)}
        showInterests={showInterests}
        onNext={nextChat}
        onStop={stopChat}
        onStart={handleStart}
        onBlock={blockStranger}
        onVideoCall={startCall}
        isVideoCallActive={callStatus !== "idle"}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />

      <InterestBar
        interests={interests}
        onChangeInterests={setInterests}
        showSelector={showInterests}
        isIdle={status === "idle"}
        isActive={status !== "idle" && !showInterests}
      />

      <ChatMessageList
        messages={messages}
        strangerTyping={strangerTyping}
        onReact={reactToMessage}
      />

      <ChatInput
        status={status}
        onSend={sendMessage}
        onImageUpload={handleImageUpload}
        onTyping={sendTyping}
      />

      <VideoCallOverlay
        callStatus={callStatus}
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        remoteIsScreenSharing={remoteIsScreenSharing}
        isBlurred={isBlurred}
        facingMode={facingMode}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onEndCall={endCall}
        onAccept={acceptCall}
        onDecline={declineCall}
        onFlipCamera={flipCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleBlur={toggleBlur}
        onSendInCallMessage={sendInCallMessage}
        inCallMessages={inCallMessages}
      />

      <MatchCelebration show={showMatchCelebration} matchedInterests={matchedInterests} />

      <BottomNav />
    </div>
  );
};

export default ChatPage;
