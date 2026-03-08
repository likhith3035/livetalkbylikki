import { forwardRef } from "react";
import { Shield } from "lucide-react";
import OnlineBadge from "@/components/OnlineBadge";

interface HeaderProps {
  onlineCount: number;
}

const Header = forwardRef<HTMLElement, HeaderProps>(({ onlineCount }, ref) => {
  return (
    <header ref={ref} className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-bold text-foreground">Echo</span>
      </div>
      <OnlineBadge count={onlineCount} />
    </header>
  );
});

Header.displayName = "Header";

export default Header;

