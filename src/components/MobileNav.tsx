import { useState, useEffect, useRef } from "react";
import { Home, MessageSquare, User, Settings, Info, X, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { icon: Settings, path: "/settings", label: "Settings", color: "bg-slate-500" },
  { icon: User,     path: "/profile",  label: "Profile",  color: "bg-violet-500" },
  { icon: Info,     path: "/info",     label: "Info",     color: "bg-sky-500"    },
  { icon: MessageSquare, path: "/chat", label: "Chat",   color: "bg-primary"    },
  { icon: Home,     path: "/",         label: "Home",     color: "bg-emerald-500"},
];

// Spread items in an arc from bottom-right, fanning left and up
// 5 items: angles from ~100° to ~190° (spreading upward-left from the FAB)
const ARC_ANGLES = [162, 130, 100, 72, 44]; // degrees, 0° = right
const RADIUS = 72; // px distance from FAB center

function polarToXY(angleDeg: number, r: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: -Math.cos(rad) * r, y: -Math.sin(rad) * r };
}

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Active item
  const activeItem = navItems.find((i) => i.path === pathname) ?? navItems[4];

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on outside tap
  useEffect(() => {
    if (!open) return;
    const handler = (e: TouchEvent | MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  const handleNav = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Scrim — dims the page when open */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[58] bg-black/30 backdrop-blur-[2px] lg:hidden"
            onPointerDown={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB + arc items — always rendered, hidden on desktop */}
      <div
        ref={overlayRef}
        className="fixed bottom-6 right-5 z-[60] lg:hidden"
        style={{ willChange: "transform" }}
      >
        {/* Arc nav items */}
        <AnimatePresence>
          {open && navItems.map((item, i) => {
            const { x, y } = polarToXY(ARC_ANGLES[i], RADIUS);
            const isActive = pathname === item.path;
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                animate={{ opacity: 1, x, y, scale: 1 }}
                exit={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 28,
                  delay: i * 0.04,
                }}
                className="absolute bottom-0 right-0"
              >
                <button
                  onClick={() => handleNav(item.path)}
                  className={cn(
                    "flex flex-col items-center gap-1 group",
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  aria-label={item.label}
                >
                  <div
                    className={cn(
                      "h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg",
                      "transition-transform active:scale-90",
                      isActive
                        ? `${item.color} ring-2 ring-white/30 ring-offset-1 ring-offset-transparent`
                        : "bg-card border border-border/50"
                    )}
                    style={
                      isActive
                        ? {}
                        : { backgroundColor: "hsl(var(--card))" }
                    }
                  >
                    <item.icon
                      className={cn(
                        "h-[18px] w-[18px]",
                        isActive ? "text-white" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded-md",
                      isActive
                        ? "text-foreground bg-card/80"
                        : "text-muted-foreground bg-black/30"
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          onClick={() => setOpen((v) => !v)}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "relative h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            settings.liquidGlassEnabled
              ? "glass border border-primary/30"
              : "bg-primary"
          )}
          style={
            settings.liquidGlassEnabled
              ? { willChange: "transform" }
              : { backgroundColor: "hsl(var(--primary))", willChange: "transform" }
          }
          aria-label={open ? "Close menu" : "Open navigation"}
        >
          {/* Active page icon shown when closed */}
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="h-6 w-6 text-primary-foreground" />
              </motion.span>
            ) : (
              <motion.span
                key="icon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <activeItem.icon
                  className={cn(
                    "h-6 w-6",
                    settings.liquidGlassEnabled ? "text-primary" : "text-primary-foreground"
                  )}
                />
              </motion.span>
            )}
          </AnimatePresence>

          {/* Active page dot indicator */}
          {!open && (
            <span
              className={cn(
                "absolute top-1.5 right-1.5 h-2 w-2 rounded-full",
                activeItem.color
              )}
            />
          )}
        </motion.button>
      </div>
    </>
  );
}
