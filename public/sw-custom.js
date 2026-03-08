// Service Worker notification click handler
// This file is injected into the service worker via vite-plugin-pwa

self.addEventListener("notificationclick", (event) => {
  const e = event as NotificationEvent;
  e.notification.close();

  const url = e.notification.data?.url || "/chat";
  const action = e.action;

  if (action === "decline") return;

  // Focus existing window or open new one
  e.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Try to focus an existing window
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            if (url) client.navigate(url);
            return;
          }
        }
        // Open a new window
        return (self as unknown as ServiceWorkerGlobalScope).clients.openWindow(url);
      })
  );
});

// Keep alive for notifications
self.addEventListener("push", (event) => {
  // Handle push events if needed in the future
});
