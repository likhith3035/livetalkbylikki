import { useState } from "react";
import { Flag, Ban, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ReportBlockMenuProps {
  onBlock: () => void;
}

const REPORT_REASONS = [
  "Spam or advertising",
  "Harassment or bullying",
  "Inappropriate content",
  "Threatening behavior",
  "Other",
];

const ReportBlockMenu = ({ onBlock }: ReportBlockMenuProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const { toast } = useToast();

  const handleReport = (reason: string) => {
    toast({
      title: "Report submitted",
      description: `Thank you. We'll review this report.`,
    });
    setShowReport(false);
    setShowMenu(false);
    onBlock();
  };

  const handleBlock = () => {
    toast({
      title: "User blocked",
      description: "You won't be matched with this user again.",
    });
    setShowMenu(false);
    onBlock();
  };

  if (!showMenu) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowMenu(true)}
        className="gap-1.5 text-muted-foreground hover:text-destructive"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
      </Button>
    );
  }

  if (showReport) {
    return (
      <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-xl border border-border bg-card p-2 shadow-lg animate-fade-in">
        <p className="px-2 py-1 text-xs font-medium text-foreground">Report reason</p>
        {REPORT_REASONS.map((reason) => (
          <button
            key={reason}
            onClick={() => handleReport(reason)}
            className="w-full rounded-lg px-3 py-2 text-left text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {reason}
          </button>
        ))}
        <button
          onClick={() => { setShowReport(false); setShowMenu(false); }}
          className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-muted-foreground/60 hover:text-foreground transition-colors mt-1"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-border bg-card p-1.5 shadow-lg animate-fade-in">
      <button
        onClick={() => setShowReport(true)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      >
        <Flag className="h-3.5 w-3.5" />
        Report user
      </button>
      <button
        onClick={handleBlock}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Ban className="h-3.5 w-3.5" />
        Block user
      </button>
      <button
        onClick={() => setShowMenu(false)}
        className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-muted-foreground/60 hover:text-foreground transition-colors mt-0.5"
      >
        Cancel
      </button>
    </div>
  );
};

export default ReportBlockMenu;
