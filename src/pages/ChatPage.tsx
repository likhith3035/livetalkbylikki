import { useState, useEffect, useRef, useCallback } from "react";
import type { Message } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import ChatStatusBar from "@/components/chat/ChatStatusBar";
import { ChatToolsMenu } from "@/components/chat/ChatToolsMenu";
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
import { MessageSquare, Zap, Shield, ArrowRight, X, AlertTriangle, Send, Dices, RefreshCw, Bot, Smartphone, ChevronDown, ChevronUp, Phone, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSafety } from "@/hooks/use-safety";
import { motion, AnimatePresence } from "framer-motion";
import { useSEO } from "@/hooks/use-seo";
import { BrandLogo } from "@/components/BrandLogo";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { FindingAnimation } from "@/components/chat/FindingAnimation";
import LiquidBackground from "@/components/LiquidBackground";
import SharedCanvas from "@/components/chat/SharedCanvas";
import { useSoundNotifications } from "@/hooks/use-sound-notifications";
import { haptics } from "@/lib/haptics";
import { useProtectionDetection } from "@/hooks/use-protection-detection";
import { useNavigate, useSearchParams } from "react-router-dom";
import RoomWaitingScreen from "@/components/chat/RoomWaitingScreen";
import HumanVerifyModal from "@/components/chat/HumanVerifyModal";
import SessionStatsBar from "@/components/chat/SessionStatsBar";
import StrangerProfileCard from "@/components/chat/StrangerProfileCard";
import StrangerProfileSheet from "@/components/chat/StrangerProfileSheet";
import DisconnectGuardModal from "@/components/chat/DisconnectGuardModal";
import EmojiExplosionOverlay from "@/components/chat/EmojiExplosionOverlay";
import useMobileBackGuard from "@/hooks/use-mobile-back-guard";
import useChatTranslator, { SUPPORTED_LANGUAGES } from "@/hooks/use-chat-translator";
import { useHumanVerify } from "@/hooks/use-human-verify";
import { useSessionStats } from "@/hooks/use-session-stats";
import {
  useCrossDeviceSync,
  useTempRoomLifecycle,
  DeviceHandoffPanel,
  AIOpponentPanel,
  sweepExpiredRooms,
} from "@/features";
import { trackRoomMediaUpload } from "@/features/temp-rooms/registerMediaUpload";

const RANDOM_NICKNAMES = [
  "Starlight", "Shadow", "Neon", "Cyber", "Mystic", "Echo", "Zenith", "Pixel", 
  "Rogue", "Ghost", "Glitch", "Aura", "Nova", "Flux", "Swift", "Cosmic", 
  "Blaze", "Vortex", "Luna", "Titan", "Solar", "Orion", "Jade", "Ruby",
  "Phoenix", "Raven", "Skye", "Storm", "Aqua", "Crystal", "Pulse"
];

