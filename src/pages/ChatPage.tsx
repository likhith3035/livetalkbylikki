import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ChatStatusBar from "@/components/chat/ChatStatusBar";
import ChatMessageList from "@/components/chat/ChatMessageList";
import ChatInput from "@/components/chat/ChatInput";
import InterestBar from "@/components/chat/InterestBar";
import VideoCallOverlay from "@/components/chat/VideoCallOverlay";
import { useChat } from "@/hooks/use-chat";
import { useVideoCall } from "@/hooks/use-video-call";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/hooks/use-toast";

const ChatPage = () => {
  const { toast } = useToast();
  const { settings } = useSettings();
  const signalingHandlerRef = useRef<((event: string, payload: Record<string, unknown>) => void) | null>(null);

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
    autoReconnectCountdown, sessionId, roomChannel,
    setInterests, startChat, sendMessage, sendTyping, nextChat, stopChat,
    reactToMessage, blockStranger,
  } = useChat(chatCallbacks);

  const onCallEnded = useCallback(() => {
    toast({ title: "📞 Call ended", description: "Video call has ended." });
  }, [toast]);

  const {
    callStatus, localStream, remoteStream, isMuted, isCameraOff,
    startCall, acceptCall, declineCall, endCall,
    toggleMute, toggleCamera, handleSignalingEvent, cleanup,
  } = useVideoCall({ sessionId, channel: roomChannel, onCallEnded });

  // Wire signaling handler
  useEffect(() => {
    signalingHandlerRef.current = handleSignalingEvent;
  }, [handleSignalingEvent]);

  // Cleanup video on disconnect
  useEffect(() => {
    if (status !== "connected" && callStatus !== "idle") {
      cleanup();
    }
  }, [status, callStatus, cleanup]);

  const prevStatusRef = useRef(status);
  const [showInterests, setShowInterests] = useState(true);

  useEffect(() => {
    if (status === "connected" && prevStatusRef.current !== "connected") {
      toast({
        title: "🟢 Connected!",
        description: "You're matched with a stranger. Let's chat!",
      });
    }
    prevStatusRef.current = status;
  }, [status, toast]);

  const handleStart = () => {
    setShowInterests(false);
    startChat();
  };

  const handleImageUpload = (url: string) => {
    sendMessage("", url);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Header onlineCount={onlineCount} />

      <ChatStatusBar
        status={status}
        matchedInterests={matchedInterests}
        autoReconnectCountdown={autoReconnectCountdown}
        onToggleInterests={() => setShowInterests(!showInterests)}
        showInterests={showInterests}
        onNext={nextChat}
        onStop={stopChat}
        onStart={handleStart}
        onBlock={blockStranger}
        onVideoCall={startCall}
        isVideoCallActive={callStatus !== "idle"}
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
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onEndCall={endCall}
        onAccept={acceptCall}
        onDecline={declineCall}
      />

      <BottomNav />
    </div>
  );
};

export default ChatPage;
