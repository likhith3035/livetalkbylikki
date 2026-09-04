import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share, Plus, Smartphone, Zap, Shield, Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Zap,     text: "Instant load — no browser bar" },
  { icon: Shield,  text: "Works offline & in background" },
  { icon: Globe,   text: "Full-screen immersive experience" },
  { icon: Smartphone, text: "Native app feel on any device" },
];

// iOS step-by-step instructions
const IOS_STEPS = [
  {
    icon: <Share className="h-5 w-5 text-blue-400" />,
    label: "Tap the Share button",
    sub: "Bottom of Safari browser",
  },
  {
    icon: <Plus className="h-5 w-5 text-blue-400" />,
    label: 'Tap "Add to Home Screen"',
    sub: "Scroll down in the share sheet",
  },
  {
    icon: <Check className="h-5 w-5 text-green-400" />,
    label: 'Tap "Add" to confirm',
    sub: "IncogTalk appears on your home screen",
  },
];

export default function PwaInstallModal() {
  const { showInstallModal, closeInstallModal, install, isIosDevice, hasNativePrompt } = usePwaInstall();

  const handleInstall = async () => {
    if (hasNativePrompt) {
      await install();
    }
    // For iOS the modal stays open showing instructions
  };

  return (
    <AnimatePresence>
      {showInstallModal && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={closeInstallModal}
          />

          {/* Sheet — slides up from bottom on mobile, centered on desktop */}
          <motion.div
            key="sheet"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-[201] sm:inset-0 sm:flex sm:items-center sm:justify-center sm:pointer-events-none"
          >
            <div
              className={cn(
                "relative w-full sm:max-w-sm sm:pointer-events-auto",
                "rounded-t-[2rem] sm:rounded-[2rem]",
                "bg-card border border-border/60 shadow-2xl overflow-hidden"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top accent */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 via-primary to-blue-500" />

              {/* Drag handle (mobile) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>

              <div className="px-6 pb-8 pt-4 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-2xl overflow-hidden border border-border/50 shadow-lg bg-background flex items-center justify-center">
                      <img src="/logo.png" alt="IncogTalk" className="h-10 w-10 object-contain" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-foreground">IncogTalk</h2>
                      <p className="text-xs text-muted-foreground">Speak Freely. Stay Incognito.</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1,2,3,4,5].map(i => (
                          <svg key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="text-[10px] text-muted-foreground ml-0.5">Free</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeInstallModal}
                    className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* iOS instructions OR Android install */}
                {isIosDevice ? (
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-foreground text-center">
                      Add to Home Screen
                    </p>
                    <div className="space-y-3">
                      {IOS_STEPS.map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-3 rounded-xl bg-secondary/50 border border-border/50 px-4 py-3"
                        >
                          <div className="h-9 w-9 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
                            {step.icon}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{step.label}</p>
                            <p className="text-[11px] text-muted-foreground">{step.sub}</p>
                          </div>
                          <div className="ml-auto h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-black text-primary">{i + 1}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    {/* Arrow pointing to Safari share button */}
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Share className="h-3.5 w-3.5" />
                      <span>Look for the share icon at the bottom of Safari</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Features list */}
                    <div className="grid grid-cols-2 gap-2">
                      {FEATURES.map((f, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.07 }}
                          className="flex items-center gap-2 rounded-xl bg-secondary/40 border border-border/40 px-3 py-2.5"
                        >
                          <f.icon className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-[11px] font-medium text-foreground leading-tight">{f.text}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Install button */}
                    {hasNativePrompt ? (
                      <Button
                        onClick={handleInstall}
                        variant="glow"
                        className="w-full h-13 rounded-2xl gap-2 text-sm font-black uppercase tracking-wider"
                        size="lg"
                      >
                        <Download className="h-5 w-5" />
                        Install App — It's Free
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-center text-muted-foreground">
                          To install, use your browser's menu and select<br />
                          <strong className="text-foreground">"Add to Home Screen"</strong> or <strong className="text-foreground">"Install App"</strong>
                        </p>
                        <Button
                          onClick={closeInstallModal}
                          variant="secondary"
                          className="w-full rounded-2xl"
                        >
                          Got it
                        </Button>
                      </div>
                    )}
                  </>
                )}

                <p className="text-center text-[10px] text-muted-foreground/50">
                  No app store needed · Installs in seconds · Always free
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
