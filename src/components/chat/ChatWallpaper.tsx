import { useSettings, type ChatWallpaper } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

const wallpaperStyles: Record<ChatWallpaper, string> = {
  none: "",
  dots: "chat-wallpaper-dots",
  grid: "chat-wallpaper-grid",
  waves: "chat-wallpaper-waves",
  gradient: "chat-wallpaper-gradient",
  bubbles: "chat-wallpaper-bubbles",
  stars: "chat-wallpaper-stars",
  zigzag: "chat-wallpaper-zigzag",
};

const ChatWallpaperBg = () => {
  const { settings } = useSettings();
  if (settings.chatWallpaper === "none") return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 opacity-[0.04] dark:opacity-[0.06]",
        wallpaperStyles[settings.chatWallpaper]
      )}
      aria-hidden
    />
  );
};

export default ChatWallpaperBg;
