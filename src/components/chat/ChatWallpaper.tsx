import { useSettings, type ChatWallpaper } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const wallpaperStyles: Record<string, string> = {
  none: "",
  dots: "chat-wallpaper-dots",
  grid: "chat-wallpaper-grid",
  waves: "chat-wallpaper-waves",
  gradient: "chat-wallpaper-gradient",
  bubbles: "chat-wallpaper-bubbles",
  stars: "chat-wallpaper-stars",
  zigzag: "chat-wallpaper-zigzag",
  stripes: "chat-wallpaper-stripes",
  honeycomb: "chat-wallpaper-honeycomb",
  hearts: "chat-wallpaper-hearts",
  custom: "",
};

const ChatWallpaperBg = ({ opacity: overrideOpacity }: { opacity?: number }) => {
  const { settings } = useSettings();
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    if (!settings.chatWallpaperParallaxEnabled) {
      setCoords({ x: 0, y: 0 });
      return;
    }

    let frameId: number;
    const handleMove = (e: MouseEvent) => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const { innerWidth, innerHeight } = window;
        // Shift up to 14px dynamically based on cursor coordinates
        const x = ((e.clientX - innerWidth / 2) / (innerWidth / 2)) * 14;
        const y = ((e.clientY - innerHeight / 2) / (innerHeight / 2)) * 14;
        setCoords({ x, y });
      });
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(frameId);
    };
  }, [settings.chatWallpaperParallaxEnabled]);

  if (settings.chatWallpaper === "none") return null;
  if (settings.chatWallpaper === "custom" && !settings.chatWallpaperImage) return null;

  const finalOpacity = overrideOpacity !== undefined 
    ? overrideOpacity 
    : settings.chatWallpaperOpacity !== undefined 
      ? settings.chatWallpaperOpacity 
      : 0.8;

  const isCustomImage = settings.chatWallpaper === "custom" && settings.chatWallpaperImage;

  // Retrieve filters from settings with safe defaults
  const blur = settings.chatWallpaperBlur ?? 0;
  const brightness = settings.chatWallpaperBrightness ?? 1.0;
  const saturation = settings.chatWallpaperSaturation ?? 1.0;
  const overlayPattern = settings.chatWallpaperOverlayPattern ?? "none";
  const overlayOpacity = settings.chatWallpaperOverlayOpacity ?? 0.35;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none transition-transform duration-[600ms] ease-out",
        !isCustomImage && wallpaperStyles[settings.chatWallpaper]
      )}
      style={{
        opacity: finalOpacity,
        transform: settings.chatWallpaperParallaxEnabled 
          ? `translate(${coords.x}px, ${coords.y}px) scale(1.08)` 
          : "scale(1.06)",
        transformOrigin: "center center"
      }}
      aria-hidden
    >
      {isCustomImage && (
        <>
          {/* Custom Background Image Layer */}
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-300"
            style={{
              backgroundImage: `url(${settings.chatWallpaperImage})`,
              filter: `blur(${blur}px) brightness(${brightness}) saturate(${saturation})`,
            }}
          />
          
          {/* Pattern Texture Overlay Layer */}
          {overlayPattern !== "none" && (
            <div 
              className={cn(
                "absolute inset-0 w-full h-full transition-all duration-300",
                wallpaperStyles[overlayPattern]
              )}
              style={{
                opacity: overlayOpacity,
                mixBlendMode: settings.chatWallpaperOverlayBlendMode ?? "overlay",
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ChatWallpaperBg;
