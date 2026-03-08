import { Home, MessageSquare, User, Settings } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, path: "/", label: "Home" },
  { icon: MessageSquare, path: "/chat", label: "Chat" },
  { icon: User, path: "#", label: "Profile" },
  { icon: Settings, path: "#", label: "Settings" },
];

const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md justify-around py-3">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 text-muted-foreground transition-colors",
              pathname === item.path && "text-primary"
            )}
          >
            <item.icon className="h-5 w-5" />
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
