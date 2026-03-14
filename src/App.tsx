import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { AnimatePresence, motion } from "framer-motion";
import DesktopSidebar from "@/components/DesktopSidebar";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import NotificationPrompt from "@/components/NotificationPrompt";
import FeedbackSharePopup from "@/components/FeedbackSharePopup";
import Index from "./pages/Index";
import ChatPage from "./pages/ChatPage";
import RoomPage from "./pages/RoomPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import SafetyCenterPage from "./pages/SafetyCenterPage";
import InfoPage from "./pages/InfoPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import GuidelinesPage from "./pages/GuidelinesPage";
import NotFound from "./pages/NotFound";
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  type: "tween" as const,
  ease: [0.25, 0.1, 0.25, 1] as const,
  duration: 0.2,
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
        className="min-h-[100dvh]"
      >
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/room/:code" element={<RoomPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/safety" element={<SafetyCenterPage />} />
          <Route path="/info" element={<InfoPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/guidelines" element={<GuidelinesPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};


const App = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ping Supabase to make sure it's awake before showing the app
    const checkConnection = async () => {
      try {
        // Quick, lightweight call to wake it up if needed.
        // auth.getSession() is incredibly fast, doesn't require tables, and cleanly wakes up the database.
        await supabase.auth.getSession();
      } catch (e) {
        // Ignore errors if table doesn't exist, the goal is just hitting the API to wake it up
      } finally {
        setIsReady(true);
      }
    };

    checkConnection();
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
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ChatProvider>
              <DesktopSidebar />
              <PwaInstallBanner />
              <NotificationPrompt />
              <FeedbackSharePopup />
              <div className="lg:pl-[220px]">
                <AnimatedRoutes />
              </div>
            </ChatProvider>
          </BrowserRouter>
        </TooltipProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
};

export default App;
