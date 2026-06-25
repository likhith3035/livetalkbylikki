import { forwardRef } from "react";
import { Home, MessageSquare, User, Settings, Info, Users } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";

const navItems = [
  { icon: Home, path: "/", label: "Home" },
  { icon: MessageSquare, path: "/chat", label: "Chat" },
  { icon: Info, path: "/info", label: "Info" },
  { icon: User, path: "/profile", label: "Profile" },
  { icon: Settings, path: "/settings", label: "Settings" },
];

const BottomNav = forwardRef<HTMLElement>((_, ref) => {
  const { pathname } = useLocation();
  const { settings } = useSettings();

  return (
    <nav
      ref={ref}
      className={cn(
        "fixed z-50 lg:hidden",
        settings.liquidGlassEnabled
          ? "bottom-4 left-4 right-4 rounded-[1.75rem] glass shadow-lg border-t-0 py-1"
          : "bottom-0 left-0 right-0 border-t border-border bg-card/90 backdrop-blur-xl safe-area-bottom"
      )}
      style={{ willChange: "transform" }}
    >
      <div className="mx-auto flex max-w-md justify-around py-1 sm:py-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={item.label}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <div
                className={cn(
                  "flex items-center justify-center h-7 w-7 rounded-lg",
                  isActive && "bg-primary/15"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
              </div>
              <span className={cn(
                "text-[9px] font-medium leading-none",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

BottomNav.displayName = "BottomNav";

export default BottomNav;
