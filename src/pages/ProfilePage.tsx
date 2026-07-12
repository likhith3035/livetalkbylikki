import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Pencil, Check, Shield, Shuffle, Tags, Plus, X, 
  MessageSquare, Clock, Zap, Award, Copy, Volume2, 
  VolumeX, Bell, BellOff, ShieldCheck, Upload, RefreshCw,
  Maximize2, RotateCw, Smile, Calendar, History, Trophy
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

const ProfilePage = () => {
  const navigate = useNavigate();
  const onlineCount = useOnlineCount();
  const { profile, displayName, updateNickname, updateAvatar, updateMood, AVATAR_OPTIONS } = useProfile();
  const { todayConversations, todayTotalTime, currentStreak, longestStreak } = useSessionStats();
  const { settings, updateSetting } = useSettings();

  useSEO({ 
    title: "My Profile – LiveTalk", 
    description: "Manage your LiveTalk profile — set your nickname and choose a fun avatar for your anonymous chats.",
    keywords: "chat profile, anonymous nickname, chat avatar, personalize chat, LiveTalk profile"
  });

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.nickname);
  const [showAvatars, setShowAvatars] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  
  // Interactive cropping states
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Tabbed Bento Console State
  const [activeTab, setActiveTab] = useState<"stats" | "timeline" | "milestones">("stats");

  // Strict matching option state
  const [strictMatch, setStrictMatch] = useState(() => {
    try {
      return localStorage.getItem("lchat.strictMatching") === "true";
    } catch {
      return false;
    }
  });

  // Invite & Stats Share state
  const [inviteCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [copied, setCopied] = useState(false);
  const [statsCopied, setStatsCopied] = useState(false);

  // Interests state local representation synced with localStorage
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
    const updated = [...interests, val];
    handleSaveInterests(updated);
    setCustomInput("");
  };

  const handleAddQuickInterest = (val: string) => {
    if (interests.length >= MAX_INTERESTS) return;
    if (interests.some(i => i.toLowerCase() === val.toLowerCase())) return;
    const updated = [...interests, val];
    handleSaveInterests(updated);
  };

  const handleRemoveInterest = (interest: string) => {
    const updated = interests.filter(i => i !== interest);
    handleSaveInterests(updated);
  };

  const handleSaveName = () => {
    updateNickname(nameInput.trim());
    setEditingName(false);
  };

  // Nickname Generator Lists
  const prefixes = ["Cyber", "Neon", "Cosmic", "Quantum", "Shadow", "Retro", "Lunar", "Solar", "Turbo", "Vibe", "Digital", "Alpha", "Hyper", "Crypto", "Nova"];
  const suffixes = ["Fox", "Spectre", "Rider", "Ghost", "Ninja", "Glitch", "Drifter", "Pioneer", "Echo", "Wave", "Knight", "Oracle", "Spark", "Phantom", "Apex"];
  
  // Slot-Machine Shuffler
  const shuffleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerShuffleNickname = () => {
    if (shuffling) return;
    setShuffling(true);
    setEditingName(true);

    let counter = 0;
    const maxCycles = 10; 

    shuffleIntervalRef.current = setInterval(() => {
      const p = prefixes[Math.floor(Math.random() * prefixes.length)];
      const s = suffixes[Math.floor(Math.random() * suffixes.length)];
      const num = Math.floor(Math.random() * 90) + 10;
      setNameInput(`${p}${s}${num}`);
      
      counter++;
      if (counter >= maxCycles) {
        if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);
        const finalP = prefixes[Math.floor(Math.random() * prefixes.length)];
        const finalS = suffixes[Math.floor(Math.random() * suffixes.length)];
        const finalNum = Math.floor(Math.random() * 90) + 10;
        const finalName = `${finalP}${finalS}${finalNum}`;
        setNameInput(finalName);
        updateNickname(finalName);
        setEditingName(false);
        setShuffling(false);
      }
    }, 40);
  };

  useEffect(() => {
    return () => {
      if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);
    };
  }, []);

  // Strict Matching Toggle logic
  const handleStrictMatchToggle = (val: boolean) => {
    setStrictMatch(val);
    try {
      localStorage.setItem("lchat.strictMatching", String(val));
    } catch {}
  };

  // Custom Image Upload + Canvas Resize/Compression
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Direct dragging handlers
  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStart.current = { x: clientX - panX, y: clientY - panY };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;

    // Direct pan translation vector adjustments mapping relative to rotation steps
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

  const handleApplyCrop = () => {
    if (!cropImage) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 128; // compact size to keep under localStorage quota
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, size, size);

        // Center drawing coordinate space to allow rotation
        ctx.translate(size / 2, size / 2);
        ctx.rotate((rotation * Math.PI) / 180);

        // Cropping dimensions based on zoom scale
        const minDim = Math.min(img.width, img.height);
        const cropWidth = minDim / zoom;
        const cropHeight = minDim / zoom;

        // Panning offsets mapping: translate panX and panY (-80 to 80) into actual pixel offset relative to center crop
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

        const base64 = canvas.toDataURL("image/jpeg", 0.7); // 70% quality compression
        updateAvatar(base64);
        setCropImage(null);
        setShowAvatars(false);
      }
    };
    img.src = cropImage;
  };

  const handleResetToEmoji = () => {
    updateAvatar("😀");
    setShowAvatars(false);
  };

  // Gamified User Rank System
  const getRankProgress = (chats: number) => {
    if (chats === 0) {
      return {
        rank: "Anonymous Explorer",
        next: "Initiate Talker 💬",
        percent: 0,
        desc: "Complete 1 chat to rank up"
      };
    }
    if (chats <= 2) {
      return {
        rank: "Initiate Talker",
        next: "Social Spark ⚡",
        percent: Math.round((chats / 3) * 100),
        desc: `${3 - chats} more chats to rank up`
      };
    }
    if (chats <= 5) {
      return {
        rank: "Social Spark",
        next: "Vibe Ambassador 🌟",
        percent: Math.round(((chats - 2) / 4) * 100),
        desc: `${6 - chats} more chats to rank up`
      };
    }
    if (chats <= 9) {
      return {
        rank: "Vibe Ambassador",
        next: "Cosmic Chatmaster 👑",
        percent: Math.round(((chats - 5) / 5) * 100),
        desc: `${10 - chats} more chats to rank up`
      };
    }
    return {
      rank: "Cosmic Chatmaster",
      next: "Max Rank Achieved 🎉",
      percent: 100,
      desc: "You are a matchmaking legend!"
    };
  };

  const getRankBadgeInfo = (chats: number) => {
    if (chats === 0) {
      return { 
        color: "border-muted-foreground/30 text-muted-foreground bg-muted-foreground/5", 
        glow: "shadow-[0_0_8px_rgba(150,150,150,0.2)]",
        emoji: "🕶️" 
      };
    }
    if (chats <= 2) {
      return { 
        color: "border-cyan-500/40 text-cyan-400 bg-cyan-500/5", 
        glow: "shadow-[0_0_12px_rgba(6,182,212,0.4)]",
        emoji: "💬" 
      };
    }
    if (chats <= 5) {
      return { 
        color: "border-amber-500/40 text-amber-400 bg-amber-500/5", 
        glow: "shadow-[0_0_12px_rgba(245,158,11,0.5)]",
        emoji: "⚡" 
      };
    }
    if (chats <= 9) {
      return { 
        color: "border-primary/50 text-primary bg-primary/5", 
        glow: "shadow-[0_0_12px_rgba(139,92,246,0.5)]",
        emoji: "🌟" 
      };
    }
    return { 
      color: "border-yellow-500/50 text-yellow-400 bg-yellow-500/5 animate-pulse", 
      glow: "shadow-[0_0_15px_rgba(234,179,8,0.6)]",
      emoji: "👑" 
    };
  };

  const rankData = getRankProgress(todayConversations);
  const badgeInfo = getRankBadgeInfo(todayConversations);

  // Invite copy
  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/room/${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Stats copy summary
  const copyStatsSummary = () => {
    const summary = `🚀 LiveTalk Chat Stats:\n👤 Nickname: ${displayName}\n🏆 Reputation Rank: ${rankData.rank} ${badgeInfo.emoji}\n💬 Chats Completed: ${todayConversations}\n⏱️ Chat Time: ${todayTotalTime || "0s"}\n🔥 Active Streak: ${currentStreak}d (Best: ${longestStreak}d)\nJoin the vibe: ${window.location.origin}`;
    navigator.clipboard.writeText(summary);
    setStatsCopied(true);
    setTimeout(() => setStatsCopied(false), 2000);
  };

  const isCustomAvatarImage = profile.avatar.startsWith("data:image/");

  // Mood selector presets
  const moodPresets = ["💬 Chatty", "🎮 Gaming", "🎧 Listening", "😴 Chill", "🍿 Movies", "🔥 Active"];

  return (
    <div className="flex h-screen flex-col bg-background relative overflow-hidden select-none font-body">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none page-bg-orbs">
        <div className="absolute top-[10%] left-[-10%] w-64 h-64 rounded-full bg-primary/10 blur-[100px] float-slow" />
        <div className="absolute bottom-[20%] right-[-5%] w-80 h-80 rounded-full bg-accent/8 blur-[120px] float-medium" />
      </div>

      <Header onlineCount={onlineCount} />

      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 relative z-10 overflow-hidden w-full max-h-[calc(100vh-64px-56px)]">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
          className="w-full max-w-2xl bg-card border border-border/40 rounded-[2rem] p-4 sm:p-5 shadow-2xl shadow-primary/5 flex flex-col gap-4 relative overflow-hidden max-h-full"
        >
          {/* Rotating Neon Border Glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/30 to-accent/20 rounded-[2rem] -z-10 opacity-70 blur-[1px]" />

          {/* Desktop/Tablet 2-Column Bento Layout, Mobile Single-Column */}
          <div className="grid md:grid-cols-2 gap-4 items-start overflow-hidden w-full">
            
            {/* Left Side: Profile Identity, Ranks & Moods */}
            <div className="space-y-4 flex flex-col justify-between overflow-hidden">
              
              {/* Identity Horizontal Card */}
              <div className="flex flex-col gap-3 bg-secondary/15 border border-border/20 p-3.5 rounded-2xl relative w-full overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="flex items-center gap-3">
                  {/* Glowing Reputation Badge Wrapper */}
                  <div className="relative shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAvatars(!showAvatars)}
                      className="relative flex h-14 w-14 items-center justify-center rounded-full bg-secondary border border-primary/25 shadow-sm hover:border-primary/45 hover:shadow-md transition-all overflow-hidden"
                    >
                      {isCustomAvatarImage ? (
                        <img src={profile.avatar} alt="Avatar" className="h-full w-full object-cover rounded-full pointer-events-none" />
                      ) : (
                        <span className="text-2xl">{profile.avatar}</span>
                      )}
                      <span className="absolute bottom-0 right-0 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow border border-card z-10">
                        <Pencil className="h-2.5 w-2.5" />
                      </span>
                    </motion.button>

                    {/* Glowing Rank Ring Badge */}
                    <div 
                      className={cn(
                        "absolute -inset-1 rounded-full border pointer-events-none -z-10", 
                        badgeInfo.color, 
                        badgeInfo.glow
                      )} 
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 w-full">
                      {editingName ? (
                        <div className="flex items-center gap-1 w-full">
                          <input
                            autoFocus
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                            maxLength={20}
                            disabled={shuffling}
                            placeholder="Name..."
                            className="w-full min-w-0 rounded-lg border border-border bg-secondary/40 px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                          />
                          <Button size="icon" className="h-7 w-7 shrink-0 rounded-lg" onClick={handleSaveName} disabled={shuffling}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <button
                            type="button"
                            onClick={triggerShuffleNickname}
                            disabled={shuffling}
                            className={cn(
                              "h-7 w-7 shrink-0 flex items-center justify-center rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all hover:bg-secondary/70",
                              shuffling && "animate-spin text-primary"
                            )}
                            title="Generate Nickname"
                          >
                            <Shuffle className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h1 className="text-base font-bold font-display tracking-tight text-foreground truncate max-w-[90px] sm:max-w-[110px]">{displayName}</h1>
                          <button
                            onClick={() => {
                              setNameInput(profile.nickname);
                              setEditingName(true);
                            }}
                            className="p-1 rounded-md bg-secondary border border-border/40 text-muted-foreground hover:text-foreground transition-all shrink-0 hover:scale-105"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={triggerShuffleNickname}
                            className="p-1 rounded-md bg-secondary border border-border/40 text-muted-foreground hover:text-foreground transition-all shrink-0 hover:scale-105"
                            title="Quick Shuffle Nickname"
                          >
                            <Shuffle className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Rank Info */}
                    <div className="flex items-center gap-1 mt-0.5 leading-none">
                      <span className="text-[10px] font-bold text-primary tracking-wider uppercase">
                        {rankData.rank}
                      </span>
                      <span className="text-[10px] text-foreground shrink-0 select-none">
                        {badgeInfo.emoji}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mood Status Display & Selector Presets */}
                <div className="border-t border-border/10 pt-2 flex flex-col gap-1.5 w-full">
                  <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground uppercase">
                    <span className="flex items-center gap-1"><Smile className="h-3 w-3 text-primary/70" /> Presence Status</span>
                    {profile.mood && (
                      <button 
                        onClick={() => updateMood("")} 
                        className="text-muted-foreground hover:text-foreground normal-case font-semibold text-[8px] flex items-center gap-0.5 hover:scale-105 transition-all"
                      >
                        clear <X className="h-2 w-2" />
                      </button>
                    )}
                  </div>
                  
                  {/* Preset chips */}
                  <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5 flex-wrap">
                    {moodPresets.map((m) => (
                      <button
                        key={m}
                        onClick={() => updateMood(m)}
                        className={cn(
                          "text-[9px] font-semibold px-2 py-0.5 rounded-lg border transition-all shrink-0 hover:scale-105",
                          profile.mood === m 
                            ? "bg-primary/20 border-primary/40 text-primary" 
                            : "bg-secondary/40 border-border/20 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rank Level-up Progress Bar */}
                <div className="space-y-1 border-t border-border/10 pt-2">
                  <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                    <span>Rank Progress</span>
                    <span>{rankData.desc}</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${rankData.percent}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Inline Collapsible Avatar Picker Drawer */}
              <AnimatePresence>
                {showAvatars && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="w-full overflow-hidden border-t border-border/10 pt-1"
                  >
                    <div className="flex flex-col gap-2 rounded-xl bg-secondary/20 p-2 border border-border/30 max-h-36 overflow-y-auto scrollbar-thin">
                      
                      {/* Image Upload controls */}
                      <div className="flex gap-2 items-center justify-between pb-2 border-b border-border/15">
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          accept="image/*" 
                          onChange={handleCustomImageUpload} 
                          className="hidden" 
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-[10px] font-semibold rounded-lg text-primary transition-all"
                        >
                          <Upload className="h-3 w-3" /> Upload Custom Photo
                        </button>
                        {isCustomAvatarImage && (
                          <button
                            onClick={handleResetToEmoji}
                            className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 border border-border/40 text-[10px] font-semibold rounded-lg text-muted-foreground hover:text-foreground transition-all"
                          >
                            <RefreshCw className="h-3 w-3" /> Reset
                          </button>
                        )}
                      </div>

                      {/* Emoji Grid */}
                      <div className="grid grid-cols-6 gap-1">
                        {AVATAR_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              updateAvatar(emoji);
                              setShowAvatars(false);
                            }}
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-all hover:scale-115 hover:bg-primary/20",
                              (!isCustomAvatarImage && profile.avatar === emoji) ? "bg-primary/25 ring-1 ring-primary scale-105" : "bg-card/40"
                            )}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Console Quick Action Settings strip */}
              <div className="flex items-center justify-between bg-secondary/10 border border-border/10 rounded-xl p-2 px-3">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground font-display">Console Config</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => updateSetting("soundEffects", !settings.soundEffects)}
                    className={cn(
                      "h-7 w-7 rounded-lg border flex items-center justify-center transition-all",
                      settings.soundEffects 
                        ? "bg-primary/20 border-primary/40 text-primary" 
                        : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                    )}
                    title={settings.soundEffects ? "Sound effects active" : "Sound effects muted"}
                  >
                    {settings.soundEffects ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => updateSetting("notifications", !settings.notifications)}
                    className={cn(
                      "h-7 w-7 rounded-lg border flex items-center justify-center transition-all",
                      settings.notifications 
                        ? "bg-primary/20 border-primary/40 text-primary" 
                        : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                    )}
                    title={settings.notifications ? "Notifications enabled" : "Notifications disabled"}
                  >
                    {settings.notifications ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => updateSetting("protectionEnabled", !settings.protectionEnabled)}
                    className={cn(
                      "h-7 w-7 rounded-lg border flex items-center justify-center transition-all",
                      settings.protectionEnabled 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                        : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                    )}
                    title={settings.protectionEnabled ? "Screen capture protection on" : "Screen capture protection off"}
                  >
                    {settings.protectionEnabled ? <ShieldCheck className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

            </div>

            {/* Right Side: Bento Console Tabs & Matchmaking Interests */}
            <div className="space-y-4 overflow-hidden w-full">
              
              {/* Matchmaking Interests Section */}
              <div className="bg-secondary/5 border border-border/10 rounded-2xl p-3 sm:p-4 space-y-2 flex flex-col overflow-hidden">
                
                {/* Interests header */}
                <div className="flex items-center justify-between pb-1 border-b border-border/10 mb-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-primary/80 uppercase tracking-wider font-display">
                    <Tags className="h-3.5 w-3.5 text-primary" /> Matchmaking Interests
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">{interests.length}/{MAX_INTERESTS}</span>
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value.slice(0, MAX_LENGTH))}
                    onKeyDown={(e) => e.key === "Enter" && handleAddInterest()}
                    placeholder="Search or add tags..."
                    disabled={interests.length >= MAX_INTERESTS}
                    className="flex-1 min-w-0 rounded-lg border border-border bg-secondary/40 px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                  />
                  <Button
                    onClick={handleAddInterest}
                    disabled={!customInput.trim() || interests.length >= MAX_INTERESTS}
                    size="sm"
                    className="h-7 rounded-lg px-2 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Popular Quick Suggestions Tags */}
                {interests.length < MAX_INTERESTS && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[8px] font-extrabold text-muted-foreground/60 uppercase">Popular:</span>
                    {["gaming", "music", "coding", "anime"].map((tag) => {
                      const alreadyAdded = interests.some(i => i.toLowerCase() === tag.toLowerCase());
                      if (alreadyAdded) return null;
                      return (
                        <button
                          key={tag}
                          onClick={() => handleAddQuickInterest(tag)}
                          className="text-[9px] font-semibold text-muted-foreground hover:text-primary bg-secondary/30 px-2 py-0.5 rounded-md hover:bg-primary/10 transition-colors border border-border/20"
                        >
                          +{tag}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex-1 min-h-[44px] max-h-[64px] overflow-y-auto scrollbar-thin pr-1">
                  {interests.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {interests.map((interest) => (
                        <button
                          key={interest}
                          onClick={() => handleRemoveInterest(interest)}
                          className="flex items-center gap-0.5 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-semibold text-primary hover:bg-primary/20 transition-all shrink-0 hover:scale-102"
                        >
                          {interest}
                          <X className="h-2.5 w-2.5 opacity-60" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[9px] text-muted-foreground/80 leading-normal">
                      Add topics like gaming, music, coding, anime to match with like-minded strangers.
                    </p>
                  )}
                </div>

                {/* Strict matching mode toggle */}
                <div className="flex items-center justify-between border-t border-border/10 pt-2.5 mt-1.5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-foreground">Strict Matchmaker Mode</span>
                    <span className="text-[8px] text-muted-foreground">Only match with common interests</span>
                  </div>
                  <Switch
                    checked={strictMatch}
                    onCheckedChange={handleStrictMatchToggle}
                    className="data-[state=checked]:bg-primary h-5 w-9 shrink-0 scale-90"
                  />
                </div>
              </div>

              {/* Bento Tabbed Console Grid */}
              <div className="bg-secondary/5 border border-border/10 rounded-2xl p-3 sm:p-4 space-y-3 overflow-hidden flex flex-col h-[180px]">
                
                {/* Header selectors */}
                <div className="flex items-center justify-between border-b border-border/15 pb-2 shrink-0">
                  <div className="flex gap-1.5 bg-secondary/35 p-0.5 rounded-lg border border-border/30">
                    <button
                      onClick={() => setActiveTab("stats")}
                      className={cn(
                        "text-[9px] font-bold px-2 py-1 rounded-md transition-all flex items-center gap-1",
                        activeTab === "stats" 
                          ? "bg-background text-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Trophy className="h-2.5 w-2.5 text-primary" /> Stats
                    </button>
                    <button
                      onClick={() => setActiveTab("timeline")}
                      className={cn(
                        "text-[9px] font-bold px-2 py-1 rounded-md transition-all flex items-center gap-1",
                        activeTab === "timeline" 
                          ? "bg-background text-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <History className="h-2.5 w-2.5 text-cyan-400" /> Timeline
                    </button>
                    <button
                      onClick={() => setActiveTab("milestones")}
                      className={cn(
                        "text-[9px] font-bold px-2 py-1 rounded-md transition-all flex items-center gap-1",
                        activeTab === "milestones" 
                          ? "bg-background text-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Zap className="h-2.5 w-2.5 text-amber-400" /> Tasks
                    </button>
                  </div>

                  <div className="flex gap-1">
                    {activeTab === "stats" && (
                      <button
                        onClick={copyStatsSummary}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-secondary hover:bg-secondary/80 border border-border/40 text-[8px] font-bold text-foreground transition-all shrink-0"
                      >
                        {statsCopied ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Copy className="h-2.5 w-2.5" />}
                        {statsCopied ? "Copied!" : "Share"}
                      </button>
                    )}
                    <button
                      onClick={copyInviteLink}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-secondary hover:bg-secondary/80 border border-border/40 text-[8px] font-bold text-foreground transition-all shrink-0"
                    >
                      {copied ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Copy className="h-2.5 w-2.5" />}
                      {copied ? "Link Copied!" : `Invite: ${inviteCode}`}
                    </button>
                  </div>
                </div>

                {/* Tab content view */}
                <div className="flex-1 overflow-hidden">
                  <AnimatePresence mode="wait">
                    {activeTab === "stats" && (
                      <motion.div
                        key="stats"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="grid grid-cols-2 gap-1.5 w-full h-full"
                      >
                        {/* Chats Today */}
                        <div className="bg-secondary/20 border border-border/20 rounded-xl p-1.5 text-center flex flex-col items-center justify-center hover:border-primary/30 transition-all">
                          <MessageSquare className="h-3 w-3 text-primary mb-0.5" />
                          <p className="text-sm font-bold font-display tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-none">{todayConversations}</p>
                          <p className="text-[7.5px] uppercase font-extrabold text-muted-foreground/85 tracking-wider mt-0.5 leading-none">Chats Today</p>
                        </div>

                        {/* Total Time */}
                        <div className="bg-secondary/20 border border-border/20 rounded-xl p-1.5 text-center flex flex-col items-center justify-center hover:border-primary/30 transition-all">
                          <Clock className="h-3 w-3 text-cyan-500 mb-0.5" />
                          <p className="text-sm font-bold font-display tracking-tight bg-gradient-to-r from-cyan-500 to-primary bg-clip-text text-transparent leading-none">{todayTotalTime || "0s"}</p>
                          <p className="text-[7.5px] uppercase font-extrabold text-muted-foreground/85 tracking-wider mt-0.5 leading-none">Chat Time</p>
                        </div>

                        {/* Current Streak */}
                        <div className="bg-secondary/20 border border-border/20 rounded-xl p-1.5 text-center flex flex-col items-center justify-center hover:border-primary/30 transition-all">
                          <Zap className="h-3 w-3 text-amber-500 mb-0.5 animate-pulse" />
                          <p className="text-sm font-bold font-display tracking-tight bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent leading-none">{currentStreak}d</p>
                          <p className="text-[7.5px] uppercase font-extrabold text-muted-foreground/85 tracking-wider mt-0.5 leading-none">Active Streak</p>
                        </div>

                        {/* Longest Streak */}
                        <div className="bg-secondary/20 border border-border/20 rounded-xl p-1.5 text-center flex flex-col items-center justify-center hover:border-primary/30 transition-all">
                          <Award className="h-3 w-3 text-emerald-500 mb-0.5" />
                          <p className="text-sm font-bold font-display tracking-tight bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent leading-none">{longestStreak}d</p>
                          <p className="text-[7.5px] uppercase font-extrabold text-muted-foreground/85 tracking-wider mt-0.5 leading-none">Longest Streak</p>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "timeline" && (
                      <motion.div
                        key="timeline"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-col gap-1 w-full h-full max-h-full overflow-y-auto scrollbar-thin pr-0.5 justify-center"
                      >
                        {/* 3 Presets of Recent matches logs */}
                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-secondary/25 border border-border/10 text-[9px] hover:border-primary/20 transition-all">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs">🦊</span>
                            <span className="font-bold text-foreground truncate max-w-[80px]">CyberSpectre</span>
                            <span className="text-muted-foreground/60">• 🎮 gaming</span>
                          </div>
                          <span className="text-[8px] text-muted-foreground font-semibold shrink-0">2m ago</span>
                        </div>

                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-secondary/25 border border-border/10 text-[9px] hover:border-primary/20 transition-all">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs">🤖</span>
                            <span className="font-bold text-foreground truncate max-w-[80px]">NeonFox</span>
                            <span className="text-muted-foreground/60">• general</span>
                          </div>
                          <span className="text-[8px] text-muted-foreground font-semibold shrink-0">1h ago</span>
                        </div>

                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-secondary/25 border border-border/10 text-[9px] hover:border-primary/20 transition-all">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs">🚀</span>
                            <span className="font-bold text-foreground truncate max-w-[80px]">RetroDrifter</span>
                            <span className="text-muted-foreground/60">• 🎧 music</span>
                          </div>
                          <span className="text-[8px] text-muted-foreground font-semibold shrink-0">1d ago</span>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "milestones" && (
                      <motion.div
                        key="milestones"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-col gap-1 w-full h-full max-h-full overflow-y-auto scrollbar-thin pr-0.5 justify-center"
                      >
                        {/* Milestone 1: First Chat completed */}
                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-secondary/25 border border-border/10 text-[9px]">
                          <span className="font-semibold text-foreground">First Chat Completed</span>
                          <span className={cn(
                            "text-[8px] font-bold px-1.5 py-0.5 rounded-md",
                            todayConversations > 0 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-muted text-muted-foreground"
                          )}>
                            {todayConversations > 0 ? "Completed" : "0 / 1"}
                          </span>
                        </div>

                        {/* Milestone 2: Vibe Master Rank */}
                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-secondary/25 border border-border/10 text-[9px]">
                          <span className="font-semibold text-foreground">Vibe Master Rank</span>
                          <span className={cn(
                            "text-[8px] font-bold px-1.5 py-0.5 rounded-md",
                            todayConversations >= 6 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-muted text-muted-foreground"
                          )}>
                            {todayConversations >= 6 ? "Completed" : `${todayConversations} / 6`}
                          </span>
                        </div>

                        {/* Milestone 3: Tag Collector */}
                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-secondary/25 border border-border/10 text-[9px]">
                          <span className="font-semibold text-foreground">Interests Architect (3+ tags)</span>
                          <span className={cn(
                            "text-[8px] font-bold px-1.5 py-0.5 rounded-md",
                            interests.length >= 3 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-muted text-muted-foreground"
                          )}>
                            {interests.length >= 3 ? "Completed" : `${interests.length} / 3`}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom security note and CTA buttons */}
          <div className="grid md:grid-cols-[1fr_auto] gap-3 items-center border-t border-border/15 pt-3 w-full">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/30 border border-border/30 text-muted-foreground text-[10px]">
              <Shield className="h-3.5 w-3.5 text-primary/60 shrink-0" />
              <p className="leading-tight">All profile data & statistics are stored completely locally on this device.</p>
            </div>
            
            <Link 
              to="/chat"
              className="w-full md:w-36 h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-xs flex items-center justify-center transition-all active:scale-[0.98] shadow-md shadow-primary/10"
            >
              Back to Chat
            </Link>
          </div>

        </motion.div>
      </main>

      {/* Interactive Drag-to-Position Image Cropper Modal */}
      <AnimatePresence>
        {cropImage && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/40 rounded-3xl max-w-[340px] w-full p-4 shadow-2xl flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/30 to-accent/20 rounded-3xl -z-10 opacity-70" />

              <h3 className="text-sm font-bold font-display tracking-tight text-foreground text-center">Adjust Avatar Photo</h3>

              {/* Direct Drag circular preview window */}
              <div 
                onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
                onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  handleDragStart(touch.clientX, touch.clientY);
                }}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  handleDragMove(touch.clientX, touch.clientY);
                }}
                onTouchEnd={handleDragEnd}
                className={cn(
                  "w-40 h-40 mx-auto relative rounded-full overflow-hidden border-2 border-primary/50 bg-black/40 flex items-center justify-center shadow-lg select-none cursor-grab",
                  isDragging && "cursor-grabbing"
                )}
              >
                <img 
                  src={cropImage} 
                  alt="Crop Target" 
                  className="max-w-none origin-center pointer-events-none select-none"
                  style={{
                    transform: `scale(${zoom}) translate(${panX}px, ${panY}px) rotate(${rotation}deg)`
                  }}
                />
                
                {/* Center dot guide */}
                <div className="absolute h-1 w-1 rounded-full bg-white/30 pointer-events-none" />
              </div>

              {/* Slider for zoom only & rotate */}
              <div className="space-y-2.5 bg-secondary/20 p-3 rounded-2xl border border-border/10">
                <p className="text-[8px] text-muted-foreground text-center font-semibold leading-normal uppercase">
                  👈 Drag image directly in circle to position it 👉
                </p>

                {/* Zoom control */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground uppercase">
                    <span className="flex items-center gap-1"><Maximize2 className="h-3 w-3" /> Zoom Scale</span>
                    <span>{zoom.toFixed(1)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="3.0" 
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Rotate button */}
                <div className="flex items-center justify-between border-t border-border/10 pt-2 mt-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Rotate Image</span>
                  <button
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-secondary hover:bg-secondary/80 border border-border/40 text-[9px] font-semibold rounded-lg text-foreground transition-all hover:scale-105"
                  >
                    <RotateCw className="h-3 w-3 text-primary" /> {rotation}°
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setCropImage(null)}
                  className="flex-1 h-8 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-[10px] font-bold text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyCrop}
                  className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] font-bold transition-all shadow-md"
                >
                  Apply Crop
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
