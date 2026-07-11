import { useState } from "react";
import { Flag, Ban, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useChatContext } from "@/contexts/ChatContext";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useSettings } from "@/contexts/SettingsContext";

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
  const { settings } = useSettings();

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
          className={cn(
            "gap-1.5 h-8 px-2.5 text-xs font-bold transition-all hover:scale-[1.03] border shadow-sm",
            settings.liquidGlassEnabled
              ? "bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground hover:text-destructive"
              : "bg-secondary/40 border-border/40 hover:bg-secondary/60 text-muted-foreground hover:text-destructive"
          )}
          title="Report or Block Stranger"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn(
          "z-50 rounded-xl border p-1.5 shadow-xl w-44 flex flex-col gap-0.5",
          settings.liquidGlassEnabled
            ? "glass-heavy border-white/10 dark:border-white/5"
            : "bg-card border-border"
        )}
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
                className={cn(
                  "w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
                  settings.liquidGlassEnabled
                    ? "text-white/70 hover:bg-white/10 hover:text-white"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {reason}
              </button>
            ))}
            <button
              onClick={() => setShowReport(false)}
              className={cn(
                "w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors mt-1 border-t pt-1.5",
                settings.liquidGlassEnabled
                  ? "border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                  : "border-border/40 text-muted-foreground/60 hover:text-foreground hover:bg-secondary/40"
              )}
            >
              Back
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 w-full">
            <button
              onClick={() => setShowReport(true)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors",
                settings.liquidGlassEnabled
                  ? "text-white/70 hover:bg-white/10 hover:text-white"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Flag className="h-3.5 w-3.5" />
              Report user
            </button>
            <button
              onClick={handleBlock}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors",
                settings.liquidGlassEnabled
                  ? "text-rose-400 hover:bg-rose-500/20"
                  : "text-destructive hover:bg-destructive/10"
              )}
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

