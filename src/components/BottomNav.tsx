import { forwardRef } from "react";
import { Home, MessageSquare, User, Settings, Info, Users } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, path: "/", label: "Home" },
  { icon: MessageSquare, path: "/chat", label: "Chat" },
  { icon: Users, path: "/group", label: "Group" },
  { icon: Info, path: "/info", label: "Info" },
  { icon: User, path: "/profile", label: "Profile" },
  { icon: Settings, path: "/settings", label: "Settings" },
];

const BottomNav = forwardRef<HTMLElement>((_, ref) => {
  const { pathname } = useLocation();

  return (
    <nav ref={ref} className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/90 backdrop-blur-xl safe-area-bottom lg:hidden">
      <div className="mx-auto flex max-w-md justify-around py-1.5 sm:py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={item.label}
            >
              <div className={cn(
                "flex items-center justify-center h-7 w-7 rounded-lg transition-colors",
                isActive && "bg-primary/15"
              )}>
                <item.icon className="h-[18px] w-[18px]" />
              </div>
              <span className={cn(
                "text-[10px] font-medium leading-none",
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
