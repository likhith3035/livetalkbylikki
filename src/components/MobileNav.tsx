import { useState, useEffect, useRef } from "react";
import { Home, MessageSquare, User, Settings, Info, X, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { icon: Home,          path: "/",         label: "Home",     accent: "#10b981" },
  { icon: MessageSquare, path: "/chat",      label: "Chat",     accent: "hsl(var(--primary))" },
  { icon: Info,          path: "/info",      label: "Info",     accent: "#0ea5e9" },
  { icon: User,          path: "/profile",   label: "Profile",  accent: "#8b5cf6" },
  { icon: Settings,      path: "/settings",  label: "Settings", accent: "#64748b" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const menuRef = useRef<HTMLDivElement>(null);

  const activeItem = navItems.find((i) => i.path === pathname) ?? navItems[0];

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on outside tap
  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // Use capture so it fires before anything else
    document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, [open]);

  const handleNav = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Full-screen scrim when open */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[58] bg-black/40 lg:hidden"
            onPointerDown={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Menu container — anchored bottom-right */}
      <div
        ref={menuRef}
        className="fixed bottom-5 right-4 z-[60] lg:hidden flex flex-col items-end gap-3"
        style={{ willChange: "transform" }}
      >
        {/* Nav items — slide up from FAB */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className={cn(
                "flex flex-col gap-1 p-2 rounded-3xl shadow-2xl border",
                settings.liquidGlassEnabled
                  ? "glass border-white/10"
                  : "bg-card border-border/50"
              )}
              style={
                settings.liquidGlassEnabled
                  ? {}
                  : { backgroundColor: "hsl(var(--card))" }
              }
            >
              {navItems.map((item, i) => {
                const isActive = pathname === item.path;
                return (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.035, type: "spring", stiffness: 400, damping: 28 }}
                    onClick={() => handleNav(item.path)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl w-full text-left",
                      "transition-colors duration-150 active:scale-95",
                      isActive
                        ? "text-white"
                        : "text-foreground hover:bg-primary/10"
                    )}
                    style={
                      isActive
                        ? { backgroundColor: item.accent }
                        : {}
                    }
                    aria-label={item.label}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                        isActive ? "bg-white/20" : "bg-secondary"
                      )}
                      style={isActive ? {} : { backgroundColor: "hsl(var(--secondary))" }}
                    >
                      <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-foreground")} />
                    </div>
                    <span className={cn(
                      "text-sm font-semibold pr-2",
                      isActive ? "text-white" : "text-foreground"
                    )}>
                      {item.label}
                    </span>
                    {isActive && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-white/70 shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB toggle button */}
        <motion.button
          onClick={() => setOpen((v) => !v)}
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
            "relative overflow-hidden"
          )}
          style={{ backgroundColor: "hsl(var(--primary))", willChange: "transform" }}
          aria-label={open ? "Close menu" : "Open navigation"}
        >
          {/* Ripple glow */}
          <span
            className="absolute inset-0 rounded-2xl opacity-30"
            style={{ background: `radial-gradient(circle at 50% 50%, white 0%, transparent 70%)` }}
          />

          <AnimatePresence mode="wait">
            {open ? (
              <motion.span
                key="x"
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                className="relative z-10"
              >
                <X className="h-6 w-6 text-white" />
              </motion.span>
            ) : (
              <motion.span
                key="icon"
                initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                className="relative z-10"
              >
                <activeItem.icon className="h-6 w-6 text-white" />
              </motion.span>
            )}
          </AnimatePresence>

          {/* Active page color dot */}
          {!open && (
            <span
              className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full border-2 border-primary"
              style={{ backgroundColor: activeItem.accent }}
            />
          )}
        </motion.button>
      </div>
    </>
  );
}
