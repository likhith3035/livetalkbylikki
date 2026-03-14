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
import { MessageSquare, Zap, Shield, ArrowRight, X } from "lucide-react";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/use-seo";
import { BrandLogo } from "@/components/BrandLogo";

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
    description: "Start chatting anonymously with strangers on LiveTalk by Likki. No registration, no tracking. Text, video, games and more. Connect instantly with random people for text, image, or video conversations.",
    keywords: "random chat, video chat, chat with strangers, anonymous video chat, talk to strangers online, Omegle alternative chat, free online chat, instant chat, stranger chat, live talk, likki chat"
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
      ) : status === "searching" ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-10 relative overflow-hidden">
          {/* Premium Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.05, 0.15, 0.05],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]"
            />
            {/* Radar Scan Effect */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.03]"
              style={{
                background: "conic-gradient(from 0deg, var(--primary) 0deg, transparent 90deg)",
                borderRadius: "50%",
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 relative z-10"
          >
            {/* Modern Searching Animation */}
            <div className="relative flex items-center justify-center">
              {/* Outer Glow */}
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full scale-75"
              />
              
              {/* Orbital Rings */}
              <div className="relative h-40 w-40 sm:h-48 sm:w-48">
                {/* Ring 1 - Outer Slow */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-dashed border-primary/20"
                />
                
                {/* Ring 2 - Middle Fast */}
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 rounded-full border-2 border-primary/10 border-t-primary/60"
                />
                
                {/* Ring 3 - Inner Pulse */}
                <motion.div 
                  animate={{ 
                    scale: [0.8, 1, 0.8],
                    borderColor: ["rgba(var(--primary-rgb), 0.1)", "rgba(var(--primary-rgb), 0.4)", "rgba(var(--primary-rgb), 0.1)"]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-8 rounded-full border-4 border-primary/30"
                />

                {/* Center Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="relative"
                  >
                    <BrandLogo className="h-12 w-12 sm:h-16 sm:w-16 drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                  </motion.div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <motion.h2 
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-3xl sm:text-5xl font-bold font-display text-foreground tracking-tight"
              >
                Finding a match<span className="text-primary animate-pulse">...</span>
              </motion.h2>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm sm:text-base text-muted-foreground font-medium flex items-center justify-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-online animate-ping" />
                  {searchElapsed}s searching
                </p>
                <div className="h-1 w-32 bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="h-full w-full bg-gradient-to-r from-transparent via-primary to-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 items-center">
              <Button
                variant="danger"
                size="lg"
                onClick={stopChat}
                className="h-14 sm:h-16 px-12 sm:px-14 text-lg sm:text-xl font-bold rounded-[2rem] gap-3 shadow-[0_0_40px_rgba(var(--destructive-rgb),0.2)] hover:shadow-[0_0_60px_rgba(var(--destructive-rgb),0.3)] active:scale-95 transition-all text-destructive-foreground hover:bg-destructive"
              >
                <X className="h-6 w-6" />
                Stop Search
              </Button>
              
              {interests.length > 0 && (
                <div className="bg-card/30 backdrop-blur-md border border-border/50 p-4 rounded-2xl flex flex-wrap justify-center gap-2 max-w-sm">
                  <p className="w-full text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Targeting Interests</p>
                  {interests.map((i) => (
                    <span key={i} className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold rounded-full">
                      #{i}
                    </span>
                  ))}
                </div>
              )}
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
