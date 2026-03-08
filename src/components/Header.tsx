import { Shield } from "lucide-react";
import OnlineBadge from "@/components/OnlineBadge";

const Header = ({ onlineCount }: { onlineCount: number }) => {
  return (
    <header className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold font-display text-foreground">Echo</span>
      </div>
      <OnlineBadge count={onlineCount} />
    </header>
  );
};

export default Header;
