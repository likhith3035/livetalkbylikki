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

const ChatWallpaperBg = ({ opacity }: { opacity?: number }) => {
  const { settings } = useSettings();
  if (settings.chatWallpaper === "none") return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 -z-10",
        wallpaperStyles[settings.chatWallpaper]
      )}
      style={opacity !== undefined ? { opacity } : undefined}
      aria-hidden
    />
  );
};

export default ChatWallpaperBg;
