export type NotificationType = "message" | "connected" | "disconnected" | "match" | "call" | "general";

interface NotifConfig {
  icon: string;
  tag: string;
  vibrate: number[];
  renotify: boolean;
}

const NOTIFICATION_CONFIG: Record<NotificationType, NotifConfig> = {
  message: { icon: "/pwa-icon-192.png", tag: "lchat-message", vibrate: [100, 50, 100], renotify: true },
  connected: { icon: "/pwa-icon-192.png", tag: "lchat-connected", vibrate: [200, 100, 200], renotify: true },
  disconnected: { icon: "/pwa-icon-192.png", tag: "lchat-disconnected", vibrate: [100], renotify: false },
  match: { icon: "/pwa-icon-192.png", tag: "lchat-match", vibrate: [100, 50, 100, 50, 200], renotify: true },
  call: { icon: "/pwa-icon-192.png", tag: "lchat-call", vibrate: [300, 200, 300, 200, 300], renotify: true },
  general: { icon: "/pwa-icon-192.png", tag: "lchat", vibrate: [100], renotify: false },
};

/**
 * Try sending notification via Service Worker (works on mobile PWA even when minimized).
 * Falls back to standard Notification API.
 */
export function sendNotification(
  title: string,
  body: string,
  type: NotificationType = "general"
) {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  // Skip if app is focused (unless it's a call)
  if (document.hasFocus() && type !== "call") {
    // Still vibrate on mobile for messages
    if (type === "message" && "vibrate" in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
    return;
  }

  const config = NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.general;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notifOptions: any = {
    body,
    icon: config.icon,
    tag: config.tag,
    badge: "/pwa-icon-192.png",
    silent: false,
    renotify: config.renotify,
  };

  // Try Service Worker notification first (better mobile support)
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.showNotification(title, {
          ...notifOptions,
          vibrate: config.vibrate,
          data: { url: "/chat", type },
          actions:
            type === "call"
              ? [
                  { action: "accept", title: "Accept" },
                  { action: "decline", title: "Decline" },
                ]
              : type === "message"
                ? [{ action: "reply", title: "Open Chat" }]
                : [],
        });
      })
      .catch(() => {
        // Fallback to standard notification
        showStandardNotification(title, notifOptions, config, type);
      });
  } else {
    showStandardNotification(title, notifOptions, config, type);
  }

  // Vibrate on mobile
  if ("vibrate" in navigator && config.vibrate.length > 0) {
    navigator.vibrate(config.vibrate);
  }
}

function showStandardNotification(
  title: string,
  options: NotificationOptions,
  config: NotifConfig,
  type: NotificationType
) {
  try {
    const notification = new Notification(title, options);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

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
