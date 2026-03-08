export type NotificationType = "message" | "connected" | "disconnected" | "match" | "call" | "general";

const NOTIFICATION_CONFIG: Record<NotificationType, { icon: string; tag: string }> = {
  message: { icon: "/pwa-icon-192.png", tag: "lchat-message" },
  connected: { icon: "/pwa-icon-192.png", tag: "lchat-connected" },
  disconnected: { icon: "/pwa-icon-192.png", tag: "lchat-disconnected" },
  match: { icon: "/pwa-icon-192.png", tag: "lchat-match" },
  call: { icon: "/pwa-icon-192.png", tag: "lchat-call" },
  general: { icon: "/pwa-icon-192.png", tag: "lchat" },
};

export function sendNotification(
  title: string,
  body: string,
  type: NotificationType = "general"
) {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted" ||
    document.hasFocus()
  ) {
    return;
  }

  try {
    const config = NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.general;

    const notification = new Notification(title, {
      body,
      icon: config.icon,
      tag: config.tag,
      silent: type !== "call", // Only ring for calls
      badge: "/pwa-icon-192.png",
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close: calls stay longer
    const timeout = type === "call" ? 15000 : 5000;
    setTimeout(() => notification.close(), timeout);
  } catch {
    // Silently fail
  }
}

/**
 * Request notification permission and return whether it was granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}
