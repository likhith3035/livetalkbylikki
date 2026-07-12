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
      className="fixed z-[60] lg:hidden bottom-0 left-0 right-0 border-t border-border/60 safe-area-bottom"
      style={{
        backgroundColor: "hsl(var(--card))",
        willChange: "transform",
      }}
    >
      <div className="mx-auto flex max-w-md justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[52px]",
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
                isActive && "font-semibold text-primary"
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
