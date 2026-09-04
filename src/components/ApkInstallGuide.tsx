import { motion, AnimatePresence } from "framer-motion";
import { X, Download, FolderOpen, ShieldCheck, Package, Rocket, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApkInstallGuideProps {
  show: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: Download,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    title: "Download Complete",
    desc: "APK saved to your Downloads folder",
    done: true,
  },
  {
    icon: FolderOpen,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    title: "Open the APK file",
    desc: "Tap the notification or find it in Downloads",
  },
  {
    icon: ShieldCheck,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    title: "Allow installation",
    desc: 'Tap "Install anyway" if prompted by Android',
  },
  {
    icon: Package,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    title: "Install IncogTalk",
    desc: "Follow the on-screen installer steps",
  },
  {
    icon: Rocket,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    title: "Open the app",
    desc: "IncogTalk is ready — speak freely, stay incognito!",
  },
];

export default function ApkInstallGuide({ show, onClose }: ApkInstallGuideProps) {
  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[201] sm:inset-0 sm:flex sm:items-center sm:justify-center sm:pointer-events-none"
          >
            <div
              className="relative w-full sm:max-w-sm sm:pointer-events-auto rounded-t-[2rem] sm:rounded-[2rem] bg-card border border-border/60 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top gradient bar */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-500 via-primary to-blue-500" />

              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>

              <div className="px-6 pb-8 pt-3 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Animated download arrow */}
                    <div className="relative h-11 w-11 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center overflow-hidden">
                      <motion.div
                        animate={{ y: ["-100%", "0%", "0%", "100%"] }}
                        transition={{ duration: 1.6, repeat: Infinity, times: [0, 0.3, 0.7, 1], ease: "easeInOut" }}
                      >
                        <ArrowDown className="h-5 w-5 text-green-400" />
                      </motion.div>
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">Download Started!</p>
                      <p className="text-[11px] text-muted-foreground">Follow these steps to install</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Animated notification arrow hint */}
                <div className="relative flex items-center gap-3 rounded-2xl bg-secondary/50 border border-border/50 px-4 py-3 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" />
                  <motion.div
                    animate={{ x: [0, 6, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    className="shrink-0"
                  >
                    <ArrowDown className="h-5 w-5 text-primary rotate-0" />
                  </motion.div>
                  <p className="text-xs font-semibold text-foreground relative z-10">
                    Tap the downloaded APK to install the IncogTalk app
                  </p>
                </div>

                {/* Steps */}
                <div className="space-y-2.5">
                  {STEPS.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 25 }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3.5 py-3",
                        step.done
                          ? "bg-green-500/8 border-green-500/20"
                          : "bg-secondary/30 border-border/40"
                      )}
                    >
                      {/* Step number / check */}
                      <div className={cn(
                        "h-8 w-8 rounded-xl border flex items-center justify-center shrink-0",
                        step.bg
                      )}>
                        <step.icon className={cn("h-4 w-4", step.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-xs font-bold leading-tight",
                          step.done ? "text-green-400" : "text-foreground"
                        )}>
                          {step.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                          {step.desc}
                        </p>
                      </div>

                      {/* Step number badge */}
                      <div className={cn(
                        "h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black",
                        step.done
                          ? "bg-green-500/20 text-green-400"
                          : "bg-border/60 text-muted-foreground"
                      )}>
                        {step.done ? "✓" : i + 1}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="w-full h-11 rounded-2xl bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors active:scale-[0.98]"
                >
                  Got it
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
