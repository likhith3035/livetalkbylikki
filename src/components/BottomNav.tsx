import { forwardRef } from "react";
import { Home, MessageSquare, User, Settings } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, path: "/", label: "Home" },
  { icon: MessageSquare, path: "/chat", label: "Chat" },
  { icon: User, path: "/profile", label: "Profile" },
  { icon: Settings, path: "/settings", label: "Settings" },
];

const BottomNav = forwardRef<HTMLElement>((_, ref) => {
  const { pathname } = useLocation();

  return (
    <nav ref={ref} className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md justify-around py-3">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 text-muted-foreground transition-colors",
              pathname === item.path && "text-primary"
            )}
            aria-label={item.label}
          >
            <item.icon className="h-5 w-5" />
          </Link>
        ))}
      </div>
    </nav>
  );
});

BottomNav.displayName = "BottomNav";

export default BottomNav;

