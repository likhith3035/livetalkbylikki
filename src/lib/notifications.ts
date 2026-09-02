import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { App } from "@capacitor/app";

export type NotificationType = "message" | "connected" | "disconnected" | "match" | "call" | "general";

interface NotifConfig {
  icon: string;
  tag: string;
  vibrate: number[];
  renotify: boolean;
  smallIcon: string;
  channelId: string;
}

const NOTIFICATION_CONFIG: Record<NotificationType, NotifConfig> = {
  message: { icon: "/logo.png", tag: "lchat-message", vibrate: [100, 50, 100], renotify: true, smallIcon: "ic_stat_chat", channelId: "messages" },
  connected: { icon: "/logo.png", tag: "lchat-connected", vibrate: [200, 100, 200], renotify: true, smallIcon: "ic_stat_connect", channelId: "connections" },
  disconnected: { icon: "/logo.png", tag: "lchat-disconnected", vibrate: [100], renotify: false, smallIcon: "ic_stat_disconnect", channelId: "connections" },
  match: { icon: "/logo.png", tag: "lchat-match", vibrate: [100, 50, 100, 50, 200], renotify: true, smallIcon: "ic_stat_match", channelId: "connections" },
  call: { icon: "/logo.png", tag: "lchat-call", vibrate: [300, 200, 300, 200, 300], renotify: true, smallIcon: "ic_stat_call", channelId: "calls" },
  general: { icon: "/logo.png", tag: "lchat", vibrate: [100], renotify: false, smallIcon: "ic_stat_general", channelId: "general" },
};

// Track if app is in the foreground
let isAppInForeground = true;

// Initialize app state listener for native platforms
if (Capacitor.isNativePlatform()) {
  App.addListener("appStateChange", ({ isActive }) => {
    isAppInForeground = isActive;
  });

  // Create Android notification channels on startup
  LocalNotifications.createChannel({
    id: "messages",
    name: "Chat Messages",
    description: "Notifications for new chat messages",
    importance: 5, // MAX
    visibility: 1, // PUBLIC
    vibration: true,
    sound: "default",
  }).catch(() => {});

  LocalNotifications.createChannel({
    id: "connections",
    name: "Connections",
    description: "Notifications when strangers connect or disconnect",
    importance: 4, // HIGH
    visibility: 1,
    vibration: true,
    sound: "default",
  }).catch(() => {});

  LocalNotifications.createChannel({
    id: "calls",
    name: "Calls",
    description: "Incoming call notifications",
    importance: 5, // MAX
    visibility: 1,
    vibration: true,
    sound: "default",
  }).catch(() => {});

  LocalNotifications.createChannel({
    id: "general",
    name: "General",
    description: "General app notifications",
    importance: 3, // DEFAULT
    visibility: 1,
    vibration: true,
  }).catch(() => {});

  // Handle notification tap — bring user back to the app
  LocalNotifications.addListener("localNotificationActionPerformed", () => {
    // App will automatically come to foreground when notification is tapped
  });
}

// Auto-incrementing notification ID
let notificationIdCounter = Date.now() % 100000;

/**
 * Send a notification using native Android Local Notifications (works in background)
 * with fallback to Web Notification API for browsers.
 */
export function sendNotification(
  title: string,
  body: string,
  type: NotificationType = "general"
) {
  const config = NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.general;

  // --- Native Android path (works when app is minimized) ---
  if (Capacitor.isNativePlatform()) {
    // Skip if app is focused and it's not a call
    if (isAppInForeground && type !== "call") {
      // Still vibrate for messages
      if (type === "message" && "vibrate" in navigator) {
        navigator.vibrate([50, 30, 50]);
      }
      return;
    }

    // Send real native Android notification
    notificationIdCounter++;
    LocalNotifications.schedule({
      notifications: [
        {
          id: notificationIdCounter,
          title,
          body,
          channelId: config.channelId,
          smallIcon: "ic_notification", // Uses default Android notification icon
          largeIcon: "ic_launcher",
          autoCancel: true,
          extra: { type, url: "/chat" },
        },
      ],
    }).catch((err) => {
      console.warn("[Notifications] Native notification failed:", err);
      // Fallback to web notification
      sendWebNotification(title, body, type, config);
    });

    return;
  }

  // --- Web browser path ---
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  // Skip if app is focused (unless it's a call)
  if (document.hasFocus() && type !== "call") {
    if (type === "message" && "vibrate" in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
    return;
  }

  sendWebNotification(title, body, type, config);

  // Vibrate on mobile
  if ("vibrate" in navigator && config.vibrate.length > 0) {
    navigator.vibrate(config.vibrate);
  }
}

/**
 * Web Notification API fallback (for browsers, PWA)
 */
function sendWebNotification(
  title: string,
  body: string,
  type: NotificationType,
  config: NotifConfig
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notifOptions: any = {
    body,
    icon: config.icon,
    tag: config.tag,
    badge: "/logo.png",
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
        showStandardNotification(title, notifOptions, type);
      });
  } else {
    showStandardNotification(title, notifOptions, type);
  }
}

function showStandardNotification(
  title: string,
  options: NotificationOptions,
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
 * Request notification permission for both native and web.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // Native Android — request local notification permission
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === "granted";
    } catch {
      return false;
    }
  }

  // Web fallback
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}
