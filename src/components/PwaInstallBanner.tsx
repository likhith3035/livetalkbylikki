import { X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const PwaInstallBanner = () => {
  const { showBanner, canInstall, install, dismissBanner } = usePwaInstall();
  const location = useLocation();

  // Suppress banner on /chat to avoid blocking the message input & keyboard
  const isChatRoute = location.pathname.startsWith("/chat");

  if (!showBanner || !canInstall || isChatRoute) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-6 z-40 sm:max-w-xs pb-[env(safe-area-inset-bottom,0px)]"
        >
          <div className="relative flex items-center gap-3 rounded-2xl border border-primary/30 bg-card/98 backdrop-blur-xl p-3.5 shadow-2xl shadow-primary/15 overflow-hidden">
            {/* Accent line */}
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-violet-500 via-primary to-blue-500" />

            <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden border border-border/50 bg-background flex items-center justify-center">
              <img src="/logo.png" alt="IncogTalk" className="h-7 w-7 object-contain" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">Install IncogTalk</p>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Add to home screen for the best experience
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="glow"
                size="sm"
                onClick={install}
                className="h-8 px-3 text-xs font-bold rounded-xl gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Install
              </Button>
              <button
                onClick={dismissBanner}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PwaInstallBanner;
