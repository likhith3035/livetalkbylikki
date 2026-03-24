import { useState, useEffect, useRef, useCallback } from "react";
import type { Message } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
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
import { MessageSquare, Zap, Shield, ArrowRight, X, AlertTriangle, Send, Dices, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSafety } from "@/hooks/use-safety";
import { motion, AnimatePresence } from "framer-motion";
import { useSEO } from "@/hooks/use-seo";
import { BrandLogo } from "@/components/BrandLogo";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { FindingAnimation } from "@/components/chat/FindingAnimation";
import SharedCanvas from "@/components/chat/SharedCanvas";
import { useSoundNotifications } from "@/hooks/use-sound-notifications";

const RANDOM_NICKNAMES = [
  "Starlight", "Shadow", "Neon", "Cyber", "Mystic", "Echo", "Zenith", "Pixel", 
  "Rogue", "Ghost", "Glitch", "Aura", "Nova", "Flux", "Swift", "Cosmic", 
  "Blaze", "Vortex", "Luna", "Titan", "Solar", "Orion", "Jade", "Ruby",
  "Phoenix", "Raven", "Skye", "Storm", "Aqua", "Crystal", "Pulse"
];

const ChatPage = ({ initialRoomCode }: { initialRoomCode?: string } = {}) => {
  const {
    messages, status, onlineCount, interests, matchedInterests, strangerTyping, strangerTypingText,
    deleteMessage, pinMessage, disappearTimer, setDisappearTimer,
    userName, setUserName, strangerName,
    callStatus, isAudioOnly, localStream, remoteStream, isMuted, isCameraOff,
    isScreenSharing, remoteIsScreenSharing, isBlurred, facingMode,
    remoteMuted, remoteCameraOff, remoteBlurred,
    startCall, acceptCall, declineCall, endCall,
    toggleMute, toggleCamera, flipCamera, toggleScreenShare, toggleBlur,
    upgradeToVideo,
    inCallMessages, sendInCallMessage,
    supportsScreenShare, 
    autoReconnectCountdown, sessionId, stableId, roomChannel, searchElapsed,
    setInterests, startChat, sendMessage, sendTyping, nextChat, stopChat,
    reactToMessage, blockStranger, createPrivateRoom, joinPrivateRoom,
  } = useChatContext();

  const { isBanned, submitAppeal } = useSafety();
  const { toast } = useToast();
  const { settings } = useSettings();
  const { playConnect, playDisconnect } = useSoundNotifications();
  const [appealReason, setAppealReason] = useState("");
  const [appealSent, setAppealSent] = useState(false);
  const banned = isBanned(stableId);

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
  const [tempName, setTempName] = useState("");
  const [activeGame, setActiveGame] = useState<"none" | "ttt" | "canvas">("none");
  const lastAutoJoinCodeRef = useRef<string | null>(null);

  // Auto-join private room from URL/code
  useEffect(() => {
    const savedName = localStorage.getItem("livetalk_user_name");
    if (savedName) setUserName(savedName);

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
      playConnect();
    }
    if (status === "idle" && prevStatusRef.current === "connected") {
      playDisconnect();
    }
    prevStatusRef.current = status;
  }, [status, playConnect, playDisconnect]);

  const handleSaveName = (name: string) => {
    const trimmed = name.trim().slice(0, 15);
    if (trimmed) {
      setUserName(trimmed);
      localStorage.setItem("livetalk_user_name", trimmed);
      toast({ title: "Welcome!", description: `You are now known as ${trimmed}` });
    }
  };

  const handleRandomName = () => {
    const randomName = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
    setTempName(randomName);
  };

  const handleStart = useCallback(() => {
    if (!userName) return;
    setShowInterests(false);
    startChat();
  }, [startChat, userName]);

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

  const handleAppealSubmit = async () => {
    if (!appealReason.trim()) return;
    try {
      await submitAppeal(stableId, appealReason.trim());
      setAppealSent(true);
      toast({
        title: "Appeal Received",
        description: "Your appeal has been submitted for review.",
      });
    } catch (error: any) {
      console.error("Appeal submission error:", error);
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "Could not send appeal. Check your connection.",
      });
    }
  };

  if (banned) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#09090B] px-6 text-center">
        <ChatWallpaper opacity={0.3} />
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="relative z-10 space-y-8 max-w-sm w-full"
        >
          <div className="mx-auto h-20 w-20 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive animate-pulse">
            <AlertTriangle className="h-10 w-10" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-black font-display tracking-tight text-white uppercase italic">
              You cross limits
            </h1>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed">
              Your account has been blacklisted for community guideline violations. You cannot access chat features at this time.
            </p>
          </div>

          {!appealSent ? (
            <div className="space-y-4 pt-4">
              <div className="relative">
                <Input 
                  placeholder="Enter reason for unbanning..."
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  className="h-14 bg-white/5 border-white/10 text-white rounded-2xl pr-12 focus:border-primary/50 transition-all font-medium text-sm"
                />
                <Button 
                   onClick={handleAppealSubmit}
                   disabled={!appealReason.trim()}
                   className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-primary hover:bg-primary/80"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">
                Submit an appeal to request access
              </p>
            </div>
          ) : (
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-primary/10 border border-primary/20 p-6 rounded-3xl"
            >
              <h3 className="text-primary font-black uppercase tracking-widest text-xs mb-1">Appeal Received</h3>
              <p className="text-white/60 text-[10px] font-medium uppercase tracking-[0.2em]">Our team will review your request shortly.</p>
            </motion.div>
          )}

          <div className="pt-8">
            <BrandLogo className="h-8 w-8 mx-auto opacity-20" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col bg-background relative z-0", status === "idle" ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]")}>
      <ChatWallpaper />
      <div className="lg:hidden relative z-20">
        <Header onlineCount={onlineCount} strangerName={status === "connected" ? strangerName : undefined} />
      </div>

      <div className={cn("transition-opacity duration-500", status === "idle" && "opacity-0 pointer-events-none")}>
        <ChatStatusBar
          status={status}
          matchedInterests={matchedInterests}
          autoReconnectCountdown={autoReconnectCountdown}
          searchElapsed={searchElapsed}
          messages={messages}
          strangerName={strangerName}
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
      </div>

      <div className={cn("transition-opacity duration-500", status === "idle" && "opacity-0 pointer-events-none")}>
        <InterestBar
          interests={interests}
          onChangeInterests={setInterests}
          showSelector={showInterests}
          isIdle={status === "idle"}
          isActive={status !== "idle" && !showInterests}
        />
      </div>      {status === "idle" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10 overflow-hidden pointer-events-none">
          <div className="pointer-events-auto w-full max-w-sm flex flex-col items-center justify-center">
            {!userName ? (
              <div className="w-full relative">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full space-y-8 text-center bg-card/80 backdrop-blur-2xl border border-black/[0.08] dark:border-white/10 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative ring-1 ring-black/[0.05] dark:ring-white/[0.05]"
                >
                  <div className="space-y-3">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 rotate-3 ring-1 ring-primary/20">
                      <Zap className="h-8 w-8 text-primary fill-primary/20" />
                    </div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground leading-none">Your Identity</h2>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Choose a name to enter the lobby</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative group space-y-2">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/40">Enter Nickname</span>
                        <span className={cn(
                          "text-[10px] font-bold tabular-nums",
                          tempName.length < 3 && tempName.length > 0 ? "text-destructive" : "text-foreground/50"
                        )}>
                          {tempName.length}/15
                        </span>
                      </div>
                      <div className="relative">
                        <Input 
                          placeholder="Type here..."
                          autoFocus
                          maxLength={15}
                          value={tempName}
                          className={cn(
                            "h-16 bg-muted/50 border-border text-foreground rounded-2xl px-6 text-center font-bold focus:border-primary/50 transition-all placeholder:text-foreground/30",
                            tempName.length > 12 ? "text-base tracking-normal" : tempName.length > 8 ? "text-lg tracking-wide" : "text-xl tracking-wide",
                            tempName.length > 0 && tempName.length < 3 && "border-destructive/50"
                          )}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && tempName.trim().length >= 3) handleSaveName(tempName);
                          }}
                          onChange={(e) => setTempName(e.target.value)}
                        />
                        <div className="absolute inset-0 rounded-2xl border border-primary/20 scale-105 opacity-0 group-focus-within:opacity-100 transition-all -z-10 blur-xl bg-primary/5" />
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <div className="flex justify-center">
                        <button 
                          onClick={handleRandomName}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border text-foreground hover:text-primary hover:bg-primary/5 transition-all active:scale-95 text-[10px] font-bold uppercase tracking-widest"
                          title="Random Nickname"
                        >
                          <Dices className="h-4 w-4" />
                          Randomize
                        </button>
                      </div>

                      <div className="w-full space-y-2">
                        <Button
                          variant="glow"
                          size="lg"
                          className="h-14 w-full rounded-2xl text-sm font-black uppercase tracking-[0.2em] italic disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/20"
                          disabled={tempName.trim().length < 3}
                          onClick={() => handleSaveName(tempName)}
                        >
                          Confirm Name <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <p className={cn(
                          "text-[9px] font-bold uppercase tracking-widest transition-opacity duration-300",
                          tempName.length > 0 && tempName.length < 3 ? "text-destructive opacity-100" : "text-foreground/40"
                        )}>
                          {tempName.length > 0 && tempName.length < 3 ? "Minimum 3 characters required" : "3-15 characters allowed"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick suggestions */}
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-widest mb-4">Trending Tags</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {RANDOM_NICKNAMES.slice(0, 4).map(name => (
                        <button
                          key={name}
                          onClick={() => setTempName(name)}
                          className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-[10px] text-foreground/40 hover:text-foreground hover:bg-muted hover:border-border/80 transition-all font-bold uppercase tracking-wider"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="flex flex-col items-center gap-6 bg-card/80 backdrop-blur-2xl border border-black/[0.08] dark:border-white/10 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative w-full ring-1 ring-black/[0.05] dark:ring-white/[0.05]"
              >
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center relative ring-1 ring-primary/20">
                  <MessageSquare className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center space-y-3">
                  <div className="flex flex-col items-center gap-1">
                    <h3 className={cn(
                      "font-black tracking-tighter text-foreground leading-none text-center px-4",
                      userName.length > 12 ? "text-lg sm:text-xl" : userName.length > 8 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
                    )}>
                      Welcome, {userName}
                    </h3>
                    <button 
                      onClick={() => {
                        setUserName("");
                        setTempName("");
                        localStorage.removeItem("livetalk_user_name");
                      }}
                      className="text-[10px] text-primary font-bold uppercase tracking-widest hover:underline opacity-80"
                    >
                      Not you? Change
                    </button>
                  </div>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Ready to chat anonymously</p>
                </div>
                <Button
                  variant="glow"
                  size="lg"
                  onClick={handleStart}
                  className="h-14 w-full rounded-2xl text-sm font-black uppercase tracking-[0.2em] italic shadow-xl shadow-primary/20"
                >
                  Start Chatting <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      ) : status === "searching" ? (
        <FindingAnimation 
          searchElapsed={searchElapsed}
          onStop={stopChat}
          interests={interests}
        />
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
          isReplying={!!replyingTo}
        />
      )}

      <div className={cn("transition-opacity duration-500", (status === "idle" || status === "searching") && "opacity-0 pointer-events-none")}>
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
          activeGame={activeGame}
          setActiveGame={setActiveGame}
        />
      </div>

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
        strangerTyping={strangerTyping}
      />

      <MatchCelebration
        show={showMatchCelebration}
        matchedInterests={matchedInterests}
        onDismiss={() => setShowMatchCelebration(false)}
      />

      <div className="relative z-20">
        <BottomNav />
      </div>

      <motion.div className="z-[200]">
        <AnimatePresence>
          {activeGame === "canvas" && (
            <SharedCanvas
              roomChannel={roomChannel}
              sessionId={sessionId}
              onClose={() => setActiveGame("none")}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ChatPage;
