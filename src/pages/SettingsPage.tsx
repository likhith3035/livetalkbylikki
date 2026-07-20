import { Moon, Sun, Volume2, Bell, Info, Palette, Image as ImageIcon, Keyboard, ShieldCheck, EyeOff, Ban, Sliders, Layers, Sparkles, Upload, RotateCcw, Crop } from "lucide-react";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useSettings, CHAT_THEMES, CHAT_WALLPAPERS, LIQUID_GLASS_PRESETS, type ChatTheme, type ChatWallpaper, type GlassPreset } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { useSEO } from "@/hooks/use-seo";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import React, { useRef, useState, useEffect } from "react";
import WallpaperCropper from "@/components/chat/WallpaperCropper";

const fadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 260, damping: 20 }
};

const TINT_SUGGESTIONS = [
  { label: "Indigo Accent", hsl: "245 80% 60%", color: "#6366f1" },
  { label: "Amethyst Violet", hsl: "270 85% 60%", color: "#8b5cf6" },
  { label: "Teal Lagoon", hsl: "175 75% 45%", color: "#0d9488" },
  { label: "Ocean Breeze", hsl: "200 85% 50%", color: "#0284c7" },
  { label: "Emerald Green", hsl: "150 70% 45%", color: "#16a34a" },
  { label: "Sunset Quartz", hsl: "25 90% 55%", color: "#ea580c" },
  { label: "Hologram Pink", hsl: "325 85% 55%", color: "#db2777" },
  { label: "Frosted Quartz", hsl: "240 10% 98%", color: "#f3f4f6" },
  { label: "Obsidian Black", hsl: "240 10% 8%", color: "#1f2937" }
];

type PresetCategory = "space" | "scenery" | "cyber" | "pastel";

