export function sendNotification(title: string, body: string) {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted" ||
    document.hasFocus()
  ) {
    return;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: "echo-chat", // Replaces existing notification instead of stacking
      silent: true, // We handle our own sounds
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 5s
    setTimeout(() => notification.close(), 5000);
  } catch {
    // Silently fail
  }
}
