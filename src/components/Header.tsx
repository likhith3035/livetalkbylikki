import { forwardRef } from "react";
import { Shield } from "lucide-react";
import OnlineBadge from "@/components/OnlineBadge";

interface HeaderProps {
  onlineCount: number;
}

const Header = forwardRef<HTMLElement, HeaderProps>(({ onlineCount }, ref) => {
  return (
    <header ref={ref} className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
        </div>
        <span className="font-display text-base sm:text-lg font-bold text-foreground">Echo</span>
      </div>
      <OnlineBadge count={onlineCount} />
    </header>
  );
});

Header.displayName = "Header";

export default Header;

