import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Detect iOS Safari
export function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

// Detect if running in standalone (already installed)
export function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem("pwa_banner_dismissed_v2");
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 4000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowBanner(false);
      setShowInstallModal(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = useCallback(async () => {
    // iOS — show manual instructions modal
    if (isIos() && !isInStandaloneMode()) {
      setShowInstallModal(true);
      return true;
    }
    if (!deferredPrompt) {
      // Fallback: show modal with instructions
      setShowInstallModal(true);
      return false;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setShowBanner(false);
      setShowInstallModal(false);
    }
    setDeferredPrompt(null);
    return outcome === "accepted";
  }, [deferredPrompt]);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem("pwa_banner_dismissed_v2", "1");
  }, []);

  const openInstallModal = useCallback(() => {
    setShowInstallModal(true);
  }, []);

  const closeInstallModal = useCallback(() => {
    setShowInstallModal(false);
  }, []);

  return {
    canInstall: !isInstalled,
    isInstalled,
    showBanner,
    showInstallModal,
    install,
    dismissBanner,
    openInstallModal,
    closeInstallModal,
    isIosDevice: isIos(),
    hasNativePrompt: !!deferredPrompt,
  };
}
