import { useState, useEffect, useRef, useCallback } from "react";
import type { Message } from "@/hooks/use-chat";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ChatStatusBar from "@/components/chat/ChatStatusBar";
import ChatMessageList from "@/components/chat/ChatMessageList";
import ChatInput from "@/components/chat/ChatInput";
import InterestBar from "@/components/chat/InterestBar";
import VideoCallOverlay from "@/components/chat/VideoCallOverlay";
import MatchCelebration from "@/components/chat/MatchCelebration";
import ChatWallpaper from "@/components/chat/ChatWallpaper";
import { useChatContext } from "@/contexts/ChatContext";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { ChatTheme } from "@/components/chat/ChatThemePicker";
import { Button } from "@/components/ui/button";
import { MessageSquare, Zap, Shield, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/use-seo";

const ChatPage = ({ initialRoomCode }: { initialRoomCode?: string } = {}) => {
  const {
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
    inCallMessages, sendInCallMessage,
    supportsScreenShare,
  } = useChatContext();

  useSEO({ 
    title: "Anonymous Text & Video Chat", 
    description: "Start chatting anonymously with strangers on LiveTalk by Likki. No registration, no tracking. Text, video, games and more." 
  });

  const prevStatusRef = useRef(status);
  const [showInterests, setShowInterests] = useState(true);
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [searchHighlight, setSearchHighlight] = useState<string | null>(null);
  const lastAutoJoinCodeRef = useRef<string | null>(null);

  // Auto-join private room from URL/code
  useEffect(() => {
    const storedCode = sessionStorage.getItem("echo_join_room");
    const pendingCode = (initialRoomCode || storedCode || "").toUpperCase();
    if (!pendingCode) return;
    if (lastAutoJoinCodeRef.current === pendingCode) return;

    lastAutoJoinCodeRef.current = pendingCode;
    sessionStorage.removeItem("echo_join_room");
    setShowInterests(false);
    joinPrivateRoom(pendingCode);
  }, [initialRoomCode, joinPrivateRoom]);

  useEffect(() => {
    if (status === "connected" && prevStatusRef.current !== "connected") {
      setShowMatchCelebration(true);
      setTimeout(() => setShowMatchCelebration(false), 4000);
    }
    prevStatusRef.current = status;
  }, [status]);

  const handleStart = useCallback(() => {
    setShowInterests(false);
    startChat();
  }, [startChat]);

  useKeyboardShortcuts({ status, onStart: handleStart, onNext: nextChat, onStop: stopChat });

  const handleImageUpload = (url: string) => {
    sendMessage("", url, replyingTo ? { id: replyingTo.id, text: replyingTo.text, sender: replyingTo.sender } : undefined);
    setReplyingTo(null);
  };

  const handleThemeChange = useCallback((theme: ChatTheme) => {
    const root = document.documentElement;
    root.style.setProperty("--bubble-you", theme.you);
    root.style.setProperty("--bubble-you-foreground", theme.youFg);
    root.style.setProperty("--bubble-stranger", theme.stranger);
    root.style.setProperty("--bubble-stranger-foreground", theme.strangerFg);
  }, []);

  const handleForwardMessage = useCallback((msg: Message) => {
    navigator.clipboard.writeText(msg.text || "📷 Image");
  }, []);

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
        onVideoCall={() => startCall(false)}
        onAudioCall={() => startCall(true)}
        isVideoCallActive={callStatus !== "idle"}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        disappearTimer={disappearTimer}
        onSetDisappearTimer={setDisappearTimer}
        onSearchResult={setSearchHighlight}
        onThemeChange={handleThemeChange}
      />

      <InterestBar
        interests={interests}
        onChangeInterests={setInterests}
        showSelector={showInterests}
        isIdle={status === "idle"}
        isActive={status !== "idle" && !showInterests}
      />

      {status === "idle" ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <Button
              variant="glow"
              size="lg"
              onClick={handleStart}
              className="h-14 px-10 text-lg font-semibold rounded-2xl gap-2 shadow-xl shadow-primary/20"
            >
              Start Chat <ArrowRight className="h-5 w-5" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-2 text-center max-w-xs"
          >
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">How it works</p>
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground/70">
              <span className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-primary/60 shrink-0" /> Press Start → get matched instantly</span>
              <span className="flex items-center gap-1.5"><MessageSquare className="h-3 w-3 text-primary/60 shrink-0" /> Chat via text, images, or video</span>
              <span className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-primary/60 shrink-0" /> 100% anonymous · no data saved</span>
            </div>
          </motion.div>
        </div>
      ) : (
        <ChatMessageList
          messages={messages}
          strangerTyping={strangerTyping}
          strangerTypingText={strangerTypingText}
          onReact={reactToMessage}
          onReply={(msg) => setReplyingTo(msg)}
          onDelete={deleteMessage}
          onPin={pinMessage}
          onForward={handleForwardMessage}
          disappearTimer={disappearTimer}
          highlightMessageId={searchHighlight}
        />
      )}

      <ChatInput
        status={status}
        onSend={sendMessage}
        onImageUpload={handleImageUpload}
        onTyping={sendTyping}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        roomChannel={roomChannel}
        sessionId={sessionId}
        hasMessages={messages.length > 0}
      />

      <VideoCallOverlay
        callStatus={callStatus}
        isAudioOnly={isAudioOnly}
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        remoteIsScreenSharing={remoteIsScreenSharing}
        isBlurred={isBlurred}
        facingMode={facingMode}
        remoteMuted={remoteMuted}
        remoteCameraOff={remoteCameraOff}
        remoteBlurred={remoteBlurred}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onEndCall={endCall}
        onAccept={acceptCall}
        onDecline={declineCall}
        onFlipCamera={flipCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleBlur={toggleBlur}
        onUpgradeToVideo={upgradeToVideo}
        onSendInCallMessage={sendInCallMessage}
        inCallMessages={inCallMessages}
        supportsScreenShare={supportsScreenShare}
      />

      <MatchCelebration
        show={showMatchCelebration}
        matchedInterests={matchedInterests}
        onDismiss={() => setShowMatchCelebration(false)}
      />

      <BottomNav />
    </div>
  );
};

export default ChatPage;
