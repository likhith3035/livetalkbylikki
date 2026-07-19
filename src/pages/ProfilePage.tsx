import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Pencil, Check, Shield, Shuffle, Tags, Plus, X, 
  MessageSquare, Clock, Zap, Award, Copy, Volume2, 
  VolumeX, Bell, BellOff, ShieldCheck, Upload, RefreshCw,
  Maximize2, RotateCw, Smile, Camera, ChevronRight, Share2, Sparkles, User
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

const MOOD_PRESETS = ["💬 Chatty", "🎮 Gaming", "🎧 Listening", "😴 Chill", "🍿 Movies", "🔥 Active"];

const PREFIXES = ["Cyber", "Neon", "Cosmic", "Quantum", "Shadow", "Retro", "Lunar", "Solar", "Turbo", "Vibe", "Digital", "Alpha", "Hyper", "Crypto", "Nova"];
const SUFFIXES = ["Fox", "Spectre", "Rider", "Ghost", "Ninja", "Glitch", "Drifter", "Pioneer", "Echo", "Wave", "Knight", "Oracle", "Spark", "Phantom", "Apex"];

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
    } catch {
      // ignore
    }
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
    setEditingName(false);
  };

  const triggerShuffleNickname = () => {
    if (shuffling) return;
    setShuffling(true);
    setEditingName(true);

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

  const handleStrictMatchToggle = (val: boolean) => {
    setStrictMatch(val);
    try {
      localStorage.setItem("lchat.strictMatching", String(val));
    } catch {
      // ignore
    }
  };

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

  const handleResetToEmoji = () => {
    updateAvatar("😀");
    setShowAvatarModal(false);
  };

  // Rank Info
  const getRankProgress = (chats: number) => {
    if (chats === 0) return { rank: "Explorer", percent: 0, desc: "Complete 1 chat to level up" };
    if (chats <= 2) return { rank: "Initiate Talker", percent: Math.round((chats / 3) * 100), desc: `${3 - chats} more to level up` };
    if (chats <= 5) return { rank: "Social Spark", percent: Math.round(((chats - 2) / 4) * 100), desc: `${6 - chats} more to level up` };
    if (chats <= 9) return { rank: "Vibe Ambassador", percent: Math.round(((chats - 5) / 5) * 100), desc: `${10 - chats} more to level up` };
    return { rank: "Cosmic Chatmaster", percent: 100, desc: "Maximum Rank Achieved 🎉" };
  };

  const rankData = getRankProgress(todayConversations);
  const isCustomAvatarImage = profile.avatar.startsWith("data:image/");

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/room/${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyStatsSummary = () => {
    const summary = `🚀 LiveTalk Chat Stats:\n👤 Nickname: ${displayName}\n🏆 Rank: ${rankData.rank}\n💬 Chats: ${todayConversations}\n⏱️ Time: ${todayTotalTime || "0s"}\n🔥 Streak: ${currentStreak}d\nJoin: ${window.location.origin}`;
    navigator.clipboard.writeText(summary);
    setStatsCopied(true);
    setTimeout(() => setStatsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background font-body pb-24 lg:pb-8">
      <Header onlineCount={onlineCount} />

      <main className="flex-1 max-w-xl mx-auto w-full px-4 pt-4 space-y-5">

        {/* Profile Card Header */}
        <div className="relative rounded-3xl bg-card border border-border/50 shadow-xl overflow-hidden">
          {/* Top Banner Gradient */}
          <div className="h-28 bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          </div>

          {/* Profile Header Content */}
          <div className="px-5 pb-5 pt-0 relative">
            {/* Avatar with Camera Overlay Button */}
            <div className="relative -mt-14 mb-3 inline-block">
              <div 
                onClick={() => setShowAvatarModal(true)}
                className="group relative cursor-pointer h-24 w-24 rounded-full border-4 border-card bg-secondary flex items-center justify-center overflow-hidden shadow-xl hover:opacity-95 transition-all"
              >
                {isCustomAvatarImage ? (
                  <img src={profile.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl select-none">{profile.avatar}</span>
                )}
                
                {/* Camera Overlay on Hover/Tap */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[2px]">
                  <Camera className="h-6 w-6" />
                </div>
              </div>

              {/* Edit Icon Badge */}
              <button 
                onClick={() => setShowAvatarModal(true)}
                className="absolute bottom-1 right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all border-2 border-card"
                title="Change Avatar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Nickname & Level Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2 max-w-xs">
                    <input
                      autoFocus
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                      maxLength={20}
                      disabled={shuffling}
                      className="flex-1 rounded-xl border border-primary bg-secondary/50 px-3 py-1.5 text-sm font-bold text-foreground focus:outline-none"
                    />
                    <Button size="icon" className="h-8 w-8 rounded-xl shrink-0" onClick={handleSaveName} disabled={shuffling}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <button
                      type="button"
                      onClick={triggerShuffleNickname}
                      disabled={shuffling}
                      className={cn(
                        "h-8 w-8 rounded-xl border border-border bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 transition-all",
                        shuffling && "animate-spin text-primary"
                      )}
                      title="Shuffle Nickname"
                    >
                      <Shuffle className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-extrabold text-foreground tracking-tight truncate">{displayName}</h1>
                    <button
                      onClick={() => {
                        setNameInput(profile.nickname);
                        setEditingName(true);
                      }}
                      className="p-1.5 rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                      title="Edit Nickname"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={triggerShuffleNickname}
                      className="p-1.5 rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                      title="Random Nickname"
                    >
                      <Shuffle className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Level / Rank Badge */}
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                    🏆 {rankData.rank}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">{rankData.desc}</span>
                </div>
              </div>

              {/* Back to Chat Button */}
              <Link 
                to="/chat"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all self-start sm:self-auto"
              >
                Back to Chat <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Rank Progress Bar */}
            <div className="mt-4 pt-3 border-t border-border/30 space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                <span>Rank Progress</span>
                <span>{rankData.percent}%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${rankData.percent}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                />
              </div>
            </div>

            {/* Mood Selector */}
            <div className="mt-4 pt-3 border-t border-border/30 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                <span className="flex items-center gap-1.5"><Smile className="h-3.5 w-3.5 text-primary" /> Presence Status</span>
                {profile.mood && (
                  <button 
                    onClick={() => updateMood("")} 
                    className="text-muted-foreground hover:text-foreground text-[10px] font-semibold flex items-center gap-0.5"
                  >
                    Clear <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
              
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                {MOOD_PRESETS.map((m) => (
                  <button
                    key={m}
                    onClick={() => updateMood(m)}
                    className={cn(
                      "text-xs font-bold px-3 py-1.5 rounded-xl border transition-all shrink-0 active:scale-95",
                      profile.mood === m 
                        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                        : "bg-secondary/40 border-border/40 text-foreground hover:bg-secondary"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-card border border-border/40 shadow-sm flex flex-col items-center text-center">
            <MessageSquare className="h-5 w-5 text-primary mb-1" />
            <span className="text-xl font-extrabold text-foreground tabular-nums">{todayConversations}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Chats Today</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-card border border-border/40 shadow-sm flex flex-col items-center text-center">
            <Clock className="h-5 w-5 text-cyan-500 mb-1" />
            <span className="text-xl font-extrabold text-foreground tabular-nums">{todayTotalTime || "0s"}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Chat Time</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-card border border-border/40 shadow-sm flex flex-col items-center text-center">
            <Zap className="h-5 w-5 text-amber-500 mb-1" />
            <span className="text-xl font-extrabold text-foreground tabular-nums">{currentStreak}d</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Streak</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-card border border-border/40 shadow-sm flex flex-col items-center text-center">
            <Award className="h-5 w-5 text-emerald-500 mb-1" />
            <span className="text-xl font-extrabold text-foreground tabular-nums">{longestStreak}d</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Best Streak</span>
          </div>
        </div>

        {/* Matchmaking Interests */}
        <div className="p-4 rounded-3xl bg-card border border-border/40 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-foreground">
              <Tags className="h-4 w-4 text-primary" /> Matchmaking Interests
            </div>
            <span className="text-xs font-bold text-muted-foreground">{interests.length}/{MAX_INTERESTS}</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value.slice(0, MAX_LENGTH))}
              onKeyDown={(e) => e.key === "Enter" && handleAddInterest()}
              placeholder="Add topic (e.g. gaming, music)..."
              disabled={interests.length >= MAX_INTERESTS}
              className="flex-1 rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary disabled:opacity-50"
            />
            <Button
              onClick={handleAddInterest}
              disabled={!customInput.trim() || interests.length >= MAX_INTERESTS}
              size="sm"
              className="rounded-xl px-3 font-bold shrink-0"
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>

          {/* Quick tags */}
          {interests.length < MAX_INTERESTS && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Popular:</span>
              {["gaming", "music", "coding", "anime", "movies"].map((tag) => {
                if (interests.some(i => i.toLowerCase() === tag.toLowerCase())) return null;
                return (
                  <button
                    key={tag}
                    onClick={() => handleAddQuickInterest(tag)}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-primary bg-secondary/50 hover:bg-primary/10 px-2.5 py-1 rounded-lg transition-colors border border-border/30"
                  >
                    +{tag}
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {interests.length > 0 ? (
              interests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleRemoveInterest(interest)}
                  className="flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition-all shrink-0"
                >
                  #{interest}
                  <X className="h-3 w-3 opacity-60" />
                </button>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">No interests added yet. Add tags to find people with shared topics.</p>
            )}
          </div>

          {/* Strict match toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-border/30">
            <div>
              <p className="text-xs font-bold text-foreground">Strict Matchmaker</p>
              <p className="text-[10px] text-muted-foreground">Only match with people sharing at least one interest tag</p>
            </div>
            <Switch
              checked={strictMatch}
              onCheckedChange={handleStrictMatchToggle}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        {/* Quick Settings & Tools */}
        <div className="p-4 rounded-3xl bg-card border border-border/40 shadow-md space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Preferences</h3>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-primary" /> Sound Effects
              </span>
              <Switch
                checked={settings.soundEffects}
                onCheckedChange={(val) => updateSetting("soundEffects", val)}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" /> Push Notifications
              </span>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(val) => updateSetting("notifications", val)}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Screen Capture Protection
              </span>
              <Switch
                checked={settings.protectionEnabled}
                onCheckedChange={(val) => updateSetting("protectionEnabled", val)}
              />
            </div>
          </div>

          {/* Share / Invite row */}
          <div className="pt-3 border-t border-border/30 flex gap-2">
            <button
              onClick={copyInviteLink}
              className="flex-1 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/40 text-xs font-bold text-foreground flex items-center justify-center gap-1.5 transition-all"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Link Copied!" : `Invite Code: ${inviteCode}`}
            </button>

            <button
              onClick={copyStatsSummary}
              className="py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/40 text-xs font-bold text-foreground flex items-center justify-center gap-1.5 transition-all"
              title="Share Stats"
            >
              {statsCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
              {statsCopied ? "Copied" : "Share"}
            </button>
          </div>
        </div>

      </main>

      {/* Avatar Picker Modal */}
      <AnimatePresence>
        {showAvatarModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAvatarModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card border border-border/60 rounded-3xl shadow-2xl p-5 space-y-4 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <h3 className="text-base font-extrabold text-foreground">Choose Profile Picture</h3>
                <button onClick={() => setShowAvatarModal(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex rounded-xl bg-secondary/50 p-1">
                <button
                  onClick={() => setAvatarTab("upload")}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    avatarTab === "upload" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Upload className="h-3.5 w-3.5" /> Upload Custom Photo
                </button>
                <button
                  onClick={() => setAvatarTab("emojis")}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    avatarTab === "emojis" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Smile className="h-3.5 w-3.5" /> Preset Emojis
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
                    className="border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-6 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Camera className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Click to upload photo</p>
                      <p className="text-[10px] text-muted-foreground font-medium">Supports JPG, PNG, WEBP</p>
                    </div>
                  </div>

                  {isCustomAvatarImage && (
                    <button
                      onClick={handleResetToEmoji}
                      className="w-full py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/40 text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-all"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Remove Photo & Reset to Emoji
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto scrollbar-thin p-1">
                    {AVATAR_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          updateAvatar(emoji);
                          setShowAvatarModal(false);
                        }}
                        className={cn(
                          "h-11 w-11 rounded-2xl text-2xl flex items-center justify-center transition-all hover:scale-110 hover:bg-primary/20",
                          (!isCustomAvatarImage && profile.avatar === emoji) ? "bg-primary/25 border-2 border-primary" : "bg-secondary/40"
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
              className="bg-card border border-border/60 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4"
            >
              <h3 className="text-sm font-extrabold text-foreground text-center">Adjust Profile Photo</h3>

              {/* Real-time "How others see you" preview badge */}
              <div className="bg-secondary/40 border border-border/40 rounded-2xl p-2.5 space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center flex items-center justify-center gap-1">
                  <span>👀</span> Preview: How others see you
                </p>
                <div className="flex items-center gap-2.5 bg-background/80 p-2 rounded-xl border border-border/30">
                  <div className="h-9 w-9 rounded-full overflow-hidden bg-black/40 border border-primary/40 shrink-0 flex items-center justify-center relative">
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
                    <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
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
                  "w-48 h-48 mx-auto relative rounded-full overflow-hidden border-4 border-primary/50 bg-black/40 flex items-center justify-center shadow-inner cursor-grab select-none touch-none",
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
              <div className="space-y-2 bg-secondary/30 p-3 rounded-2xl border border-border/30">
                <p className="text-[11px] text-muted-foreground text-center font-bold flex items-center justify-center gap-1">
                  <span>🤏</span> Pinch with two fingers to zoom • Drag to move
                </p>

                {/* Rotate Button */}
                <div className="flex items-center justify-between pt-1 border-t border-border/20">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Rotate Image</span>
                  <button
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="px-3 py-1 bg-secondary hover:bg-secondary/80 border border-border/40 text-xs font-semibold rounded-lg text-foreground transition-all flex items-center gap-1 active:scale-95"
                  >
                    <RotateCw className="h-3.5 w-3.5 text-primary" /> {rotation}°
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setCropImage(null)}
                  className="flex-1 py-2 rounded-xl border border-border bg-secondary text-xs font-bold text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyCrop}
                  className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-all shadow-md"
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
