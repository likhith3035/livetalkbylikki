import { useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const THEMES = [
  { name: "Default", you: "265 90% 55%", stranger: "260 20% 92%", youFg: "0 0% 100%", strangerFg: "270 20% 20%" },
  { name: "Ocean", you: "200 80% 45%", stranger: "200 25% 90%", youFg: "0 0% 100%", strangerFg: "200 30% 15%" },
  { name: "Sunset", you: "15 85% 55%", stranger: "30 30% 92%", youFg: "0 0% 100%", strangerFg: "15 30% 20%" },
  { name: "Forest", you: "150 60% 38%", stranger: "140 20% 90%", youFg: "0 0% 100%", strangerFg: "150 30% 15%" },
  { name: "Midnight", you: "240 50% 40%", stranger: "240 20% 85%", youFg: "0 0% 100%", strangerFg: "240 30% 15%" },
  { name: "Rose", you: "340 75% 55%", stranger: "340 25% 92%", youFg: "0 0% 100%", strangerFg: "340 30% 20%" },
  { name: "Amber", you: "40 90% 50%", stranger: "40 30% 92%", youFg: "0 0% 10%", strangerFg: "40 30% 15%" },
  { name: "Neon", you: "160 100% 40%", stranger: "270 30% 88%", youFg: "0 0% 5%", strangerFg: "270 30% 15%" },
];

interface ChatThemePickerProps {
  onApply: (theme: typeof THEMES[0]) => void;
}

const ChatThemePicker = ({ onApply }: ChatThemePickerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1 h-8 px-2 text-xs"
        title="Chat theme"
      >
        <Palette className="h-3.5 w-3.5" />
      </Button>
      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 rounded-xl border border-border bg-card shadow-xl p-2 grid grid-cols-4 gap-1.5 min-w-[200px]">
          {THEMES.map((t) => (
            <button
              key={t.name}
              onClick={() => { onApply(t); setOpen(false); }}
              className="flex flex-col items-center gap-1 rounded-lg p-1.5 hover:bg-secondary transition-colors"
              title={t.name}
            >
              <div className="flex gap-0.5">
                <span
                  className="h-4 w-4 rounded-full border border-border"
                  style={{ backgroundColor: `hsl(${t.you})` }}
                />
                <span
                  className="h-4 w-4 rounded-full border border-border"
                  style={{ backgroundColor: `hsl(${t.stranger})` }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground">{t.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatThemePicker;
export { THEMES };
export type ChatTheme = typeof THEMES[0];
