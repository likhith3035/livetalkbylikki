import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Pencil, Check, Plus, X, 
  MessageSquare, Clock, Zap, Award, Copy, Volume2, 
  Bell, ShieldCheck, Upload, RefreshCw,
  RotateCw, Smile, Camera, ChevronRight, User,
  Search, ChevronDown, Calendar, MapPin, Users, Trash2, RotateCcw, Link as LinkIcon, Trophy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useProfile } from "@/hooks/use-profile";
import { useSessionStats } from "@/hooks/use-session-stats";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useSEO } from "@/hooks/use-seo";
import { toast } from "sonner";

const MOOD_PRESETS = ["💬 Chatty", "🎮 Gaming", "🎧 Listening", "😊 Chill", "🍿 Movies", "🔥 AFK"];

const PREFIXES = ["Cyber", "Neon", "Cosmic", "Quantum", "Shadow", "Retro", "Lunar", "Solar", "Turbo", "Vibe", "Digital", "Alpha", "Hyper", "Crypto", "Nova"];
const SUFFIXES = ["Fox", "Spectre", "Rider", "Ghost", "Ninja", "Glitch", "Drifter", "Pioneer", "Echo", "Wave", "Knight", "Oracle", "Spark", "Phantom", "Apex"];

// Target Bullseye with Cyan Dart Avatar (matching exact UI mockup)
const BullseyeDartAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg select-none pointer-events-none">
    <defs>
      <radialGradient id="targetBg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#1e1f3a" />
        <stop offset="100%" stopColor="#0d0e1a" />
      </radialGradient>
      <linearGradient id="cyanDartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#targetBg)" />
    
    {/* Concentric Bullseye Rings */}
    <circle cx="48" cy="52" r="35" fill="#f43f5e" />
    <circle cx="48" cy="52" r="26" fill="#f8fafc" />
    <circle cx="48" cy="52" r="17" fill="#f43f5e" />
    <circle cx="48" cy="52" r="8" fill="#f8fafc" />
    <circle cx="48" cy="52" r="4" fill="#e11d48" />

    {/* Cyan Dart striking target center (48, 52) */}
    <g>
      {/* Silver shaft */}
      <line x1="48" y1="52" x2="72" y2="28" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Dart Point */}
      <circle cx="48" cy="52" r="2.2" fill="#0f172a" />

      {/* Flight fins */}
      <path d="M64 36 L78 20 L84 26 L70 42 Z" fill="url(#cyanDartGrad)" />
      <path d="M66 34 L76 16 L84 21 L71 37 Z" fill="#38bdf8" />
      <path d="M68 38 L84 24 L87 30 L73 45 Z" fill="#0284c7" />

      {/* Flight white edge accents */}
      <line x1="76" y1="16" x2="84" y2="21" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="78" y1="20" x2="84" y2="26" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
    </g>
  </svg>
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const onlineCount = useOnlineCount();
  const { profile, displayName: rawDisplayName, updateNickname, updateAvatar, updateMood, AVATAR_OPTIONS } = useProfile();
  const { todayConversations, todayTotalTime, currentStreak, longestStreak } = useSessionStats();
  const { settings, updateSetting } = useSettings();

  // If user has not customized nickname yet, use the inspiring default "RetroSpark50"
  const displayName = profile.nickname.trim() ? profile.nickname.trim() : "RetroSpark50";

  useSEO({ 
    title: "Gamer Profile & Persona Studio – IncogTalk", 
    description: "Manage your anonymous IncogTalk persona — custom avatars, presence status, game progression, and private session stats.",
    keywords: "incogtalk profile, anonymous handle, chat persona, avatar, arcade profile",
    breadcrumbTitle: "Gamer Profile",
  });

  const [nameInput, setNameInput] = useState(displayName);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarTab, setAvatarTab] = useState<"upload" | "emojis">("upload");
  const [shuffling, setShuffling] = useState(false);
  
  // Interactive cropping states
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const touchStartDist = useRef<number | null>(null);
  const touchStartZoom = useRef<number>(1.0);

  // Invite & Stats Share state
  const [inviteCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [copied, setCopied] = useState(false);

  // Bio state
  const [bio, setBio] = useState(() => {
    try {
      return (
        localStorage.getItem("lchat.profile.bio") ||
        "Just a student who loves games, good conversations and meeting new people. 🎮"
      );
    } catch {
      return "Just a student who loves games, good conversations and meeting new people. 🎮";
    }
  });

  const handleSaveBio = (val: string) => {
    setBio(val);
    try {
      localStorage.setItem("lchat.profile.bio", val);
    } catch {}
  };

  // Joined Date state
  const [joinedDate] = useState(() => {
    try {
      const saved = localStorage.getItem("lchat.profile.joined");
      if (saved) return saved;
      localStorage.setItem("lchat.profile.joined", "Sep 2025");
      return "Sep 2025";
    } catch {
      return "Sep 2025";
    }
  });

  // Top search bar state & Ctrl+K
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Interests state
  const [interests, setInterests] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("lchat.interests");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [customInput, setCustomInput] = useState("");
  const MAX_INTERESTS = 5;
  const MAX_LENGTH = 24;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const shuffleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSaveInterests = (newInterests: string[]) => {
    setInterests(newInterests);
    try {
      localStorage.setItem("lchat.interests", JSON.stringify(newInterests));
    } catch {}
  };

  const handleAddInterest = () => {
    const val = customInput.trim().replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, MAX_LENGTH);
    if (!val || interests.length >= MAX_INTERESTS) return;
    if (interests.some(i => i.toLowerCase() === val.toLowerCase())) {
      setCustomInput("");
      return;
    }
    handleSaveInterests([...interests, val]);
    setCustomInput("");
  };

  const handleAddQuickInterest = (val: string) => {
    if (interests.length >= MAX_INTERESTS) return;
    if (interests.some(i => i.toLowerCase() === val.toLowerCase())) return;
    handleSaveInterests([...interests, val]);
  };

  const handleRemoveInterest = (interest: string) => {
    handleSaveInterests(interests.filter(i => i !== interest));
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      updateNickname(nameInput.trim());
    }
    setIsEditProfileOpen(false);
  };

  const triggerShuffleNickname = () => {
    if (shuffling) return;
    setShuffling(true);

    let counter = 0;
    const maxCycles = 10; 

    shuffleIntervalRef.current = setInterval(() => {
      const p = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
      const s = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
      const num = Math.floor(Math.random() * 90) + 10;
      setNameInput(`${p}${s}${num}`);
      
      counter++;
      if (counter >= maxCycles) {
        if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);
        const finalP = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
        const finalS = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
        const finalNum = Math.floor(Math.random() * 90) + 10;
        const finalName = `${finalP}${finalS}${finalNum}`;
        setNameInput(finalName);
        updateNickname(finalName);
        setShuffling(false);
      }
    }, 40);
  };

  useEffect(() => {
    return () => {
      if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);
    };
  }, []);

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCropImage(event.target?.result as string);
      setZoom(1.0);
      setPanX(0);
      setPanY(0);
      setRotation(0);
    };
    reader.readAsDataURL(file);
  };

  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStart.current = { x: clientX - panX, y: clientY - panY };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;

    let rx = dx;
    let ry = dy;
    if (rotation === 90) {
      rx = dy;
      ry = -dx;
    } else if (rotation === 180) {
      rx = -dx;
      ry = -dy;
    } else if (rotation === 270) {
      rx = -dy;
      ry = dx;
    }

    const maxBounds = 80;
    setPanX(Math.max(-maxBounds, Math.min(maxBounds, rx)));
    setPanY(Math.max(-maxBounds, Math.min(maxBounds, ry)));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleWheelZoom = (e: React.WheelEvent) => {
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.max(1.0, Math.min(3.5, prev + delta)));
  };

  const handleTouchStartCombined = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
      touchStartZoom.current = zoom;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleDragStart(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMoveCombined = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / touchStartDist.current;
      const newZoom = Math.max(1.0, Math.min(3.5, touchStartZoom.current * scale));
      setZoom(newZoom);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEndCombined = () => {
    touchStartDist.current = null;
    handleDragEnd();
  };

  const handleApplyCrop = () => {
    if (!cropImage) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 160;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, size, size);
        ctx.translate(size / 2, size / 2);
        ctx.rotate((rotation * Math.PI) / 180);

        const minDim = Math.min(img.width, img.height);
        const cropWidth = minDim / zoom;
        const cropHeight = minDim / zoom;

        const sxOffset = (-panX / 100) * (minDim / 2);
        const syOffset = (-panY / 100) * (minDim / 2);

        const sx = (img.width - cropWidth) / 2 + sxOffset;
        const sy = (img.height - cropHeight) / 2 + syOffset;

        ctx.drawImage(
          img,
          sx,
          sy,
          cropWidth,
          cropHeight,
          -size / 2,
          -size / 2,
          size,
          size
        );

        const base64 = canvas.toDataURL("image/jpeg", 0.85);
        updateAvatar(base64);
        setCropImage(null);
        setShowAvatarModal(false);
      }
    };
    img.src = cropImage;
  };

  const handleResetToTarget = () => {
    updateAvatar("🎯");
    setShowAvatarModal(false);
  };

  // Rank / Level Progress
  const isCustomAvatarImage = profile.avatar?.startsWith("data:image/");
  const showBullseye = !isCustomAvatarImage && (!profile.avatar || profile.avatar === "🎯" || profile.avatar === "😀");

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/room/${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background font-body pb-24 lg:pb-8 select-none text-foreground transition-colors">
      <Header onlineCount={onlineCount} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 space-y-4">
        {/* 1. TOP BAR: Search with Ctrl+K, Glowing Notification Bell & Profile Chip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <div className="flex items-center w-full h-11 px-4 rounded-full bg-card dark:bg-[#111220] border border-border dark:border-white/[0.08] focus-within:border-indigo-500/50 shadow-sm transition-colors">
              <Search className="w-4 h-4 text-muted-foreground dark:text-gray-400 shrink-0 mr-3" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    navigate(`/games?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                placeholder="Search games, players or topics..."
                className="w-full bg-transparent text-xs sm:text-sm text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-500 outline-none"
              />
              <div className="hidden xs:flex items-center gap-1 shrink-0 ml-2">
                <kbd className="text-[10px] font-bold text-muted-foreground dark:text-gray-400 bg-secondary dark:bg-white/[0.06] border border-border dark:border-white/10 px-1.5 py-0.5 rounded">
                  Ctrl
                </kbd>
                <kbd className="text-[10px] font-bold text-muted-foreground dark:text-gray-400 bg-secondary dark:bg-white/[0.06] border border-border dark:border-white/10 px-1.5 py-0.5 rounded">
                  K
                </kbd>
              </div>
            </div>
          </div>

          {/* Right: Notifications & Profile Pill */}
          <div className="flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => toast.info("No unread notifications right now.")}
              className="relative w-10 h-10 rounded-full bg-card dark:bg-[#111220] border border-border dark:border-white/[0.08] hover:border-border/80 dark:hover:border-white/20 flex items-center justify-center text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white transition-all cursor-pointer shadow-sm"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {/* Glowing Purple Notification Dot from mockup */}
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#a855f7] ring-2 ring-card dark:ring-[#111220] shadow-[0_0_8px_#a855f7]" />
            </button>

            {/* Profile Chip */}
            <div
              onClick={() => setIsEditProfileOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-card dark:bg-[#111220] border border-border dark:border-white/[0.08] hover:border-indigo-500/40 shadow-sm transition-all cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-[#3b497a] border border-indigo-200 dark:border-indigo-400/30 flex items-center justify-center text-xs font-black text-indigo-700 dark:text-indigo-100 shrink-0 shadow-inner">
                {isCustomAvatarImage ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-foreground dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors truncate max-w-[130px]">
                {displayName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground dark:text-gray-400 group-hover:text-foreground dark:group-hover:text-white transition-colors shrink-0 ml-0.5" />
            </div>
          </div>
        </div>

        {/* 2. HERO PROFILE CARD */}
        <div className="w-full rounded-3xl bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-pink-50/70 dark:bg-gradient-to-r dark:from-[#111224] dark:via-[#0f101f] dark:to-[#120f26] border border-indigo-100/80 dark:border-white/[0.08] p-6 sm:p-8 relative overflow-hidden shadow-sm dark:shadow-2xl text-foreground dark:text-white transition-colors">
          {/* Mountain landscape & glowing purple planet artwork on the right */}
          <div className="absolute right-0 top-0 bottom-0 w-3/4 max-w-xl pointer-events-none opacity-40 dark:opacity-50 overflow-hidden">
            <svg viewBox="0 0 600 320" className="w-full h-full object-cover">
              <defs>
                <radialGradient id="planetGlowHero" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#4338ca" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="mountainsGrad1Dark" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#241b47" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#0d0e19" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="mountainsGrad2Dark" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#17182c" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#090a12" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="mountainsGrad1Light" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="mountainsGrad2Light" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ddd6fe" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ede9fe" stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* Glowing Purple Planet / Moon */}
              <circle cx="450" cy="90" r="95" fill="url(#planetGlowHero)" />
              <circle cx="455" cy="85" r="76" className="fill-purple-200/50 dark:fill-[#13102b]" />
              <circle cx="475" cy="75" r="68" className="fill-indigo-100/60 dark:fill-[#0e0e1a]" />

              {/* Stars Specks */}
              <circle cx="340" cy="60" r="1.5" className="fill-purple-400 dark:fill-white" opacity="0.6" />
              <circle cx="390" cy="110" r="1" fill="#c084fc" opacity="0.8" />
              <circle cx="490" cy="40" r="1.2" className="fill-indigo-400 dark:fill-white" opacity="0.5" />
              <circle cx="530" cy="95" r="1.8" fill="#e9d5ff" opacity="0.7" />
              <circle cx="280" cy="120" r="1" className="fill-purple-300 dark:fill-white" opacity="0.4" />

              {/* Mountain silhouettes: light mode vs dark mode */}
              <g className="dark:hidden">
                <path d="M140 320 L270 180 L350 240 L450 150 L530 210 L600 160 L600 320 Z" fill="url(#mountainsGrad1Light)" />
                <path d="M230 320 L330 200 L410 260 L510 190 L600 250 L600 320 Z" fill="url(#mountainsGrad2Light)" />
              </g>
              <g className="hidden dark:block">
                <path d="M140 320 L270 180 L350 240 L450 150 L530 210 L600 160 L600 320 Z" fill="url(#mountainsGrad1Dark)" />
                <path d="M230 320 L330 200 L410 260 L510 190 L600 250 L600 320 Z" fill="url(#mountainsGrad2Dark)" />
              </g>
            </svg>
          </div>

          {/* Tilted handwritten script on the right */}
          <div className="hidden sm:block absolute right-8 bottom-6 transform rotate-6 text-right pointer-events-none z-10 select-none">
            <span className="block text-xs font-serif italic text-purple-700/80 dark:text-purple-300/80 leading-tight">Same Games.</span>
            <span className="block text-xs font-serif italic text-purple-700/70 dark:text-purple-300/70 leading-tight">Different People.</span>
            <span className="block text-sm font-serif italic font-bold text-purple-800 dark:text-purple-200 leading-tight">More Fun!</span>
          </div>

          {/* Top-Right: Edit Profile Button */}
          <div className="absolute top-5 right-5 z-20">
            <Button
              type="button"
              size="sm"
              onClick={() => setIsEditProfileOpen(true)}
              className="rounded-full bg-white/80 hover:bg-white text-foreground border border-border/80 shadow-sm dark:bg-white/10 dark:hover:bg-white/20 dark:border-white/20 dark:text-white font-semibold text-xs px-4 h-9 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </Button>
          </div>

          {/* Main Profile Info Row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
            {/* Avatar Column */}
            <div className="flex flex-col items-center shrink-0">
              <div
                onClick={() => setShowAvatarModal(true)}
                className="group relative cursor-pointer w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-[#121324] bg-white dark:bg-[#121326] shadow-md dark:shadow-2xl flex items-center justify-center overflow-hidden ring-2 ring-purple-500/30 dark:ring-purple-500/50 hover:ring-purple-400 transition-all dark:shadow-[0_0_25px_rgba(168,85,247,0.25)]"
              >
                {isCustomAvatarImage ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : showBullseye ? (
                  <BullseyeDartAvatar />
                ) : (
                  <span className="text-5xl select-none">{profile.avatar}</span>
                )}
                {/* Camera Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[2px]">
                  <Camera className="w-7 h-7" />
                </div>
                {/* Online Indicator Dot from mockup */}
                <span className="absolute bottom-1 right-2 w-4 h-4 rounded-full bg-[#10b981] border-2 border-white dark:border-[#121324] shadow-[0_0_8px_#10b981]" />
              </div>

              {/* Change Avatar Button */}
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="mt-3 px-4 py-1.5 rounded-full bg-white/80 hover:bg-white text-foreground border border-border/80 shadow-sm dark:bg-white/10 dark:hover:bg-white/20 dark:border-white/20 dark:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Change Avatar
              </button>
            </div>

            {/* Profile Content Column */}
            <div className="flex flex-col items-center sm:items-start flex-1 min-w-0 pr-0 sm:pr-24">
              {/* Username */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground dark:text-white tracking-tight truncate max-w-full">
                {displayName}
              </h1>

              {/* Badges Row */}
              <div className="flex items-center gap-2.5 mt-2 flex-wrap justify-center sm:justify-start">
                <span className="px-3.5 py-1 rounded-full bg-purple-100 dark:bg-[#3b1d6e]/70 border border-purple-200 dark:border-purple-500/40 text-xs font-bold text-purple-800 dark:text-purple-200 flex items-center gap-1.5 shadow-sm">
                  <Trophy className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>Explorer</span>
                </span>
                <span className="text-xs text-muted-foreground dark:text-gray-400 font-medium">
                  Complete 1 chat to level up
                </span>
              </div>

              {/* Bio Quote */}
              <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-300 mt-3 max-w-xl leading-relaxed font-normal">
                {bio}
              </p>

              {/* Metadata row with icons */}
              <div className="flex items-center gap-4 sm:gap-6 mt-4 text-xs text-muted-foreground dark:text-gray-400 flex-wrap justify-center sm:justify-start font-medium">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-500 dark:text-gray-500" />
                  Joined {joinedDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-500 dark:text-gray-500" />
                  Plays Anonymously
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-500 dark:text-gray-500" />
                  0 Following
                </span>
                <span className="flex items-center gap-1.5">
                  0 Followers
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. LEVEL & PROGRESSION ROW */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Card A: Level & Progress */}
          <div className="md:col-span-8 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card dark:bg-[#111222] border border-border dark:border-white/[0.08] shadow-sm dark:shadow-lg flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between gap-3.5 mb-2">
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 rounded-xl bg-[#5b21b6] text-white font-black text-xs sm:text-sm shadow-md">
                  Lv. 1
                </span>
                <span className="text-xs sm:text-sm font-bold text-foreground dark:text-white">
                  Arcade Rookie
                </span>
              </div>
              <span className="text-xs text-muted-foreground dark:text-gray-400 font-medium tabular-nums">
                60 / 175 XP
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-secondary dark:bg-white/[0.06] overflow-hidden mt-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "34%" }}
                transition={{ duration: 0.6 }}
                className="h-full bg-gradient-to-r from-[#6366f1] via-[#818cf8] to-[#a855f7] rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
              />
            </div>
          </div>

          {/* Card B: Next Level Preview */}
          <div className="md:col-span-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card dark:bg-[#111222] border border-border dark:border-white/[0.08] shadow-sm dark:shadow-lg flex items-center justify-between gap-3 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground dark:text-gray-400 block">
                  Next Level
                </span>
                <span className="text-xs sm:text-sm font-bold text-foreground dark:text-white block">
                  Explorer
                </span>
                <span className="text-[11px] text-muted-foreground dark:text-gray-400 block mt-0.5">
                  Complete 1 chat to level up
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-secondary dark:bg-white/[0.04] border border-border dark:border-white/10 flex items-center justify-center text-muted-foreground dark:text-gray-400 shrink-0">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 4. STATS GRID: 4 Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Chats Today */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card dark:bg-[#111222] border border-border dark:border-white/[0.08] shadow-sm dark:shadow-md flex items-center gap-3.5 transition-colors">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-foreground dark:text-white tabular-nums block leading-none">
                {todayConversations || 0}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground dark:text-gray-400 mt-1 block">
                Chats Today
              </span>
            </div>
          </div>

          {/* Total Chat Time */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card dark:bg-[#111222] border border-border dark:border-white/[0.08] shadow-sm dark:shadow-md flex items-center gap-3.5 transition-colors">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-foreground dark:text-white tabular-nums block leading-none">
                {todayTotalTime || "0s"}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground dark:text-gray-400 mt-1 block">
                Total Chat Time
              </span>
            </div>
          </div>

          {/* Current Streak */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card dark:bg-[#111222] border border-border dark:border-white/[0.08] shadow-sm dark:shadow-md flex items-center gap-3.5 transition-colors">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-foreground dark:text-white tabular-nums block leading-none">
                {currentStreak ? `${currentStreak}d` : "1d"}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground dark:text-gray-400 mt-1 block">
                Current Streak
              </span>
            </div>
          </div>

          {/* Best Streak */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card dark:bg-[#111222] border border-border dark:border-white/[0.08] shadow-sm dark:shadow-md flex items-center gap-3.5 transition-colors">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-foreground dark:text-white tabular-nums block leading-none">
                {longestStreak ? `${longestStreak}d` : "2d"}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground dark:text-gray-400 mt-1 block">
                Best Streak
              </span>
            </div>
          </div>
        </div>

        {/* 5. MIDDLE ROW: Presence Status & About Me */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Presence Status */}
          <div className="p-5 rounded-2xl sm:rounded-3xl bg-card dark:bg-[#111222] border border-border dark:border-white/[0.08] shadow-sm dark:shadow-lg flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                <h3 className="text-xs sm:text-sm font-bold text-foreground dark:text-white">Presence Status</h3>
              </div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-0.5">Let others know your vibe</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-4">
              {MOOD_PRESETS.map((m) => {
                const isSelected = profile.mood === m || (!profile.mood && m === "😊 Chill");
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updateMood(m)}
                    className={cn(
                      "text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all cursor-pointer shrink-0 border",
                      isSelected
                        ? "bg-[#6366f1] text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-105"
                        : "bg-secondary dark:bg-[#181928] text-secondary-foreground dark:text-gray-300 border-border dark:border-white/[0.06] hover:bg-secondary/80 dark:hover:bg-white/[0.08]"
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* About Me */}
          <div className="p-5 rounded-2xl sm:rounded-3xl bg-card dark:bg-[#111222] border border-border dark:border-white/[0.08] shadow-sm dark:shadow-lg flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <h3 className="text-xs sm:text-sm font-bold text-foreground dark:text-white">About Me</h3>
              </div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-0.5">Tell something about yourself (optional)</p>
            </div>

            <div className="relative mt-3">
              <textarea
                value={bio}
                onChange={(e) => handleSaveBio(e.target.value.slice(0, 200))}
                rows={2}
                placeholder="Good games. Good people. Always up for a chat!"
                className="w-full bg-background dark:bg-[#161726] border border-border dark:border-white/[0.08] rounded-xl p-3 text-xs text-foreground dark:text-gray-200 placeholder:text-muted-foreground dark:placeholder:text-gray-500 outline-none focus:border-indigo-500/50 resize-none transition-colors"
              />
              <span className="absolute right-3 bottom-2.5 text-[10px] text-muted-foreground dark:text-gray-500 font-medium">
                {bio.length}/200
              </span>
            </div>
          </div>
        </div>

        {/* 6. BOTTOM ROW: Matchmaking Interests, Preferences & Account */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Matchmaking Interests */}
          <div className="p-5 rounded-2xl sm:rounded-3xl bg-card dark:bg-[#111222] border border-border dark:border-white/[0.08] shadow-sm dark:shadow-lg flex flex-col justify-between space-y-3 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <h3 className="text-xs sm:text-sm font-bold text-foreground dark:text-white">Matchmaking Interests</h3>
                </div>
                <span className="text-xs text-muted-foreground dark:text-gray-400 font-semibold">{interests.length}/{MAX_INTERESTS}</span>
              </div>
              <p className="text-[11px] text-muted-foreground dark:text-gray-400 mt-0.5">Add topics to find people with similar interests</p>
            </div>

            {/* Input & Add */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value.slice(0, MAX_LENGTH))}
                onKeyDown={(e) => e.key === "Enter" && handleAddInterest()}
                placeholder="Add a topic (e.g. gaming, music, coding...)"
                disabled={interests.length >= MAX_INTERESTS}
                className="flex-1 bg-background dark:bg-[#161726] border border-border dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-500 outline-none focus:border-indigo-500/50 disabled:opacity-50"
              />
              <Button
                size="sm"
                onClick={handleAddInterest}
                disabled={!customInput.trim() || interests.length >= MAX_INTERESTS}
                className="rounded-xl bg-[#6366f1] hover:bg-[#5254e0] text-white text-xs px-3 h-8 shrink-0 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>

            {/* Popular Tags */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-muted-foreground dark:text-gray-400 font-medium">Popular:</span>
              {["gaming", "music", "coding", "anime", "movies"].map((tag) => {
                if (interests.some((i) => i.toLowerCase() === tag.toLowerCase())) return null;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddQuickInterest(tag)}
                    className="text-[10px] text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white px-2 py-0.5 rounded-md bg-secondary dark:bg-[#181928] hover:bg-secondary/80 dark:hover:bg-[#202236] transition-colors border border-border/50 dark:border-white/[0.04]"
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>

            {/* Active Interests Chips */}
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {interests.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleRemoveInterest(interest)}
                    className="flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/25 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500 transition-all cursor-pointer"
                  >
                    <span>#{interest}</span>
                    <X className="w-3 h-3 opacity-60" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preferences */}
          <div className="p-5 rounded-2xl sm:rounded-3xl bg-card dark:bg-[#111222] border border-border dark:border-white/[0.08] shadow-sm dark:shadow-lg flex flex-col justify-between space-y-4 transition-colors">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-foreground dark:text-white flex items-center gap-2">
                <span className="text-indigo-500 dark:text-indigo-400">⚙️</span> Preferences
              </h3>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary-foreground dark:text-gray-300 font-medium flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Sound Effects
                </span>
                <Switch
                  checked={settings.soundEffects}
                  onCheckedChange={(val) => updateSetting("soundEffects", val)}
                  className="data-[state=checked]:bg-[#6366f1]"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary-foreground dark:text-gray-300 font-medium flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Push Notifications
                </span>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(val) => updateSetting("notifications", val)}
                  className="data-[state=checked]:bg-[#6366f1]"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary-foreground dark:text-gray-300 font-medium flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Screen Capture Protection
                </span>
                <Switch
                  checked={settings.protectionEnabled}
                  onCheckedChange={(val) => updateSetting("protectionEnabled", val)}
                  className="data-[state=checked]:bg-[#6366f1]"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 dark:border-white/[0.06] flex gap-2">
              <button
                type="button"
                onClick={copyInviteLink}
                className="flex-1 py-1.5 rounded-xl bg-secondary/60 dark:bg-white/[0.04] hover:bg-secondary dark:hover:bg-white/[0.08] border border-border dark:border-white/[0.08] text-[11px] font-semibold text-secondary-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Link Copied!" : `Invite Code: ${inviteCode}`}</span>
              </button>
            </div>
          </div>

          {/* Account */}
          <div className="p-5 rounded-2xl sm:rounded-3xl bg-card dark:bg-[#111222] border border-border dark:border-white/[0.08] shadow-sm dark:shadow-lg flex flex-col justify-between space-y-4 transition-colors">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-foreground dark:text-white flex items-center gap-2">
                <span className="text-cyan-500 dark:text-cyan-400">🔒</span> Account
              </h3>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setNameInput(displayName);
                  setIsEditProfileOpen(true);
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-secondary dark:hover:bg-white/[0.04] transition-colors text-left cursor-pointer group"
              >
                <span className="text-xs text-secondary-foreground dark:text-gray-300 group-hover:text-foreground dark:group-hover:text-white font-medium flex items-center gap-2">
                  <LinkIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Change Username
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground dark:text-gray-500 group-hover:text-foreground dark:group-hover:text-white transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-secondary dark:hover:bg-white/[0.04] transition-colors text-left cursor-pointer group"
              >
                <span className="text-xs text-secondary-foreground dark:text-gray-300 group-hover:text-foreground dark:group-hover:text-white font-medium flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Reset Progress
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground dark:text-gray-500 group-hover:text-foreground dark:group-hover:text-white transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left cursor-pointer group"
              >
                <span className="text-xs text-rose-600 dark:text-rose-400 group-hover:text-rose-700 dark:group-hover:text-rose-300 font-medium flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" /> Delete Account
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground dark:text-gray-500 italic pt-1">
              Zero accounts, zero cookies. Everything is ephemeral & stored locally.
            </p>
          </div>
        </div>

        {/* 7. FOOTER QUOTE */}
        <div className="pt-6 pb-2 text-center text-xs text-muted-foreground dark:text-gray-500 font-medium flex items-center justify-center gap-3">
          <div className="h-[1px] w-12 bg-border dark:bg-white/10" />
          <span>“Good games bring people together.” — <span className="text-foreground/80 dark:text-gray-400 font-bold tracking-wider">INCOGTALK</span></span>
          <div className="h-[1px] w-12 bg-border dark:bg-white/10" />
        </div>
      </main>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsEditProfileOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card dark:bg-[#111220] border border-border dark:border-white/15 rounded-3xl shadow-2xl p-6 space-y-4 text-foreground dark:text-white"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border dark:border-white/10">
                <h3 className="text-base font-bold">Edit Profile</h3>
                <button onClick={() => setIsEditProfileOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nickname Input & Shuffle */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground dark:text-gray-300">Username</label>
                <div className="flex items-center gap-2">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={20}
                    disabled={shuffling}
                    className="flex-1 rounded-xl bg-background dark:bg-[#161726] border border-border dark:border-white/10 px-3.5 py-2 text-sm font-bold text-foreground dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={triggerShuffleNickname}
                    disabled={shuffling}
                    className="h-10 w-10 rounded-xl bg-secondary dark:bg-white/[0.05] hover:bg-secondary/80 dark:hover:bg-white/10 border border-border dark:border-white/10 flex items-center justify-center text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white transition-all cursor-pointer"
                    title="Random Nickname"
                  >
                    <RefreshCw className={cn("w-4 h-4", shuffling && "animate-spin text-indigo-500")} />
                  </button>
                </div>
              </div>

              {/* Bio / About Me */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground dark:text-gray-300">About Me / Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => handleSaveBio(e.target.value.slice(0, 200))}
                  rows={3}
                  className="w-full rounded-xl bg-background dark:bg-[#161726] border border-border dark:border-white/10 p-3 text-xs text-foreground dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-border dark:border-white/10 text-xs"
                  onClick={() => setIsEditProfileOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-[#6366f1] hover:bg-[#5254e0] text-white text-xs font-bold"
                  onClick={() => {
                    handleSaveName();
                    toast.success("Profile updated!");
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Progress Confirmation Dialog */}
      <AnimatePresence>
        {isResetConfirmOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsResetConfirmOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card dark:bg-[#111220] border border-border dark:border-white/15 rounded-3xl shadow-2xl p-6 space-y-4 text-center text-foreground dark:text-white"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold">Reset Progress Stats?</h3>
              <p className="text-xs text-muted-foreground dark:text-gray-400">
                This will reset your today chat counter and session time back to zero.
              </p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl border-border dark:border-white/10 text-xs" onClick={() => setIsResetConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                  onClick={() => {
                    localStorage.removeItem("echo_session_stats");
                    toast.success("Stats reset!");
                    setIsResetConfirmOpen(false);
                    window.location.reload();
                  }}
                >
                  Reset Stats
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Account Confirmation Dialog */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsDeleteConfirmOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card dark:bg-[#111220] border border-rose-300 dark:border-rose-500/30 rounded-3xl shadow-2xl p-6 space-y-4 text-center text-foreground dark:text-white"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold">Clear Anonymous Persona?</h3>
              <p className="text-xs text-muted-foreground dark:text-gray-400">
                This clears all local persona data, interests, and preferences, generating a completely clean slate.
              </p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl border-border dark:border-white/10 text-xs" onClick={() => setIsDeleteConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    toast.success("Anonymous data cleared!");
                    setIsDeleteConfirmOpen(false);
                    setTimeout(() => {
                      window.location.href = "/";
                    }, 500);
                  }}
                >
                  Clear All
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Avatar Picker Modal */}
      <AnimatePresence>
        {showAvatarModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAvatarModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card dark:bg-[#111220] border border-border dark:border-white/15 rounded-3xl shadow-2xl p-5 space-y-4 overflow-hidden text-foreground dark:text-white"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border dark:border-white/10">
                <h3 className="text-base font-bold">Choose Profile Avatar</h3>
                <button onClick={() => setShowAvatarModal(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex rounded-xl bg-secondary dark:bg-white/[0.05] p-1">
                <button
                  onClick={() => setAvatarTab("upload")}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    avatarTab === "upload" ? "bg-[#6366f1] text-white shadow-sm" : "text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white"
                  )}
                >
                  <Upload className="h-3.5 w-3.5" /> Upload Custom Photo
                </button>
                <button
                  onClick={() => setAvatarTab("emojis")}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    avatarTab === "emojis" ? "bg-[#6366f1] text-white shadow-sm" : "text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white"
                  )}
                >
                  <Smile className="h-3.5 w-3.5" /> Preset Avatars
                </button>
              </div>

              {/* Tab Content */}
              {avatarTab === "upload" ? (
                <div className="space-y-4 text-center py-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleCustomImageUpload}
                    className="hidden"
                  />

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-2xl p-6 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                      <Camera className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground dark:text-white">Click to upload custom photo</p>
                      <p className="text-[10px] text-muted-foreground dark:text-gray-400 font-medium">Supports JPG, PNG, WEBP</p>
                    </div>
                  </div>

                  <button
                    onClick={handleResetToTarget}
                    className="w-full py-2 rounded-xl bg-secondary dark:bg-white/[0.05] hover:bg-secondary/80 dark:hover:bg-white/10 border border-border dark:border-white/10 text-xs font-bold text-secondary-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <div className="w-5 h-5">
                      <BullseyeDartAvatar />
                    </div>
                    <span>Reset to Bullseye Dart Avatar (Default)</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto scrollbar-thin p-1">
                    {/* First option: Bullseye target */}
                    <button
                      onClick={handleResetToTarget}
                      className={cn(
                        "h-11 w-11 rounded-2xl p-1.5 flex items-center justify-center transition-all hover:scale-110 bg-secondary/50 dark:bg-white/[0.04]",
                        showBullseye ? "bg-indigo-600/30 border-2 border-indigo-400 shadow-md" : ""
                      )}
                      title="Bullseye Dart Avatar"
                    >
                      <BullseyeDartAvatar />
                    </button>

                    {AVATAR_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          updateAvatar(emoji);
                          setShowAvatarModal(false);
                        }}
                        className={cn(
                          "h-11 w-11 rounded-2xl text-2xl flex items-center justify-center transition-all hover:scale-110 hover:bg-indigo-500/20",
                          (!isCustomAvatarImage && profile.avatar === emoji) ? "bg-indigo-600/30 border-2 border-indigo-400" : "bg-secondary/50 dark:bg-white/[0.04]"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Crop Modal */}
      <AnimatePresence>
        {cropImage && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card dark:bg-[#111220] border border-border dark:border-white/15 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-foreground dark:text-white"
            >
              <h3 className="text-sm font-bold text-center">Adjust Profile Photo</h3>

              {/* Preview */}
              <div className="bg-secondary/60 dark:bg-white/[0.04] border border-border dark:border-white/10 rounded-2xl p-2.5 space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground dark:text-gray-400 uppercase tracking-wider text-center flex items-center justify-center gap-1">
                  <span>👀</span> Preview: How others see you
                </p>
                <div className="flex items-center gap-2.5 bg-background dark:bg-black/40 p-2 rounded-xl border border-border dark:border-white/10">
                  <div className="h-9 w-9 rounded-full overflow-hidden bg-black/40 border border-indigo-400/40 shrink-0 flex items-center justify-center relative">
                    <img 
                      src={cropImage} 
                      alt="Avatar Preview" 
                      className="w-full h-full object-cover origin-center pointer-events-none select-none"
                      style={{
                        transform: `scale(${zoom}) translate(${panX / 2}px, ${panY / 2}px) rotate(${rotation}deg)`
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-bold text-foreground dark:text-white truncate">{displayName}</p>
                    <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1 leading-none mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span>{profile.mood || "Online"}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Drag & Pinch Cropper Frame */}
              <div 
                onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
                onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleTouchStartCombined}
                onTouchMove={handleTouchMoveCombined}
                onTouchEnd={handleTouchEndCombined}
                onWheel={handleWheelZoom}
                className={cn(
                  "w-48 h-48 mx-auto relative rounded-full overflow-hidden border-4 border-indigo-500/50 bg-black/40 flex items-center justify-center shadow-inner cursor-grab select-none touch-none",
                  isDragging && "cursor-grabbing"
                )}
              >
                <img 
                  src={cropImage} 
                  alt="Crop Target" 
                  className="w-full h-full object-cover origin-center pointer-events-none select-none"
                  style={{
                    transform: `scale(${zoom}) translate(${panX}px, ${panY}px) rotate(${rotation}deg)`
                  }}
                />
              </div>

              {/* Controls & Rotation */}
              <div className="space-y-2 bg-secondary/50 dark:bg-white/[0.04] p-3 rounded-2xl border border-border dark:border-white/10">
                <p className="text-[11px] text-muted-foreground dark:text-gray-400 text-center font-bold flex items-center justify-center gap-1">
                  <span>🤏</span> Pinch or drag to position
                </p>

                {/* Rotate Button */}
                <div className="flex items-center justify-between pt-1 border-t border-border/50 dark:border-white/10">
                  <span className="text-[10px] font-bold text-muted-foreground dark:text-gray-400 uppercase">Rotate Image</span>
                  <button
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="px-3 py-1 bg-secondary dark:bg-white/[0.06] hover:bg-secondary/80 dark:hover:bg-white/10 border border-border dark:border-white/10 text-xs font-semibold rounded-lg text-foreground dark:text-white transition-all flex items-center gap-1 active:scale-95"
                  >
                    <RotateCw className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" /> {rotation}°
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setCropImage(null)}
                  className="flex-1 py-2 rounded-xl border border-border dark:border-white/10 bg-secondary dark:bg-white/[0.05] text-xs font-bold text-secondary-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyCrop}
                  className="flex-1 py-2 rounded-xl bg-[#6366f1] hover:bg-[#5254e0] text-white text-xs font-bold transition-all shadow-md"
                >
                  Apply & Save
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <MobileNav />
    </div>
  );
};

export default ProfilePage;


