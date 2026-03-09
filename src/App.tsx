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
import GroupChatPage from "./pages/GroupChatPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import InfoPage from "./pages/InfoPage";
import NotFound from "./pages/NotFound";

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
          <Route path="/group" element={<GroupChatPage />} />
          <Route path="/group/:code" element={<GroupChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/info" element={<InfoPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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

export default App;
