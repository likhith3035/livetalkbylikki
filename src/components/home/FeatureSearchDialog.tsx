import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  MessageSquare,
  Gamepad2,
  Code2,
  Bot,
  Share2,
  QrCode,
  Shield,
  User,
  Settings,
  Info,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";

interface FeatureSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FeatureSearchDialog: React.FC<FeatureSearchDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search features, games, tools..." />
      <CommandList className="max-h-[350px]">
        <CommandEmpty>No features found matching your search.</CommandEmpty>

        <CommandGroup heading="Connect & Chat">
          <CommandItem
            onSelect={() => runCommand(() => navigate("/chat"))}
            className="gap-2.5 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Start Anonymous Chat</span>
              <span className="text-[11px] text-muted-foreground">Match with random online strangers instantly</span>
            </div>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/handoff"))}
            className="gap-2.5 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Join via Code / QR</span>
              <span className="text-[11px] text-muted-foreground">Device handoff or join existing private room</span>
            </div>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Explore & Tools">
          <CommandItem
            onSelect={() => runCommand(() => navigate("/games"))}
            className="gap-2.5 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">1v1 Arcade Games</span>
              <span className="text-[11px] text-muted-foreground">11 Multiplayer games with strangers or friends</span>
            </div>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/code"))}
            className="gap-2.5 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Code Studio IDE</span>
              <span className="text-[11px] text-muted-foreground">Practice problems, cloud compilers, AI Copilot</span>
            </div>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/ai-chat"))}
            className="gap-2.5 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-pink-500/15 text-pink-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">AI Wingman</span>
              <span className="text-[11px] text-muted-foreground">Chat with AI assistants like Claude, GPT, Sarvam</span>
            </div>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/file-sharing"))}
            className="gap-2.5 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">P2P File Drop</span>
              <span className="text-[11px] text-muted-foreground">Direct peer-to-peer transfers with zero server logs</span>
            </div>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings & Info">
          <CommandItem
            onSelect={() => runCommand(() => navigate("/profile"))}
            className="gap-2.5 cursor-pointer"
          >
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">User Profile</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/settings"))}
            className="gap-2.5 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">App Settings</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/safety"))}
            className="gap-2.5 cursor-pointer"
          >
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Safety Center & Verification</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/info"))}
            className="gap-2.5 cursor-pointer"
          >
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">About IncogTalk</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
