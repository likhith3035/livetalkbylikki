import { useEffect, lazy, Suspense, Component, type ReactNode } from "react";
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
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { useBiometrics } from "@/hooks/use-biometrics";
import { OfflineBanner } from "@/components/OfflineBanner";
import { BiometricLockModal } from "@/components/security/BiometricLockModal";
import { requestNotificationPermission } from "@/lib/notifications";
import Index from "./pages/Index";
import ChatPage from "./pages/ChatPage";
import RoomPage from "./pages/RoomPage";

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

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("[GlobalErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
            🔄
          </div>
          <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            An update was applied or a connection error occurred. Please refresh to load the latest version.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg hover:opacity-90 transition-all"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const ProfilePage = lazyWithRetry(() => import("./pages/ProfilePage"));
const SettingsPage = lazyWithRetry(() => import("./pages/SettingsPage"));
const SafetyCenterPage = lazyWithRetry(() => import("./pages/SafetyCenterPage"));
const InfoPage = lazyWithRetry(() => import("./pages/InfoPage"));
const PrivacyPage = lazyWithRetry(() => import("./pages/PrivacyPage"));
const TermsPage = lazyWithRetry(() => import("./pages/TermsPage"));
const GuidelinesPage = lazyWithRetry(() => import("./pages/GuidelinesPage"));
const AIChatPage = lazyWithRetry(() => import("./features/ai-chat/components/AIChatPage"));
const PromptAnalyzerPage = lazyWithRetry(() => import("./features/prompt-analyzer/components/PromptAnalyzerPage"));
const FileSharingPage = lazyWithRetry(() => import("./features/file-sharing/components/FileSharingPage"));
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
        className="flex flex-1 flex-col min-h-0 w-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route path="/prompt-analyzer" element={<PromptAnalyzerPage />} />
          <Route path="/file-sharing" element={<FileSharingPage />} />
          <Route path="/share/:code" element={<FileSharingPage />} />
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

const AppContent = () => {
  const biometrics = useBiometrics();

  // Request native notification permission on app startup
  useEffect(() => {
    requestNotificationPermission().catch(() => {});
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineBanner />
      <PullToRefreshIndicator />
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
            <GlobalErrorBoundary>
              <Suspense fallback={
                <div className="flex-1 flex items-center justify-center bg-[#09090B] text-muted-foreground text-sm animate-pulse min-h-[50vh]">
                  Loading...
                </div>
              }>
                <AnimatedRoutes />
              </Suspense>
            </GlobalErrorBoundary>
          </AppShell>
        </ChatProvider>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => {
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

    // Warm up Supabase in the background — don't block rendering
    supabase.auth.getSession().catch((e) => {
      console.warn("[App] Supabase warmup failed (non-blocking):", e);
    });

    return () => {
      window.removeEventListener("error", handleChunkError);
      window.removeEventListener("unhandledrejection", handleChunkError);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </QueryClientProvider>
  );
};

export default App;
