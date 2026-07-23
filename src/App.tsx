import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { AnimatePresence, motion } from "framer-motion";
import AppShell from "@/components/AppShell";
import NotificationPrompt from "@/components/NotificationPrompt";
import FeedbackSharePopup from "@/components/FeedbackSharePopup";
import ScrollToTop from "@/components/ScrollToTop";
import FloatingChatWidget from "@/components/chat/FloatingChatWidget";
import { AppUpdateModal } from "@/components/AppUpdateModal";

function clearAppCachesAndReload() {
  const lastReload = Number(window.sessionStorage.getItem("lazy_retry_last_ts") || "0");
  const now = Date.now();
  // Prevent infinite reload loop if server is down (minimum 8s threshold)
  if (now - lastReload > 8000) {
    window.sessionStorage.setItem("lazy_retry_last_ts", String(now));
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      }).finally(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }
}

function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      const component = await componentImport();
      return component;
    } catch (error) {
      console.warn("[App] Failed to load lazy module chunk. Clearing cache & reloading...", error);
      clearAppCachesAndReload();
      throw error;
    }
  });
}

const Index = lazyWithRetry(() => import("./pages/Index"));
const ChatPage = lazyWithRetry(() => import("./pages/ChatPage"));
const RoomPage = lazyWithRetry(() => import("./pages/RoomPage"));
const ProfilePage = lazyWithRetry(() => import("./pages/ProfilePage"));
const SettingsPage = lazyWithRetry(() => import("./pages/SettingsPage"));
const SafetyCenterPage = lazyWithRetry(() => import("./pages/SafetyCenterPage"));
const InfoPage = lazyWithRetry(() => import("./pages/InfoPage"));
const PrivacyPage = lazyWithRetry(() => import("./pages/PrivacyPage"));
const TermsPage = lazyWithRetry(() => import("./pages/TermsPage"));
const GuidelinesPage = lazyWithRetry(() => import("./pages/GuidelinesPage"));
const AIChatPage = lazyWithRetry(() => import("./features/ai-chat/components/AIChatPage"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const HandoffPage = lazyWithRetry(() => import("./pages/HandoffPage"));

const queryClient = new QueryClient();

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const pageTransition = {
  type: "tween" as const,
  ease: "easeInOut" as const,
  duration: 0.15,
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        className="flex flex-1 flex-col"
      >
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route path="/room/:code" element={<RoomPage />} />
          <Route path="/handoff" element={<HandoffPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/safety" element={<SafetyCenterPage />} />
          <Route path="/info" element={<InfoPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/guidelines" element={<GuidelinesPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};




import { useBiometrics } from "@/hooks/use-biometrics";
import { BiometricLockModal } from "@/components/security/BiometricLockModal";

const AppContent = () => {
  const biometrics = useBiometrics();

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BiometricLockModal
        isOpen={biometrics.isLocked}
        biometricType={biometrics.biometricType}
        onAuthenticate={biometrics.authenticate}
      />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <ChatProvider>
          <AppShell>
            <NotificationPrompt />
            <FeedbackSharePopup />
            <FloatingChatWidget />
            <AppUpdateModal />
            <Suspense fallback={
              <div className="flex-1 flex items-center justify-center bg-[#09090B] text-muted-foreground text-sm animate-pulse min-h-[50vh]">
                Loading...
              </div>
            }>
              <AnimatedRoutes />
            </Suspense>
          </AppShell>
        </ChatProvider>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const handleChunkError = (e: ErrorEvent | PromiseRejectionEvent) => {
      const message = "reason" in e ? (e.reason?.message || String(e.reason)) : (e.message || String(e));
      if (
        message &&
        (message.includes("Failed to fetch dynamically imported module") ||
         message.includes("Expected a JavaScript-or-Wasm module script") ||
         message.includes("MIME type") ||
         message.includes("Loading chunk"))
      ) {
        console.warn("[App] Dynamic import chunk failed (new deployment detected). Clearing cache & reloading...", message);
        clearAppCachesAndReload();
      }
    };

    window.addEventListener("error", handleChunkError);
    window.addEventListener("unhandledrejection", handleChunkError);

    // Ping Supabase to make sure it's awake before showing the app
    const checkConnection = async () => {
      // 5-second timeout to prevent being stuck forever if Supabase is down
      const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 5000));
      
      try {
        // Quick, lightweight call to wake it up if needed.
        await Promise.race([
          supabase.auth.getSession(),
          timeout
        ]);
      } catch (e) {
        console.warn("[App] Supabase connection check timed out or failed:", e);
      } finally {
        setIsReady(true);
      }
    };

    checkConnection();

    return () => {
      window.removeEventListener("error", handleChunkError);
      window.removeEventListener("unhandledrejection", handleChunkError);
    };
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground animate-pulse text-sm">Waking up servers, please wait...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </QueryClientProvider>
  );
};

export default App;
