import { Home, MessageSquare, User, Settings, Info } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, path: "/", label: "Home" },
  { icon: MessageSquare, path: "/chat", label: "Chat" },
  { icon: User, path: "/profile", label: "Profile" },
  { icon: Settings, path: "/settings", label: "Settings" },
  { icon: Info, path: "/info", label: "About" },
];

const DesktopSidebar = () => {
  const { pathname } = useLocation();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[220px] flex-col border-r border-border bg-card/50 backdrop-blur-xl z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border/50">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
          <MessageSquare className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-bold text-foreground">L Chat</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground/50 text-center">© 2026 L Chat</p>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
