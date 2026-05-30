import { useState } from "react";
import { Flag, Ban, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useChatContext } from "@/contexts/ChatContext";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

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
  const [open, setOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const { toast } = useToast();
  const { reportStranger } = useChatContext();

  const handleReport = (reason: string) => {
    reportStranger(reason);
    setShowReport(false);
    setOpen(false);
    onBlock();
  };

  const handleBlock = () => {
    toast({
      title: "User blocked",
      description: "You won't be matched with this user again.",
    });
    setOpen(false);
    onBlock();
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setShowReport(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-destructive h-8 px-2 text-xs"
          title="Report or Block Stranger"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="z-50 rounded-xl border border-border bg-card p-1.5 shadow-lg w-44 flex flex-col gap-0.5"
      >
        {showReport ? (
          <div className="flex flex-col gap-0.5 w-full">
            <p className="px-2 py-1 text-xs font-semibold text-foreground border-b border-border/40 mb-1">
              Report reason
            </p>
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => handleReport(reason)}
                className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                {reason}
              </button>
            ))}
            <button
              onClick={() => setShowReport(false)}
              className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-muted-foreground/60 hover:text-foreground hover:bg-secondary/40 transition-colors mt-1 border-t border-border/40 pt-1.5"
            >
              Back
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 w-full">
            <button
              onClick={() => setShowReport(true)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Flag className="h-3.5 w-3.5" />
              Report user
            </button>
            <button
              onClick={handleBlock}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Ban className="h-3.5 w-3.5" />
              Block user
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default ReportBlockMenu;