const CATEGORIZED_WALLPAPERS: Record<PresetCategory, { label: string; url: string }[]> = {
  space: [
    { label: "Nebula", url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1200&q=80" },
    { label: "Cosmos", url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80" },
    { label: "Eclipse", url: "https://images.unsplash.com/photo-1538370965046-79c0d6907d47?auto=format&fit=crop&w=1200&q=80" },
    { label: "Galaxy", url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80" }
  ],
  scenery: [
    { label: "Aurora", url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1200&q=80" },
    { label: "Forest", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80" },
    { label: "Dawn", url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80" },
    { label: "Dunes", url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80" }
  ],
  cyber: [
    { label: "Tokyo", url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80" },
    { label: "Synth", url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80" },
    { label: "Matrix", url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80" },
    { label: "Cityscape", url: "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=1200&q=80" }
  ],
  pastel: [
    { label: "Sunset", url: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80" },
    { label: "Lilac", url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80" },
    { label: "Splash", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80" },
    { label: "Foliage", url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80" }
  ]
};

const GlassPreviewCard = () => {
  const { settings } = useSettings();
  const hasWallpaper = settings.chatWallpaper !== "none";
  const isCustom = settings.chatWallpaper === "custom" && settings.chatWallpaperImage;

  return (
    <div className="relative rounded-[2rem] border border-border/40 overflow-hidden bg-background h-52 flex items-center justify-center shadow-inner">
      {/* Dynamic Wallpaper Layer behind frosted mockup */}
      {hasWallpaper && (
        <>
          <div 
            className={cn(
              "absolute inset-0 w-full h-full select-none pointer-events-none transition-all duration-300",
              !isCustom && `chat-wallpaper-${settings.chatWallpaper}`
            )}
            style={{
              opacity: settings.chatWallpaperOpacity,
              backgroundImage: isCustom ? `url(${settings.chatWallpaperImage})` : undefined,
              backgroundSize: isCustom ? "cover" : undefined,
              backgroundPosition: isCustom ? "center" : undefined,
              filter: isCustom 
                ? `blur(${settings.chatWallpaperBlur}px) brightness(${settings.chatWallpaperBrightness}) saturate(${settings.chatWallpaperSaturation}) scale(1.06)` 
                : undefined
            }}
          />
          {isCustom && settings.chatWallpaperOverlayPattern && settings.chatWallpaperOverlayPattern !== "none" && (
            <div 
              className={cn(
                "absolute inset-0 w-full h-full select-none pointer-events-none transition-all duration-300",
                `chat-wallpaper-${settings.chatWallpaperOverlayPattern}`
              )}
              style={{
                opacity: settings.chatWallpaperOverlayOpacity ?? 0.35,
                mixBlendMode: settings.chatWallpaperOverlayBlendMode ?? "overlay",
              }}
            />
          )}
        </>
      )}

      {/* Dynamic Morphing Background Blobs */}
      {settings.liquidGlassEnabled && (
        <div className="absolute inset-0 opacity-[0.25] filter blur-[35px] overflow-hidden pointer-events-none">
          <div className="absolute w-24 h-24 rounded-full bg-primary/60 left-2 top-2 animate-pulse" />
          <div className="absolute w-28 h-28 rounded-full bg-accent/60 right-4 bottom-2" />
        </div>
      )}

      {/* Mockup Frosted Glass Card Container */}
      <div 
        className="w-[90%] max-w-sm p-4 rounded-3xl transition-all duration-300 relative overflow-hidden"
        style={{
          background: settings.liquidGlassEnabled 
            ? `hsla(var(--glass-tint-hsl) / var(--glass-opacity))` 
            : "hsl(var(--card))",
          border: settings.liquidGlassEnabled 
            ? `${settings.glassBorderWidth}px solid hsla(var(--glass-tint-hsl) / var(--glass-border-opacity))` 
            : "1px solid hsl(var(--border))",
          backdropFilter: settings.liquidGlassEnabled 
            ? `blur(${settings.glassBlur}px) saturate(1.4)` 
            : "none",
          WebkitBackdropFilter: settings.liquidGlassEnabled 
            ? `blur(${settings.glassBlur}px) saturate(1.4)` 
            : "none",
          boxShadow: settings.liquidGlassEnabled
            ? `0 8px 32px 0 rgba(0, 0, 0, 0.12), 0 0 14px 1px hsla(var(--glass-tint-hsl) / calc(var(--glass-glow-intensity) * 0.12))`
            : "none"
        }}
      >
        {/* Reflection & Noise */}
        {settings.liquidGlassEnabled && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/2 to-transparent pointer-events-none z-10" />
            <div 
              className="absolute inset-0 pointer-events-none z-0" 
              style={{
                opacity: settings.glassTextureIntensity,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
              }}
            />
          </>
        )}

        {/* Content */}
        <div className="relative z-20 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/50 leading-none">Studio Preview</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-start">
              <div className="bg-secondary/40 text-foreground px-3 py-1.5 rounded-2xl rounded-bl-sm text-[11px] font-semibold max-w-[85%] border border-border/10">
                Hey! How does the new setup look? 🖼️
              </div>
            </div>
            <div className="flex justify-end">
              <div className="text-white px-3 py-1.5 rounded-2xl rounded-br-sm text-[11px] font-semibold max-w-[85%] border border-white/10"
                   style={{ background: `hsl(var(--bubble-you, 265 90% 55%))` }}>
                Floating glass layers look absolutely premium! 🚀
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CompactFloatingPreview = () => {
  const { settings } = useSettings();
  const hasWallpaper = settings.chatWallpaper !== "none";
  const isCustom = settings.chatWallpaper === "custom" && settings.chatWallpaperImage;

  if (!hasWallpaper) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.85, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -10 }}
      transition={{ duration: 0.3 }}
      className="fixed top-18 right-4 w-32 h-44 sm:w-36 sm:h-48 z-40 rounded-2xl border border-primary/30 overflow-hidden shadow-2xl pointer-events-none select-none glass flex items-center justify-center lg:hidden"
    >
      {/* Background Image/Pattern */}
      <div 
        className={cn(
          "absolute inset-0 w-full h-full select-none pointer-events-none",
          !isCustom && `chat-wallpaper-${settings.chatWallpaper}`
        )}
        style={{
          opacity: settings.chatWallpaperOpacity,
          backgroundImage: isCustom ? `url(${settings.chatWallpaperImage})` : undefined,
          backgroundSize: isCustom ? "cover" : undefined,
          backgroundPosition: isCustom ? "center" : undefined,
          filter: isCustom 
            ? `blur(${settings.chatWallpaperBlur}px) brightness(${settings.chatWallpaperBrightness}) saturate(${settings.chatWallpaperSaturation}) scale(1.06)` 
            : undefined
        }}
      />
      {isCustom && settings.chatWallpaperOverlayPattern && settings.chatWallpaperOverlayPattern !== "none" && (
        <div 
          className={cn(
            "absolute inset-0 w-full h-full select-none pointer-events-none",
            `chat-wallpaper-${settings.chatWallpaperOverlayPattern}`
          )}
          style={{
            opacity: settings.chatWallpaperOverlayOpacity ?? 0.35,
            mixBlendMode: settings.chatWallpaperOverlayBlendMode ?? "overlay",
          }}
        />
      )}

      {/* Glass card mockup */}
      <div 
        className="w-[85%] p-2 rounded-xl text-center overflow-hidden relative z-10"
        style={{
          background: settings.liquidGlassEnabled 
            ? `hsla(var(--glass-tint-hsl) / var(--glass-opacity))` 
            : "hsl(var(--card))",
          border: settings.liquidGlassEnabled 
            ? `${settings.glassBorderWidth}px solid hsla(var(--glass-tint-hsl) / var(--glass-border-opacity))` 
            : "1px solid hsl(var(--border))",
          backdropFilter: settings.liquidGlassEnabled 
            ? `blur(${settings.glassBlur}px) saturate(1.4)` 
            : "none",
          WebkitBackdropFilter: settings.liquidGlassEnabled 
            ? `blur(${settings.glassBlur}px) saturate(1.4)` 
            : "none",
        }}
      >
        <span className="text-[7px] font-black uppercase tracking-wider text-foreground/60 block mb-1">Live PiP</span>
        <div className="space-y-1">
          <div className="bg-secondary/40 px-1.5 py-0.5 rounded-md text-[8px] font-semibold text-left border border-border/10 leading-normal max-w-[90%] truncate">
            Hi! 🖼️
          </div>
          <div className="text-white px-1.5 py-0.5 rounded-md text-[8px] font-semibold text-right border border-white/10 leading-normal ml-auto max-w-[90%] truncate"
               style={{ background: `hsl(var(--bubble-you, 265 90% 55%))` }}>
            Cool! 🚀
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SettingsPage = () => {
  const onlineCount = useOnlineCount();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings, updateSetting } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll listener to show compact floating preview on mobile
  const [scrolledPastPreview, setScrolledPastPreview] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolledPastPreview(window.scrollY > 380);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Custom states for cropping modal
  const [showCropper, setShowCropper] = useState(false);
  const [rawUploadSrc, setRawUploadSrc] = useState<string>("");
  const [activeTab, setActiveTab] = useState<PresetCategory>("space");

  useSEO({ 
    title: "Settings – LiveTalk", 
    description: "Customize your LiveTalk experience — themes, wallpapers, sound, notifications and more.",
    keywords: "chat settings, dark mode chat, chat themes, message notifications, customize LiveTalk"
  });

  const handleToggle = async (
    key: "darkMode" | "soundEffects" | "notifications" | "protectionEnabled" | "notifyAlerts" | "autoStopOnScreenshot", 
    checked: boolean
  ) => {
    if (key === "notifications" && checked) {
      if (!("Notification" in window)) {
        toast({ title: "Not supported", description: "Your browser does not support notifications." });
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast({ title: "Permission required", description: "Allow notifications in your browser settings first." });
        return;
      }
    }
    updateSetting(key, checked);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Unsupported File", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      setRawUploadSrc(event.target?.result as string);
      setShowCropper(true);
    };
  };

  const handleCropComplete = (croppedBase64: string) => {
    updateSetting("chatWallpaperImage", croppedBase64);
    updateSetting("chatWallpaper", "custom");
    setShowCropper(false);
    setRawUploadSrc("");
    toast({
      title: "✂️ Background Cropped",
      description: "Custom cropped background applied to your chat window."
    });
  };

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background selection:bg-primary/20">
      <AnimatePresence>
        {scrolledPastPreview && <CompactFloatingPreview />}
      </AnimatePresence>
      {/* Premium Background Orbs & Fluid Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 page-bg-orbs">
          <>
            <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-accent/5 blur-[100px]" />
          </>
      </div>

      <Header onlineCount={onlineCount} />

      <main className="flex-1 px-5 py-8 pb-32 max-w-5xl mx-auto w-full">
        <motion.div {...fadeUp} className="mb-8">
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1.5 text-sm font-medium">Personalize your chat experience</p>
        </motion.div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8 items-start">
          {/* Desktop Left Side Sticky Live Preview */}
          <div className="hidden lg:block sticky top-24 space-y-3 z-30">
            <h2 className="text-[11px] font-extrabold text-primary/75 dark:text-primary/65 uppercase tracking-[0.22em] px-2.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Live Preview
            </h2>
            <GlassPreviewCard />
          </div>

          <div className="space-y-8">
          {/* General */}
          <motion.section {...fadeUp} transition={{ delay: 0.05 }} className="space-y-3">
            <h2 className="text-[11px] font-extrabold text-primary/75 dark:text-primary/65 uppercase tracking-[0.22em] px-2.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Preference
            </h2>
            <div className="space-y-2.5">
              <SettingRow
                icon={settings.darkMode ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
                title={settings.darkMode ? "Dark Appearance" : "Light Appearance"}
                desc="Toggle site-wide theme"
              >
                <Switch 
                  checked={settings.darkMode} 
                  onCheckedChange={(c) => handleToggle("darkMode", c)}
                  className="data-[state=checked]:bg-primary"
                />
              </SettingRow>
              <SettingRow icon={<Volume2 className="h-4.5 w-4.5" />} title="Sound Effects" desc="Connect & message sounds">
                <Switch checked={settings.soundEffects} onCheckedChange={(c) => handleToggle("soundEffects", c)} />
              </SettingRow>
              <SettingRow icon={<Bell className="h-4.5 w-4.5" />} title="Notifications" desc="Alerts when tab is inactive">
                <Switch checked={settings.notifications} onCheckedChange={(c) => handleToggle("notifications", c)} />
              </SettingRow>
            </div>
          </motion.section>

          {/* Security & Privacy */}
          <motion.section {...fadeUp} transition={{ delay: 0.1 }} className="space-y-3">
            <h2 className="text-[11px] font-extrabold text-primary/75 dark:text-primary/65 uppercase tracking-[0.22em] px-2.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Security & Privacy
            </h2>
            <div className="space-y-2.5">
              <SettingRow
                icon={<ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />}
                title="Screen Protection"
                desc="Prevent screenshots, copies, & screen shares"
              >
                <Switch 
                  checked={settings.protectionEnabled} 
                  onCheckedChange={(c) => handleToggle("protectionEnabled", c)}
                />
              </SettingRow>
              <SettingRow
                icon={<EyeOff className="h-4.5 w-4.5 text-blue-500" />}
                title="Share Violations"
                desc="Notify chat partner of screenshot attempts"
              >
                <Switch 
                  checked={settings.notifyAlerts} 
                  onCheckedChange={(c) => handleToggle("notifyAlerts", c)}
                />
              </SettingRow>
              <SettingRow
                icon={<Ban className="h-4.5 w-4.5 text-rose-500" />}
                title="Auto-Stop on Violation"
                desc="Auto-disconnect chat immediately if screen is captured"
              >
                <Switch 
                  checked={settings.autoStopOnScreenshot} 
                  onCheckedChange={(c) => handleToggle("autoStopOnScreenshot", c)}
                />
              </SettingRow>
            </div>
          </motion.section>



          {/* Visual Style: Message Bubbles and Wallpaper Customization */}
          <motion.section {...fadeUp} transition={{ delay: 0.16 }} className="space-y-4">
            <h2 className="text-[11px] font-extrabold text-primary/75 dark:text-primary/65 uppercase tracking-[0.22em] px-2.5 flex items-center gap-2">
              <Palette className="h-3.5 w-3.5 text-primary" /> Visual Style
            </h2>
            
            <div className="space-y-5">
              {/* Message Bubbles */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground/80 px-1">Message Bubbles</label>
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 gap-2">
                  {(Object.keys(CHAT_THEMES) as ChatTheme[]).map((key) => {
                    const theme = CHAT_THEMES[key];
                    const isActive = settings.chatTheme === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => updateSetting("chatTheme", key)}
                        className={cn(
                          "group flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3.5 transition-all duration-300",
                          isActive
                            ? "border-primary bg-primary/5 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.4)]"
                            : "border-border/50 bg-secondary/20 hover:border-primary/30 hover:bg-secondary/40"
                        )}
                      >
                        <div 
                          className="h-8 w-8 rounded-full shadow-lg transition-transform group-hover:scale-110" 
                          style={{ background: theme.accent }} 
                        />
                        <span className="text-[10px] font-bold text-foreground/80 truncate w-full text-center">{theme.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Text Size Customization */}
              <div className="space-y-2 pt-2 border-t border-border/30">
                <label className="text-xs font-semibold text-muted-foreground/80 px-1 flex items-center justify-between">
                  <span>Message Text Size</span>
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{settings.messageFontSize || "medium"}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "compact", label: "Compact", sizeText: "11px" },
                    { id: "small", label: "Small", sizeText: "12px" },
                    { id: "medium", label: "Medium", sizeText: "14px (Default)" },
                    { id: "large", label: "Large", sizeText: "16px" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateSetting("messageFontSize", item.id as any)}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-2xl border px-3 py-2.5 transition-all text-center",
                        (settings.messageFontSize === item.id || (!settings.messageFontSize && item.id === "medium"))
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/50 bg-secondary/20 hover:border-primary/30"
                      )}
                    >
                      <span className="text-xs font-bold text-foreground">{item.label}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{item.sizeText}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Bubble Corner Shape Customization */}
              <div className="space-y-2 pt-2 border-t border-border/30">
                <label className="text-xs font-semibold text-muted-foreground/80 px-1 flex items-center justify-between">
                  <span>Message Bubble Shape</span>
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{settings.messageBubbleShape || "rounded"}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "rounded", label: "Rounded", radius: "rounded-[1.2rem]" },
                    { id: "pill", label: "Pill (Curved)", radius: "rounded-3xl" },
                    { id: "sharp", label: "Sharp Box", radius: "rounded-md" },
                    { id: "compact", label: "Compact", radius: "rounded-xl" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateSetting("messageBubbleShape", item.id as any)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 transition-all text-center",
                        (settings.messageBubbleShape === item.id || (!settings.messageBubbleShape && item.id === "rounded"))
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/50 bg-secondary/20 hover:border-primary/30"
                      )}
                    >
                      <div className={cn("h-4 w-12 bg-primary/40 border border-primary/50", item.radius)} />
                      <span className="text-xs font-bold text-foreground">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Wallpaper Pattern Type Selector */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-muted-foreground/80 px-1">Chat Background Wallpaper Pattern</label>
                <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-9 gap-2">
                  {(Object.keys(CHAT_WALLPAPERS) as ChatWallpaper[]).map((key) => {
                    const wp = CHAT_WALLPAPERS[key];
                    const isActive = settings.chatWallpaper === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          updateSetting("chatWallpaper", key);
                          if (key === "custom" && !settings.chatWallpaperImage) {
                            updateSetting("chatWallpaperImage", CATEGORIZED_WALLPAPERS.space[0].url);
                          }
                        }}
                        className={cn(
                          "group flex flex-col items-center gap-1 rounded-xl border px-1 py-3 transition-all duration-300",
                          isActive
                            ? "border-primary bg-primary/8 shadow-md"
                            : "border-border/50 bg-secondary/20 hover:border-primary/20 hover:bg-secondary/30"
                        )}
                      >
                        <span className="text-lg group-hover:scale-125 transition-transform">{wp.emoji}</span>
                        <span className="text-[8px] font-bold text-foreground/60 uppercase tracking-tighter">{wp.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wallpaper Backdrop Studio - Always visible for quick access */}
              <div className="p-5 rounded-[2rem] border border-border/30 bg-card/25 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-primary animate-pulse" /> Wallpaper Customization Studio
                  </span>
                  {settings.chatWallpaperImage && (
                    <button
                      type="button"
                      onClick={() => {
                        updateSetting("chatWallpaperImage", "");
                        updateSetting("chatWallpaper", "none");
                        toast({ title: "Wallpaper Removed", description: "Custom background image cleared." });
                      }}
                      className="flex items-center gap-1 text-[10px] text-destructive hover:underline font-bold uppercase tracking-wider"
                    >
                      <RotateCcw className="h-3 w-3" /> Reset Backdrop
                    </button>
                  )}
                </div>

                {/* Device Upload Area */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-secondary/10 border border-border/20">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />

                  {settings.chatWallpaperImage ? (
                    <div className="relative group w-28 h-18 rounded-xl overflow-hidden border border-border/60 shrink-0 shadow-sm">
                      <img src={settings.chatWallpaperImage} alt="Wallpaper preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                      >
                        <span className="text-[9px] text-white font-black uppercase tracking-wider flex items-center gap-1"><Crop className="h-3 w-3" /> Crop New</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto flex flex-col items-center justify-center gap-2 border border-dashed border-border/80 rounded-2xl p-4 px-6 bg-secondary/15 hover:bg-secondary/25 hover:border-primary/45 transition-all text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Upload className="h-5 w-5 text-primary animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Upload Device Image
                      </span>
                    </button>
                  )}

                  <div className="flex-1 space-y-1 text-left">
                    <p className="text-[11px] font-bold text-foreground">Interactive Crop Studio</p>
                    <p className="text-[9px] text-muted-foreground leading-normal">
                      Upload your own background photo. Includes zoom, panning, and aspect ratio guides to fit perfectly.
                    </p>
                  </div>
                </div>

                {/* Curated Suggested Themes */}
                <div className="space-y-2 pt-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary animate-pulse" /> Curated Theme Suggestions (16 Premium Items)
                  </label>
                  
                  {/* Presets Categories Tabs */}
                  <div className="flex gap-1.5 border-b border-border/15 pb-1">
                    {(["space", "scenery", "cyber", "pastel"] as PresetCategory[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveTab(cat)}
                        className={cn(
                          "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all",
                          activeTab === cat 
                            ? "bg-primary/10 text-primary border border-primary/20" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Presets Thumbnails list */}
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none pt-1">
                    {CATEGORIZED_WALLPAPERS[activeTab].map((preset) => {
                      const isActive = settings.chatWallpaper === "custom" && settings.chatWallpaperImage === preset.url;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            updateSetting("chatWallpaperImage", preset.url);
                            updateSetting("chatWallpaper", "custom");
                            toast({ title: `🖼️ Theme Selected`, description: `Background updated to ${preset.label}.` });
                          }}
                          className={cn(
                            "flex flex-col items-center gap-1 shrink-0 group focus:outline-none transition-all",
                            isActive ? "scale-105" : "opacity-80 hover:opacity-100"
                          )}
                        >
                          <div className={cn(
                            "w-16 h-10 rounded-xl overflow-hidden border transition-all duration-300",
                            isActive ? "border-primary ring-2 ring-primary/25" : "border-border/40 hover:border-border/80"
                          )}>
                            <img src={preset.url} alt={preset.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <span className="text-[8px] font-bold uppercase tracking-tighter text-muted-foreground group-hover:text-foreground">{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Advanced Background Filters sliders */}
                {settings.chatWallpaper === "custom" ? (
                  <div className="space-y-5 pt-3 border-t border-border/10">
                    {/* Core image adjustments */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Opacity */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-muted-foreground">Wallpaper Opacity</span>
                          <span className="font-mono text-foreground/80">{Math.round(settings.chatWallpaperOpacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={settings.chatWallpaperOpacity}
                          onChange={(e) => updateSetting("chatWallpaperOpacity", parseFloat(e.target.value))}
                          className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                        />
                      </div>

                      {/* Blur */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-muted-foreground">Wallpaper Blur</span>
                          <span className="font-mono text-foreground/80">{settings.chatWallpaperBlur}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          step="1"
                          value={settings.chatWallpaperBlur}
                          onChange={(e) => updateSetting("chatWallpaperBlur", parseInt(e.target.value))}
                          className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                        />
                      </div>

                      {/* Brightness */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-muted-foreground">Wallpaper Brightness</span>
                          <span className="font-mono text-foreground/80">{Math.round(settings.chatWallpaperBrightness * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1.5"
                          step="0.05"
                          value={settings.chatWallpaperBrightness}
                          onChange={(e) => updateSetting("chatWallpaperBrightness", parseFloat(e.target.value))}
                          className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                        />
                      </div>

                      {/* Saturation */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-muted-foreground">Wallpaper Saturation</span>
                          <span className="font-mono text-foreground/80">{Math.round(settings.chatWallpaperSaturation * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="2.0"
                          step="0.05"
                          value={settings.chatWallpaperSaturation}
                          onChange={(e) => updateSetting("chatWallpaperSaturation", parseFloat(e.target.value))}
                          className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Blend overlay patterns selector */}
                    <div className="space-y-3 pt-3 border-t border-border/10">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-muted-foreground uppercase tracking-wider">Blend Overlay Mesh Texture</span>
                        {settings.chatWallpaperOverlayPattern !== "none" && (
                          <span className="font-mono text-foreground/80">{Math.round(settings.chatWallpaperOverlayOpacity * 100)}% Opacity</span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                        {[
                          { key: "none", label: "None", emoji: "🚫" },
                          { key: "dots", label: "Dots", emoji: "⚬" },
                          { key: "grid", label: "Grid", emoji: "▦" },
                          { key: "waves", label: "Waves", emoji: "🌊" },
                          { key: "bubbles", label: "Bubbles", emoji: "🫧" },
                          { key: "stars", label: "Stars", emoji: "⭐" },
                          { key: "zigzag", label: "Zigzag", emoji: "⚡" },
                          { key: "stripes", label: "Stripes", emoji: "▤" },
                          { key: "honeycomb", label: "Honeycomb", emoji: "⬢" },
                          { key: "hearts", label: "Hearts", emoji: "♥" },
                        ].map((pattern) => {
                          const isActive = settings.chatWallpaperOverlayPattern === pattern.key;
                          return (
                            <button
                              key={pattern.key}
                              type="button"
                              onClick={() => updateSetting("chatWallpaperOverlayPattern", pattern.key as any)}
                              className={cn(
                                "flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all duration-300",
                                isActive
                                  ? "border-primary bg-primary/10 text-foreground scale-105 shadow-sm"
                                  : "border-border/40 bg-secondary/10 hover:bg-secondary/20 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <span className="text-base select-none">{pattern.emoji}</span>
                              <span className="text-[8px] font-bold uppercase tracking-tighter mt-0.5 whitespace-nowrap">{pattern.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Blend Interaction Mode Selectors */}
                      {settings.chatWallpaperOverlayPattern !== "none" && (
                        <div className="space-y-1.5 pt-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-muted-foreground uppercase tracking-wider">Blend Interaction Mode</span>
                            <span className="font-mono text-foreground/80 font-semibold">{settings.chatWallpaperOverlayBlendMode}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { key: "overlay", label: "Overlay" },
                              { key: "multiply", label: "Multiply" },
                              { key: "screen", label: "Screen" },
                              { key: "difference", label: "Difference" },
                              { key: "color-dodge", label: "Dodge" },
                              { key: "luminosity", label: "Luminous" },
                            ].map((blend) => {
                              const isActive = settings.chatWallpaperOverlayBlendMode === blend.key;
                              return (
                                <button
                                  key={blend.key}
                                  type="button"
                                  onClick={() => updateSetting("chatWallpaperOverlayBlendMode", blend.key as any)}
                                  className={cn(
                                    "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all border",
                                    isActive 
                                      ? "bg-primary/10 text-primary border-primary/25" 
                                      : "bg-secondary/10 text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/20"
                                  )}
                                >
                                  {blend.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Pattern overlay opacity slider */}
                      {settings.chatWallpaperOverlayPattern !== "none" && (
                        <div className="space-y-1.5 pt-1">
                          <input
                            type="range"
                            min="0.05"
                            max="1.0"
                            step="0.05"
                            value={settings.chatWallpaperOverlayOpacity}
                            onChange={(e) => updateSetting("chatWallpaperOverlayOpacity", parseFloat(e.target.value))}
                            className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Parallax toggle switch */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/15 border border-border/20 pt-3">
                      <div className="space-y-0.5 text-left">
                        <p className="text-[11px] font-bold text-foreground">3D Parallax Motion Effect</p>
                        <p className="text-[9px] text-muted-foreground leading-normal">
                          Move your cursor across the chat window to experience immersive parallax depth shift.
                        </p>
                      </div>
                      <Switch
                        checked={settings.chatWallpaperParallaxEnabled}
                        onCheckedChange={(c) => updateSetting("chatWallpaperParallaxEnabled", c)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-3.5 rounded-2xl bg-secondary/5 border border-dashed border-border/40 text-[10px] font-semibold text-muted-foreground">
                    Select a preset theme above or upload a device image to unlock fine-tuning adjustment filters.
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {/* Keyboard shortcuts */}
          <motion.section {...fadeUp} transition={{ delay: 0.22 }} className="space-y-3">
            <h2 className="text-[11px] font-extrabold text-primary/75 dark:text-primary/65 uppercase tracking-[0.22em] px-2.5 flex items-center gap-2">
              <Keyboard className="h-3.5 w-3.5 text-primary" /> Accessibility
            </h2>
            <div className="rounded-[2rem] border overflow-hidden divide-y transition-all duration-300 bg-card border-border/40 divide-border/15">
              <ShortcutRow keys={["Enter"]} desc="Start matching when idle" />
              <ShortcutRow keys={["Esc"]} desc="Quick stop or disconnect" />
              <ShortcutRow keys={["Ctrl", "N"]} desc="Skip to next stranger" />
              <ShortcutRow keys={["Enter"]} desc="Send message in chat box" />
            </div>
          </motion.section>

          {/* Links */}
          <motion.section {...fadeUp} transition={{ delay: 0.28 }} className="space-y-2.5">
             <button
              type="button"
              onClick={() => navigate("/guidelines")}
              className="flex w-full items-center justify-between rounded-3xl border border-border/40 bg-secondary/20 hover:bg-secondary/40 px-5 py-4 text-left transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Community Guidelines</p>
                  <p className="text-xs text-muted-foreground font-medium">Safe use & community rules</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => toast({ title: "LiveTalk v2.0", description: "The #1 premium anonymous chat experience." })}
              className="flex w-full items-center justify-between rounded-3xl border border-border/40 bg-secondary/20 hover:bg-secondary/40 px-5 py-5 text-left transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Version Information</p>
                  <p className="text-xs text-muted-foreground font-medium text-gradient">Build 2.0.42 — Powered by Likki</p>
                </div>
              </div>
            </button>
          </motion.section>
        </div>
      </div>
    </main>

      {/* Custom Cropper overlay modal */}
      <AnimatePresence>
        {showCropper && rawUploadSrc && (
          <WallpaperCropper
            imageSrc={rawUploadSrc}
            onCropComplete={handleCropComplete}
            onCancel={() => {
              setShowCropper(false);
              setRawUploadSrc("");
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
        )}
      </AnimatePresence>

      <MobileNav />
    </div>
  );
};

const SettingRow = ({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) => {
  return (
    <div className="flex items-center justify-between rounded-[2rem] px-5 py-4 shadow-sm hover:shadow-md border transition-all duration-300 bg-card border-border/40">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-300 bg-primary/5 text-primary/70 border border-border/20">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground leading-tight">{title}</p>
          <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
};

const ShortcutRow = ({ keys, desc }: { keys: string[]; desc: string }) => (
  <div className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
    <span className="text-xs font-medium text-muted-foreground/80">{desc}</span>
    <div className="flex gap-1.5">
      {keys.map((k) => (
        <kbd key={k} className="inline-flex items-center rounded-lg border border-border/60 bg-background px-2.5 py-1 text-[10px] font-bold font-mono text-foreground/80 shadow-[0_2px_0_0_rgba(0,0,0,0.1)]">
          {k}
        </kbd>
      ))}
    </div>
  </div>
);

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);

export default SettingsPage;
