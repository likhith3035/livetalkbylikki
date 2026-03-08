import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const PwaInstallBanner = () => {
  const { showBanner, canInstall, install, dismissBanner } = usePwaInstall();

  return (
    <AnimatePresence>
      {showBanner && canInstall && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 z-[100] sm:max-w-sm"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl p-4 shadow-2xl shadow-primary/10">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 border border-primary/20">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Install L Chat</p>
              <p className="text-xs text-muted-foreground leading-snug">
                Add to home screen for the best experience
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="glow"
                size="sm"
                onClick={install}
                className="h-9 px-4 text-xs font-semibold"
              >
                Install
              </Button>
              <button
                onClick={dismissBanner}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PwaInstallBanner;