const ChatPage = ({ initialRoomCode }: { initialRoomCode?: string } = {}) => {
  const [searchParams] = useSearchParams();
  const {
    messages, status, onlineCount, interests, matchedInterests, strangerTyping, strangerTypingText,
    deleteMessage, pinMessage, disappearTimer, setDisappearTimer,
    userName, setUserName, strangerName, strangerAvatar, strangerMood,
    callStatus, isAudioOnly, localStream, remoteStream, isMuted, isCameraOff,
    isScreenSharing, remoteIsScreenSharing, isBlurred, facingMode,
    remoteMuted, remoteCameraOff, remoteBlurred,
    startCall, acceptCall, declineCall, endCall,
    toggleMute, toggleCamera, flipCamera, toggleScreenShare, toggleBlur,
    upgradeToVideo,
    sendSurprise,
    surpriseEffect,
    inCallMessages, sendInCallMessage,
    supportsScreenShare, stats, audioOutput, toggleAudioOutput, isPiPActive, togglePictureInPicture, supportsPiP,
    autoReconnectCountdown, sessionId, stableId, roomChannel, searchElapsed,
    setInterests, startChat, sendMessage, sendTyping, nextChat, stopChat,
    reactToMessage, blockStranger, createPrivateRoom, joinPrivateRoom,
    localPrivacyModeActive, strangerPrivacyModeActive, privacyModeActive, privacyAlertActive, sendPrivacyAlert,
    privateRoomCode, roomId, sendSignalingEvent,
    registerCrossDeviceSignaling,
    joinRoomById,
  } = useChatContext();

  const { isBanned, submitAppeal } = useSafety();
  const { toast } = useToast();
  const { settings } = useSettings();
  const { playConnect, playDisconnect } = useSoundNotifications();
  const [appealReason, setAppealReason] = useState("");
  const [appealSent, setAppealSent] = useState(false);
  const banned = isBanned(stableId);

  // Feature: Human Verification
  const { isVerified, showVerify, requireVerification, onVerifySuccess, onVerifyClose } = useHumanVerify();

  // Feature: Session Stats
  const { todayConversations, todayTotalTime, currentStreak, longestStreak, onChatStart, onChatEnd } = useSessionStats();

  // Feature: Stranger Profile Card
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);

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
  const [activeGame, setActiveGame] = useState<"none" | "ttt" | "canvas" | "rps">("none");
  const lastAutoJoinCodeRef = useRef<string | null>(null);
  const navigate = useNavigate();
  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(null);
  const [showPrivateWaiting, setShowPrivateWaiting] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [handoffMinimized, setHandoffMinimized] = useState(() => {
    try {
      const saved = localStorage.getItem("echo.handoff.minimized");
      return saved !== "false"; // Default to true (minimized) if not explicitly set to "false"
    } catch {
      return true;
    }
  });
  // Video call reaction state
  const [incomingReaction, setIncomingReaction] = useState<{ emoji: string; id: number } | null>(null);
  const [strangerHandRaised, setStrangerHandRaised] = useState(false);
  const [showDisconnectGuard, setShowDisconnectGuard] = useState(false);
  const [activeExplosionEmoji, setActiveExplosionEmoji] = useState<string | null>(null);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const { targetLang, setTargetLang, translations, translateMessage } = useChatTranslator();

  // Auto-populate random nickname so users can jump right into chat in 1 tap
  useEffect(() => {
    const saved = localStorage.getItem("livetalk_user_name");
    if (!saved && !tempName) {
      const random = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
      setTempName(random);
    }
  }, [tempName]);

  useEffect(() => {
    if (targetLang !== "off" && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.sender === "stranger" && lastMsg.text) {
        translateMessage(lastMsg.id, lastMsg.text);
      }
    }
  }, [messages, targetLang, translateMessage]);

  const handleReactWithParticle = useCallback((messageId: string, emoji: string) => {
    reactToMessage(messageId, emoji);
  }, [reactToMessage]);

  const isSessionActive = status === "connected" || callStatus !== "idle";

  useMobileBackGuard({
    enabled: isSessionActive,
    onRequestGuard: useCallback(() => {
      setShowDisconnectGuard(true);
    }, []),
  });

  const handleHeaderBack = useCallback(() => {
    if (isSessionActive) {
      setShowDisconnectGuard(true);
    } else {
      stopChat();
    }
  }, [isSessionActive, stopChat]);

  const effectiveRoomId = roomId ?? (privateRoomCode ? `private_${privateRoomCode}` : null);

  // Cross-device sync works for both private rooms and random chats
  const isPrivateRoom = !!privateRoomCode;

  const crossDevice = useCrossDeviceSync({
    roomId: effectiveRoomId,
    sessionId,
    enabled: !!effectiveRoomId && (status === "connected" || showPrivateWaiting),
    sendSignaling: sendSignalingEvent,
  });

  // Wire cross-device sync signaling handler into the shared signaling pipeline
  useEffect(() => {
    registerCrossDeviceSignaling(crossDevice.handleSignalingEvent);
  }, [registerCrossDeviceSignaling, crossDevice.handleSignalingEvent]);

  // Sweep expired rooms from previous sessions once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("echo.visited_rooms");
      const rooms: string[] = raw ? JSON.parse(raw) : [];
      if (rooms.length > 0) {
        sweepExpiredRooms(rooms).catch(() => {});
      }
    } catch { /* ignore */ }
  }, []);

  // Track connected room IDs for later sweep of expired rooms
  useEffect(() => {
    if (status === "connected" && roomId) {
      try {
        const raw = localStorage.getItem("echo.visited_rooms");
        const rooms: string[] = raw ? JSON.parse(raw) : [];
        if (!rooms.includes(roomId)) {
          rooms.push(roomId);
          // Keep only the last 50 to avoid unbounded growth
          const trimmed = rooms.slice(-50);
          localStorage.setItem("echo.visited_rooms", JSON.stringify(trimmed));
        }
      } catch { /* ignore */ }
    }
  }, [status, roomId]);

  useTempRoomLifecycle({
    roomId,
    sessionId,
    enabled: !!roomId,
    onExpired: () => {
      toast({ title: "Session expired", description: "This room was auto-deleted for privacy." });
      stopChat();
    },
  });

  const handleCancelRoom = useCallback(() => {
    stopChat();
    setPendingRoomCode(null);
    setShowPrivateWaiting(false);
    navigate("/");
  }, [stopChat, navigate]);

  useEffect(() => {
    if (privateRoomCode && status === "searching") {
      setShowPrivateWaiting(true);
    }
  }, [privateRoomCode, status]);

  useEffect(() => {
    if (!privateRoomCode) {
      setShowPrivateWaiting(false);
    }
  }, [privateRoomCode]);

  // Auto-join private room from URL/code or handoff redirect
  useEffect(() => {
    const savedName = localStorage.getItem("livetalk_user_name");
    if (savedName) setUserName(savedName);

    // ?handoff=roomId — from HandoffPage redirect after token claim
    const handoffRoomId = searchParams.get("handoff") ?? "";
    if (handoffRoomId) {
      const privateMatch = handoffRoomId.match(/^private_([A-Z0-9]+)$/i);
      if (privateMatch) {
        // Private room — use existing join-by-code flow
        const code = privateMatch[1].toUpperCase();
        if (!sessionStorage.getItem("echo_join_room")) {
          sessionStorage.setItem("echo_join_room", code);
        }
      } else {
        // Random match room — join directly by roomId, no lobby check needed
        const name = localStorage.getItem("livetalk_user_name") || "";
        if (name) {
          joinRoomById(handoffRoomId);
        } else {
          // Need name first — store roomId and join after name entry
          sessionStorage.setItem("echo.handoff.room", handoffRoomId);
        }
        return;
      }
    }

    // Restore random room handoff after name entry
    const pendingHandoffRoom = sessionStorage.getItem("echo.handoff.room");
    if (pendingHandoffRoom && (savedName || userName)) {
      sessionStorage.removeItem("echo.handoff.room");
      joinRoomById(pendingHandoffRoom);
      return;
    }

    const storedCode = sessionStorage.getItem("echo_join_room");
    const pendingCode = (initialRoomCode || storedCode || "").toUpperCase();
    if (!pendingCode) return;
    if (lastAutoJoinCodeRef.current === pendingCode) return;

    lastAutoJoinCodeRef.current = pendingCode;
    sessionStorage.removeItem("echo_join_room");
    setShowInterests(false);

    if (!savedName && !userName) {
      setPendingRoomCode(pendingCode);
    } else {
      const createdCode = sessionStorage.getItem("echo_created_room");
      const isCreator = createdCode?.toUpperCase() === pendingCode;
      if (isCreator) {
        sessionStorage.removeItem("echo_created_room");
      }
      joinPrivateRoom(pendingCode, isCreator);
    }
  }, [initialRoomCode, joinPrivateRoom, joinRoomById, userName, setUserName, searchParams]);

  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status === "connected" && prevStatusRef.current !== "connected") {
      setShowMatchCelebration(true);
      celebrationTimerRef.current = setTimeout(() => setShowMatchCelebration(false), 3500);
      playConnect();
      haptics.matchFound();
      // Session stats + profile card
      onChatStart();
      setConnectedAt(Date.now());
      setShowProfileCard(true);
    }
    if ((status === "disconnected" || status === "idle") && prevStatusRef.current === "connected") {
      playDisconnect();
      // Session stats
      onChatEnd();
      setShowProfileCard(false);
      setConnectedAt(null);
    }
    prevStatusRef.current = status;
    return () => {
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    };
  }, [status, playConnect, playDisconnect, onChatStart, onChatEnd]);

  const handleSaveName = (name: string) => {
    const trimmed = name.trim().slice(0, 15);
    if (trimmed) {
      setUserName(trimmed);
      localStorage.setItem("livetalk_user_name", trimmed);
      toast({ title: "Welcome!", description: `You are now known as ${trimmed}` });
      if (pendingRoomCode) {
        const createdCode = sessionStorage.getItem("echo_created_room");
        const isCreator = createdCode?.toUpperCase() === pendingRoomCode;
        if (isCreator) {
          sessionStorage.removeItem("echo_created_room");
        }
        joinPrivateRoom(pendingRoomCode, isCreator);
        setPendingRoomCode(null);
      }
    }
  };

  const handleRandomName = () => {
    const randomName = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
    setTempName(randomName);
  };

  const handleInviteFriend = useCallback(() => {
    const code = createPrivateRoom();
    const link = `${window.location.origin}/chat?room=${code}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      toast({
        title: "🚀 Private Invite Link Copied!",
        description: `Room Code: ${code}. Send this link to a friend to chat!`,
      });
    }
  }, [createPrivateRoom, toast]);

  const handleStartAIChat = useCallback(() => {
    stopChat();
    navigate("/ai-chat");
  }, [stopChat, navigate]);

  const handleClearInterests = useCallback(() => {
    setInterests([]);
    toast({
      title: "🎯 Filters Cleared",
      description: "Searching all online users to match faster...",
    });
  }, [setInterests, toast]);

  const handleStart = useCallback(() => {
    let effectiveName = userName;
    if (!effectiveName) {
      effectiveName = tempName || RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
      setUserName(effectiveName);
      localStorage.setItem("livetalk_user_name", effectiveName);
    }
    setShowInterests(false);
    requireVerification(() => startChat());
  }, [startChat, userName, tempName, setUserName, requireVerification]);

  useKeyboardShortcuts({ status, onStart: handleStart, onNext: nextChat, onStop: stopChat });

  // Heuristic screen protection & recording detection hook
  const { isTriggered } = useProtectionDetection({
    active: status === "connected" && privacyModeActive,
    onTriggered: (type) => {
      sendPrivacyAlert(type);
      toast({
        variant: "destructive",
        title: "⚠️ Capture Attempt Blocked",
        description: `Screenshot or recording attempt detected (${type}).`
      });
      if (settings.autoStopOnScreenshot) {
        toast({
          variant: "destructive",
          title: "🚨 Chat Terminated",
          description: "Disconnecting session automatically to safeguard privacy."
        });
        setTimeout(() => {
          stopChat();
        }, 1000);
      }
    }
  });

  // Prevent right-clicks, copying, cutting in Privacy Mode (except in input fields)
  useEffect(() => {
    if (status !== "connected" || !privacyModeActive) return;

    const preventDefault = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      toast({
        title: "🔒 Security Feature Active",
        description: "Right-clicks and copying are disabled in Privacy Mode to protect conversation media."
      });
    };

    document.addEventListener("contextmenu", preventDefault);
    document.addEventListener("copy", preventDefault);
    document.addEventListener("cut", preventDefault);

    return () => {
      document.removeEventListener("contextmenu", preventDefault);
      document.removeEventListener("copy", preventDefault);
      document.removeEventListener("cut", preventDefault);
    };
  }, [status, privacyModeActive, toast]);

  const handleImageUpload = (url: string) => {
    sendMessage("", url, replyingTo ? { id: replyingTo.id, text: replyingTo.text, sender: replyingTo.sender } : undefined);
    setReplyingTo(null);
    // Track image in temp-room metadata for cleanup when room expires
    if (roomId) {
      // url is a Supabase storage URL; extract the path after the bucket name
      try {
        const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/chat-images\/(.+?)(?:\?|$)/);
        if (match?.[1]) {
          trackRoomMediaUpload(roomId, decodeURIComponent(match[1])).catch(() => {});
        }
      } catch { /* ignore — tracking is best-effort */ }
    }
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

  // ── Video call reactions & hand raise ──────────────────────────────────────
  const handleSendReaction = useCallback((emoji: string) => {
    sendSignalingEvent("call:reaction", { senderId: sessionId, emoji });
  }, [sendSignalingEvent, sessionId]);

  const handleRaiseHand = useCallback(() => {
    sendSignalingEvent("call:raise_hand", { senderId: sessionId });
  }, [sendSignalingEvent, sessionId]);

  // Listen for incoming reactions and hand-raise via signaling
  useEffect(() => {
    if (!roomChannel) return;
    // We re-use the roomChannel broadcast for call reactions (fast, no Firebase write)
    const handleCallEvent = (payload: any) => {
      const data = payload.payload as { senderId: string; emoji?: string; type?: string };
      if (data.senderId === sessionId) return;
      if (payload.event === "call:reaction" && data.emoji) {
        setIncomingReaction({ emoji: data.emoji, id: Date.now() });
      }
      if (payload.event === "call:raise_hand") {
        setStrangerHandRaised(true);
        setTimeout(() => setStrangerHandRaised(false), 5000);
      }
    };
    roomChannel.on("broadcast", { event: "call:reaction" }, handleCallEvent);
    roomChannel.on("broadcast", { event: "call:raise_hand" }, handleCallEvent);
    return () => {
      roomChannel.off?.("broadcast", { event: "call:reaction" });
      roomChannel.off?.("broadcast", { event: "call:raise_hand" });
    };
  }, [roomChannel, sessionId]);

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
    <div className={cn("flex flex-col bg-background relative z-0 h-full w-full flex-1 min-h-0 overflow-hidden", status === "connected" && privacyModeActive && "select-none")}>
      <LiquidBackground />
      <ChatWallpaper />
      <div className={cn("flex flex-col flex-1 min-h-0", privacyAlertActive && "blur-lg pointer-events-none transition-all duration-300")}>
        <div className="relative z-20">
          <Header 
            onlineCount={onlineCount} 
            strangerName={status === "connected" ? strangerName : undefined} 
            strangerAvatar={status === "connected" ? strangerAvatar : undefined}
            strangerMood={status === "connected" ? strangerMood : undefined}
            messages={status === "connected" ? messages : undefined}
            onBack={handleHeaderBack}
            onVideoCall={() => startCall(false)}
            onAudioCall={() => startCall(true)}
            onProfileTap={() => setShowProfileSheet(true)}
            onTranslateToggle={() => setShowLangPicker((v) => !v)}
            targetLang={targetLang}
            toolsMenu={
              status === "connected" && (
                <ChatToolsMenu
                  messages={messages}
                  onSearchResult={setSearchHighlight}
                  disappearTimer={disappearTimer}
                  onSetDisappearTimer={setDisappearTimer}
                  onBlock={blockStranger}
                  onThemeChange={handleThemeChange}
                />
              )
            }
          />
          {/* Language Selector Dropdown */}
          <AnimatePresence>
            {showLangPicker && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-14 right-4 z-50 bg-card/95 border border-border/80 rounded-2xl p-2 shadow-2xl backdrop-blur-xl flex flex-col gap-1 w-48 text-xs"
              >
                <p className="px-2 py-1 text-[10px] font-extrabold uppercase text-primary tracking-wider">
                  Auto-Translate Messages
                </p>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setTargetLang(lang.code);
                      setShowLangPicker(false);
                    }}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors text-left font-bold",
                      targetLang === lang.code ? "bg-primary/20 text-primary border border-primary/30" : "hover:bg-secondary text-foreground"
                    )}
                  >
                    <span>{lang.flag} {lang.name}</span>
                    {targetLang === lang.code && <span className="text-[10px]">✓</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Desktop-only compact info bar */}
        {status === "connected" && strangerName && (
          <div className="hidden lg:flex items-center justify-between px-6 py-3 z-20 relative bg-secondary/15 border-b border-border/10">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowProfileSheet(true)} className="flex items-center gap-3 hover:opacity-80 active:scale-[0.99] transition-all">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                {strangerAvatar && (
                  strangerAvatar.startsWith("data:image/") ? (
                    <img src={strangerAvatar} alt="avatar" className="h-5 w-5 rounded-full object-cover shrink-0 border border-primary/25" />
                  ) : (
                    <span className="text-sm shrink-0">{strangerAvatar}</span>
                  )
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-primary/70 tracking-widest leading-none">Chatting with</span>
                  <span className="text-sm font-bold text-foreground leading-none">{strangerName}</span>
                  {strangerMood && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 leading-none shrink-0 normal-case tracking-normal">{strangerMood}</span>
                  )}
                </div>
              </button>
            </div>

            {/* Desktop Call buttons side-by-side */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startCall(true)}
                disabled={callStatus !== "idle"}
                className="gap-1.5 h-8 px-3 text-xs font-bold transition-all hover:scale-[1.03] border bg-secondary/40 border-border/40 hover:bg-secondary/60 text-foreground"
                title="Start audio call"
              >
                <Phone className="h-3.5 w-3.5 text-primary" />
                <span>Call</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startCall(false)}
                disabled={callStatus !== "idle"}
                className="gap-1.5 h-8 px-3 text-xs font-bold transition-all hover:scale-[1.03] border bg-secondary/40 border-border/40 hover:bg-secondary/60 text-foreground"
                title="Start video call"
              >
                <Video className="h-3.5 w-3.5 text-primary" />
                <span>Video</span>
              </Button>
            </div>
          </div>
        )}

      {/* Session Stats Bar */}
      <SessionStatsBar
        todayConversations={todayConversations}
        todayTotalTime={todayTotalTime}
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        isVerified={isVerified}
      />

      <div className={cn("transition-opacity duration-500 hidden lg:block", status === "idle" && "hidden")}>
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

      {/* Stranger Profile Card — floating overlay, removed from flow */}

      <div className={cn("transition-opacity duration-500", status === "idle" && "hidden")}>
        <InterestBar
          interests={interests}
          onChangeInterests={setInterests}
          showSelector={showInterests}
          isIdle={status === "idle"}
          isActive={status !== "idle" && !showInterests}
        />
      </div>
      {status === "idle" ? (
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
          onInviteFriend={handleInviteFriend}
          onStartAIChat={handleStartAIChat}
          onClearInterests={handleClearInterests}
        />
      ) : (
        <>
          <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
            {/* Floating stranger profile card — top-right, no layout impact */}
            <StrangerProfileCard
              strangerName={strangerName}
              matchedInterests={matchedInterests}
              connectedAt={connectedAt}
              isVerified={isVerified}
              show={showProfileCard && status === "connected"}
              onClose={() => setShowProfileCard(false)}
              strangerAvatar={strangerAvatar}
              strangerMood={strangerMood}
            />
            <ChatMessageList
              messages={messages}
              strangerTyping={strangerTyping}
              strangerTypingText={strangerTypingText}
              strangerName={strangerName}
              onReact={handleReactWithParticle}
              onReply={(msg) => setReplyingTo(msg)}
              onDelete={deleteMessage}
              onPin={pinMessage}
              onForward={handleForwardMessage}
              disappearTimer={disappearTimer}
              highlightMessageId={searchHighlight}
              isReplying={!!replyingTo}
              autoTranslations={translations}
            />
          </div>
          <ChatInput
            status={status}
            onSend={sendMessage}
            onImageUpload={handleImageUpload}
            onTyping={sendTyping}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            roomChannel={roomChannel}
            sessionId={sessionId}
            roomId={roomId}
            hasMessages={messages.length > 0}
            activeGame={activeGame}
            setActiveGame={setActiveGame}
            onToggleAI={() => setShowAIPanel((v) => !v)}
            onNext={nextChat}
            onReact={(emoji) => setActiveExplosionEmoji(emoji)}
          />
        </>
      )}

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
        onSendSurprise={sendSurprise}
        surpriseEffect={surpriseEffect}
        onSendInCallMessage={sendInCallMessage}
        inCallMessages={inCallMessages}
        supportsScreenShare={supportsScreenShare}
        strangerTyping={strangerTyping}
        onSendReaction={handleSendReaction}
        incomingReaction={incomingReaction}
        onRaiseHand={handleRaiseHand}
        strangerHandRaised={strangerHandRaised}
        stats={stats || null}
        audioOutput={audioOutput}
        onToggleAudioOutput={toggleAudioOutput}
        isPiPActive={isPiPActive}
        onTogglePiP={togglePictureInPicture}
        supportsPiP={supportsPiP}
      />

      <MatchCelebration
        show={showMatchCelebration}
        matchedInterests={matchedInterests}
        onDismiss={() => setShowMatchCelebration(false)}
      />

      <StrangerProfileSheet
        show={showProfileSheet && status === "connected"}
        onClose={() => setShowProfileSheet(false)}
        strangerName={strangerName}
        strangerAvatar={strangerAvatar}
        strangerMood={strangerMood}
        matchedInterests={matchedInterests}
        connectedAt={connectedAt}
        isVerified={isVerified}
        messageCount={messages.filter(m => m.sender !== "system").length}
        onAudioCall={() => startCall(true)}
        onVideoCall={() => startCall(false)}
      />

      {status === "idle" && (
        <div className="relative z-20">
          <MobileNav />
        </div>
      )}
      </div>



      <AIOpponentPanel
        roomId={roomId}
        sessionId={sessionId}
        isOpen={showAIPanel && status === "connected"}
        onClose={() => setShowAIPanel(false)}
        onSendMessage={sendMessage}
      />



      <motion.div className="z-[200]">
        <AnimatePresence>
          {activeGame === "canvas" && (
            <SharedCanvas
              roomChannel={roomChannel}
              sessionId={sessionId}
              onClose={() => {
                setActiveGame("none");
                roomChannel?.send({ type: "broadcast", event: "game_stop", payload: { senderId: sessionId, game: "canvas" } });
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {status === "connected" && privacyModeActive && (
        <PrivacyWatermark userName={userName} strangerName={strangerName} sessionId={sessionId} />
      )}

      {isTriggered && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[9999] pointer-events-auto flex flex-col items-center justify-center text-center p-6 select-none animate-in fade-in duration-200">
          <div className="h-16 w-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mb-4 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-alert animate-bounce"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
          </div>
          <h2 className="font-display text-lg font-bold text-foreground mb-1.5">Privacy Shield Active</h2>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            The screen is temporarily hidden to protect chat media and conversation privacy.
          </p>
        </div>
      )}

      {/* Human Verification Modal */}
      <HumanVerifyModal
        show={showVerify}
        onVerified={onVerifySuccess}
        onClose={onVerifyClose}
      />

      {/* Realtime Mutual Warning Modal popup */}
      <AnimatePresence>
        {privacyAlertActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-card border border-border/80 p-6 rounded-[2rem] max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center gap-4 relative overflow-hidden"
            >
              {/* Premium Glow effect */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-destructive via-red-500 to-destructive" />
              
              <div className="h-14 w-14 rounded-full bg-destructive/15 border border-destructive/20 flex items-center justify-center text-destructive animate-pulse">
                <AlertTriangle className="h-7 w-7" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-black uppercase tracking-tight text-foreground leading-tight">
                  Security Warning
                </h3>
                <p className="text-xs font-bold text-destructive/95 uppercase tracking-wide">
                  Possible screenshot or screen recording detected
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed pt-1">
                  Screenshots and recordings are strictly discouraged and may trigger alerts.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Private Room QR Waiting Screen Overlay */}
      <AnimatePresence>
        {showPrivateWaiting && privateRoomCode && (
          <RoomWaitingScreen
            roomCode={privateRoomCode}
            isMatched={status === "connected"}
            onCancel={handleCancelRoom}
            onPartnerJoined={() => setShowPrivateWaiting(false)}
          />
        )}
      </AnimatePresence>

      {/* Disconnect Guard Modal */}
      <DisconnectGuardModal
        isOpen={showDisconnectGuard}
        onStay={() => setShowDisconnectGuard(false)}
        onMinimize={() => {
          setShowDisconnectGuard(false);
          navigate("/");
        }}
        onDisconnect={() => {
          setShowDisconnectGuard(false);
          stopChat();
        }}
        strangerName={strangerName}
        strangerAvatar={strangerAvatar}
        strangerMood={strangerMood}
        matchedInterests={matchedInterests}
        isCallActive={callStatus !== "idle"}
        isAudioOnly={isAudioOnly}
      />

      {/* Emoji Particle Explosion Overlay */}
      <EmojiExplosionOverlay
        emoji={activeExplosionEmoji}
        onComplete={() => setActiveExplosionEmoji(null)}
      />
    </div>
  );
};

export default ChatPage;
