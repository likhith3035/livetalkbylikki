import { Settings, Copy, Download } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import ChatSearchBar from "@/components/chat/ChatSearchBar";
import ChatThemePicker from "@/components/chat/ChatThemePicker";
import ReportBlockMenu from "@/components/ReportBlockMenu";
import type { Message } from "@/hooks/use-chat";
import type { ChatTheme } from "@/components/chat/ChatThemePicker";
import { useSettings } from "@/contexts/SettingsContext";
import { useChatContext } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";
import { exportChatAsText, copyToClipboard, downloadAsFile } from "@/lib/chat-export";
import { useToast } from "@/hooks/use-toast";

interface ChatToolsMenuProps {
  messages: Message[];
  onSearchResult?: (messageId: string | null) => void;
  disappearTimer: number | null | undefined;
  onSetDisappearTimer?: (t: number | null) => void;
  onBlock: () => void;
  onThemeChange?: (theme: ChatTheme) => void;
  triggerClassName?: string;
}

export const ChatToolsMenu = ({
  messages,
  onSearchResult,
  disappearTimer,
  onSetDisappearTimer,
  onBlock,
  onThemeChange,
  triggerClassName,
}: ChatToolsMenuProps) => {
  const { toast } = useToast();
  const { settings, updateSetting } = useSettings();
  const {
    localPrivacyModeActive,
    togglePrivacyMode,
  } = useChatContext();

  const handleCopyChat = async () => {
    if (messages.length === 0) return;
    const text = exportChatAsText(messages);
    const ok = await copyToClipboard(text);
    toast({
      title: ok ? "📋 Copied!" : "Failed to copy",
      description: ok ? "Chat copied to clipboard" : "Try downloading instead",
    });
  };

  const handleDownloadChat = () => {
    if (messages.length === 0) return;
    const text = exportChatAsText(messages);
    downloadAsFile(text, `lchat-${Date.now()}.txt`);
    toast({
      title: "💾 Downloaded!",
      description: "Chat saved as text file",
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1.5 h-10 w-10 rounded-full border border-border/75 bg-card flex items-center justify-center text-foreground hover:bg-secondary transition-all active:scale-95 shadow-sm p-0 shrink-0",
            localPrivacyModeActive && "border-emerald-500/30 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]",
            triggerClassName
          )}
          title="More Features"
        >
          <Settings className="h-4.5 w-4.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-72 rounded-2xl border border-border bg-card p-4 shadow-xl z-50 glass-heavy flex flex-col gap-4 overflow-y-auto max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 pb-2 border-b border-border/40">
          <Settings className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Chat Tools</h4>
        </div>

        {/* Section 1: Search Messages */}
        {messages.length > 0 && onSearchResult && (
          <div className="space-y-1.5 pb-3 border-b border-border/40">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">Search Messages</span>
            <ChatSearchBar messages={messages} onSearchResult={onSearchResult} alwaysOpen />
          </div>
        )}

        {/* Section 2: Disappearing Messages */}
        <div className="space-y-2 pb-3 border-b border-border/40">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">Disappearing Messages</span>
          <div className="flex flex-wrap gap-1">
            {[
              { label: "Off", value: null },
              { label: "30s", value: 30 },
              { label: "1m", value: 60 },
              { label: "5m", value: 300 }
            ].map((opt) => (
              <button
                key={opt.label || "off"}
                onClick={() => onSetDisappearTimer?.(opt.value)}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all active:scale-95",
                  disappearTimer === opt.value
                    ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                    : "bg-muted border-border/40 text-foreground hover:bg-secondary"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Privacy & Protection */}
        <div className="space-y-2 pb-3 border-b border-border/40">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">Privacy & Screen Protection</span>
          <div className="flex flex-col gap-1.5">
            {/* Row 1: Privacy Mode */}
            <div className="flex items-center justify-between gap-3 py-1.5 px-2 rounded-lg hover:bg-muted/35 transition-colors">
              <label htmlFor="privacy-mode-switch" className="flex flex-col flex-1 cursor-pointer select-none">
                <span className="text-[11px] font-bold text-foreground">Privacy Mode</span>
                <span className="text-[9px] text-muted-foreground">Encrypt screen & block shots</span>
              </label>
              <Switch 
                id="privacy-mode-switch"
                checked={localPrivacyModeActive} 
                onCheckedChange={(c) => togglePrivacyMode(c)} 
              />
            </div>

            {/* Row 2: Alert Partner */}
            <div className="flex items-center justify-between gap-3 py-1.5 px-2 rounded-lg hover:bg-muted/35 transition-colors">
              <label htmlFor="alert-partner-switch" className="flex flex-col flex-1 cursor-pointer select-none">
                <span className="text-[11px] font-bold text-foreground">Alert Partner</span>
                <span className="text-[9px] text-muted-foreground">Notify peer on captures</span>
              </label>
              <Switch 
                id="alert-partner-switch"
                checked={settings.notifyAlerts} 
                onCheckedChange={(c) => updateSetting("notifyAlerts", c)} 
              />
            </div>

            {/* Row 3: Auto-Stop */}
            <div className="flex items-center justify-between gap-3 py-1.5 px-2 rounded-lg hover:bg-muted/35 transition-colors">
              <label htmlFor="auto-stop-switch" className="flex flex-col flex-1 cursor-pointer select-none">
                <span className="text-[11px] font-bold text-foreground">Auto-Stop Chat</span>
                <span className="text-[9px] text-muted-foreground">Disconnect if captured</span>
              </label>
              <Switch 
                id="auto-stop-switch"
                checked={settings.autoStopOnScreenshot} 
                onCheckedChange={(c) => updateSetting("autoStopOnScreenshot", c)} 
              />
            </div>
          </div>
        </div>

        {/* Section 4: Theme Settings */}
        {onThemeChange && (
          <div className="space-y-1.5 pb-3 border-b border-border/40">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">Chat Customization</span>
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-bold">Theme</span>
              <ChatThemePicker onApply={onThemeChange} />
            </div>
          </div>
        )}

        {/* Section 5: Chat Export & Safety */}
        <div className="space-y-1.5">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">Actions & Safety</span>
          <div className="flex flex-col gap-1.5">
            {messages.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyChat}
                  className="h-8 text-[11px] border border-border/40 gap-1 font-bold"
                >
                  <Copy className="h-3 w-3 text-primary" /> Copy Chat
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadChat}
                  className="h-8 text-[11px] border border-border/40 gap-1 font-bold"
                >
                  <Download className="h-3 w-3 text-primary" /> Download
                </Button>
              </div>
            )}
            <ReportBlockMenu onBlock={onBlock} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
